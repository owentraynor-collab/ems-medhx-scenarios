import { ApiService } from './ApiService';
import { SyncService } from './SyncService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ContentSection {
  id: string;
  title: string;
  content: string;
  order: number;
  type: 'text' | 'image' | 'video' | 'interactive';
  mediaUrl?: string;
  interactiveData?: any;
  tags: string[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  category: 'chief_complaint' | 'hpi' | 'pmh' | 'meds_allergies';
  sections: ContentSection[];
  prerequisites: string[];
  estimatedDuration: number;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  version: string;
  lastUpdated: number;
}

export interface ModuleProgress {
  userId: string;
  moduleId: string;
  completedSections: string[];
  lastAccessedSection: string;
  timeSpent: number;
  lastAccessed: number;
  completed: boolean;
  notes: string[];
}

export class EducationalContentService {
  private static instance: EducationalContentService;
  private api: ApiService;
  private sync: SyncService;
  private moduleCache: Map<string, Module> = new Map();
  private progressCache: Map<string, ModuleProgress> = new Map();

  private constructor() {
    this.api = ApiService.getInstance();
    this.sync = SyncService.getInstance();
    this.initializeCache();
  }

  static getInstance(): EducationalContentService {
    if (!EducationalContentService.instance) {
      EducationalContentService.instance = new EducationalContentService();
    }
    return EducationalContentService.instance;
  }

  private async initializeCache(): Promise<void> {
    try {
      // Load cached modules
      const cachedModules = await AsyncStorage.getItem('educational_modules');
      if (cachedModules) {
        const modules = JSON.parse(cachedModules);
        modules.forEach((module: Module) => {
          this.moduleCache.set(module.id, module);
        });
      }

      // Load cached progress
      const cachedProgress = await AsyncStorage.getItem('module_progress');
      if (cachedProgress) {
        const progress = JSON.parse(cachedProgress);
        progress.forEach((p: ModuleProgress) => {
          this.progressCache.set(`${p.userId}-${p.moduleId}`, p);
        });
      }
    } catch (error) {
      console.error('Failed to initialize content cache:', error);
    }
  }

  async getModules(category?: string): Promise<Module[]> {
    try {
      // Try to fetch from API first
      const modules = await this.api.get('/modules', { category });
      
      // Update cache
      modules.forEach((module: Module) => {
        this.moduleCache.set(module.id, module);
      });
      await AsyncStorage.setItem('educational_modules', JSON.stringify(modules));
      
      return modules;
    } catch (error) {
      // Fallback to cache
      const cachedModules = Array.from(this.moduleCache.values());
      return category
        ? cachedModules.filter(m => m.category === category)
        : cachedModules;
    }
  }

  async getModule(moduleId: string): Promise<Module | null> {
    try {
      // Try API first
      const module = await this.api.get(`/modules/${moduleId}`);
      this.moduleCache.set(moduleId, module);
      return module;
    } catch (error) {
      // Fallback to cache
      return this.moduleCache.get(moduleId) || null;
    }
  }

  async getModuleProgress(userId: string, moduleId: string): Promise<ModuleProgress> {
    const cacheKey = `${userId}-${moduleId}`;
    try {
      // Try API first
      const progress = await this.api.get(`/modules/${moduleId}/progress/${userId}`);
      this.progressCache.set(cacheKey, progress);
      return progress;
    } catch (error) {
      // Fallback to cache or create new
      return (
        this.progressCache.get(cacheKey) || {
          userId,
          moduleId,
          completedSections: [],
          lastAccessedSection: '',
          timeSpent: 0,
          lastAccessed: Date.now(),
          completed: false,
          notes: [],
        }
      );
    }
  }

  async updateProgress(
    userId: string,
    moduleId: string,
    update: Partial<ModuleProgress>
  ): Promise<ModuleProgress> {
    const cacheKey = `${userId}-${moduleId}`;
    const currentProgress = await this.getModuleProgress(userId, moduleId);
    const updatedProgress = {
      ...currentProgress,
      ...update,
      lastAccessed: Date.now(),
    };

    try {
      // Update API
      await this.api.put(`/modules/${moduleId}/progress/${userId}`, updatedProgress);
    } catch (error) {
      console.error('Failed to update progress on server:', error);
    }

    // Update local cache
    this.progressCache.set(cacheKey, updatedProgress);
    await this.syncProgress();

    return updatedProgress;
  }

  async completeSection(
    userId: string,
    moduleId: string,
    sectionId: string
  ): Promise<ModuleProgress> {
    const progress = await this.getModuleProgress(userId, moduleId);
    if (!progress.completedSections.includes(sectionId)) {
      progress.completedSections.push(sectionId);
    }

    const module = await this.getModule(moduleId);
    if (module) {
      const allSections = module.sections.map(s => s.id);
      const isModuleCompleted = allSections.every(s => 
        progress.completedSections.includes(s)
      );

      return this.updateProgress(userId, moduleId, {
        completedSections: progress.completedSections,
        completed: isModuleCompleted,
      });
    }

    return progress;
  }

  async addNote(
    userId: string,
    moduleId: string,
    note: string
  ): Promise<ModuleProgress> {
    const progress = await this.getModuleProgress(userId, moduleId);
    progress.notes.push(note);
    return this.updateProgress(userId, moduleId, {
      notes: progress.notes,
    });
  }

  async updateTimeSpent(
    userId: string,
    moduleId: string,
    additionalTime: number
  ): Promise<ModuleProgress> {
    const progress = await this.getModuleProgress(userId, moduleId);
    return this.updateProgress(userId, moduleId, {
      timeSpent: progress.timeSpent + additionalTime,
    });
  }

  private async syncProgress(): Promise<void> {
    const progress = Array.from(this.progressCache.values());
    await AsyncStorage.setItem('module_progress', JSON.stringify(progress));

    try {
      await this.sync.syncData('module_progress', progress);
    } catch (error) {
      console.error('Failed to sync progress:', error);
    }
  }

  async getRecommendedModules(userId: string): Promise<Module[]> {
    try {
      // Get recommendations from API
      const recommended = await this.api.get(`/users/${userId}/recommended-modules`);
      return recommended;
    } catch (error) {
      // Fallback to basic recommendations based on cached data
      const completed = Array.from(this.progressCache.values())
        .filter(p => p.userId === userId && p.completed)
        .map(p => p.moduleId);

      const allModules = Array.from(this.moduleCache.values());
      return allModules
        .filter(m => !completed.includes(m.id))
        .slice(0, 3);
    }
  }

  async searchContent(query: string): Promise<Module[]> {
    try {
      // Search via API
      const results = await this.api.get('/modules/search', { query });
      return results;
    } catch (error) {
      // Fallback to local search
      const allModules = Array.from(this.moduleCache.values());
      const searchTerms = query.toLowerCase().split(' ');
      
      return allModules.filter(module => {
        const searchText = `
          ${module.title} 
          ${module.description} 
          ${module.sections.map(s => s.title).join(' ')}
          ${module.tags.join(' ')}
        `.toLowerCase();

        return searchTerms.every(term => searchText.includes(term));
      });
    }
  }

  async downloadModuleContent(moduleId: string): Promise<boolean> {
    try {
      const module = await this.getModule(moduleId);
      if (!module) return false;

      // Download and cache media content
      for (const section of module.sections) {
        if (section.mediaUrl) {
          const mediaContent = await this.api.get(section.mediaUrl);
          await AsyncStorage.setItem(
            `media_${section.id}`,
            JSON.stringify(mediaContent)
          );
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to download module content:', error);
      return false;
    }
  }

  async clearCache(): Promise<void> {
    this.moduleCache.clear();
    this.progressCache.clear();
    await AsyncStorage.multiRemove([
      'educational_modules',
      'module_progress',
    ]);
  }
}

export default EducationalContentService;

