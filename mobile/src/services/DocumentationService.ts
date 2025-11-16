import { ApiService } from './ApiService';
import { StudentTrackingService } from './StudentTrackingService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DocumentationTemplate {
  id: string;
  name: string;
  type: 'medical' | 'trauma' | 'cardiac' | 'stroke' | 'general';
  sections: DocumentationSection[];
  requiredFields: string[];
  version: string;
}

export interface DocumentationSection {
  id: string;
  title: string;
  fields: DocumentationField[];
  order: number;
  conditional?: {
    dependsOn: string;
    value: any;
  };
}

export interface DocumentationField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'datetime';
  options?: string[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    customValidation?: string;
  };
  defaultValue?: any;
  placeholder?: string;
  helpText?: string;
  order: number;
}

export interface DocumentationEntry {
  id: string;
  templateId: string;
  userId: string;
  scenarioId?: string;
  values: { [fieldId: string]: any };
  completedSections: string[];
  status: 'draft' | 'completed' | 'reviewed';
  score?: number;
  feedback?: DocumentationFeedback;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentationFeedback {
  overallScore: number;
  completeness: number;
  accuracy: number;
  organization: number;
  comments: {
    sectionId: string;
    fieldId?: string;
    type: 'error' | 'warning' | 'suggestion' | 'positive';
    message: string;
  }[];
  recommendations: string[];
}

export interface AutoCompleteData {
  type: string;
  suggestions: {
    text: string;
    context?: string;
    frequency?: number;
  }[];
}

export class DocumentationService {
  private static instance: DocumentationService;
  private api: ApiService;
  private tracking: StudentTrackingService;
  private templates: Map<string, DocumentationTemplate> = new Map();
  private currentEntry: DocumentationEntry | null = null;
  private autoCompleteData: Map<string, AutoCompleteData> = new Map();

  private constructor() {
    this.api = ApiService.getInstance();
    this.tracking = StudentTrackingService.getInstance();
    this.initializeData();
  }

  static getInstance(): DocumentationService {
    if (!DocumentationService.instance) {
      DocumentationService.instance = new DocumentationService();
    }
    return DocumentationService.instance;
  }

  private async initializeData(): Promise<void> {
    try {
      // Load templates
      const templates = await this.api.get('/documentation/templates');
      templates.forEach((template: DocumentationTemplate) => {
        this.templates.set(template.id, template);
      });

      // Load autocomplete data
      const autoComplete = await this.api.get('/documentation/autocomplete');
      autoComplete.forEach((data: AutoCompleteData) => {
        this.autoCompleteData.set(data.type, data);
      });

      // Cache data locally
      await AsyncStorage.setItem('documentation_templates', JSON.stringify(templates));
      await AsyncStorage.setItem('documentation_autocomplete', JSON.stringify(autoComplete));
    } catch (error) {
      // Load from cache if available
      try {
        const cachedTemplates = await AsyncStorage.getItem('documentation_templates');
        const cachedAutoComplete = await AsyncStorage.getItem('documentation_autocomplete');

        if (cachedTemplates) {
          JSON.parse(cachedTemplates).forEach((template: DocumentationTemplate) => {
            this.templates.set(template.id, template);
          });
        }

        if (cachedAutoComplete) {
          JSON.parse(cachedAutoComplete).forEach((data: AutoCompleteData) => {
            this.autoCompleteData.set(data.type, data);
          });
        }
      } catch (cacheError) {
        console.error('Failed to load documentation data from cache:', cacheError);
      }
    }
  }

  async startDocumentation(
    userId: string,
    templateId: string,
    scenarioId?: string
  ): Promise<DocumentationEntry> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    try {
      const entry: DocumentationEntry = {
        id: `${templateId}-${Date.now()}`,
        templateId,
        userId,
        scenarioId,
        values: {},
        completedSections: [],
        status: 'draft',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Initialize with default values
      template.sections.forEach(section => {
        section.fields.forEach(field => {
          if (field.defaultValue !== undefined) {
            entry.values[field.id] = field.defaultValue;
          }
        });
      });

      // Save to server
      const savedEntry = await this.api.post('/documentation/entries', entry);
      this.currentEntry = savedEntry;

      // Track activity
      await this.tracking.trackActivity({
        userId,
        moduleId: templateId,
        activityType: 'documentation',
        duration: 0,
        progress: 0,
        completionStatus: 'started',
        metadata: {
          entryId: savedEntry.id,
          templateType: template.type,
        },
      });

      return savedEntry;
    } catch (error) {
      console.error('Failed to start documentation:', error);
      throw new Error('Failed to start documentation');
    }
  }

  async updateField(fieldId: string, value: any): Promise<void> {
    if (!this.currentEntry) {
      throw new Error('No active documentation entry');
    }

    try {
      this.currentEntry.values[fieldId] = value;
      this.currentEntry.updatedAt = Date.now();

      // Update on server
      await this.api.put(
        `/documentation/entries/${this.currentEntry.id}/field`,
        {
          fieldId,
          value,
        }
      );

      // Save locally
      await this.saveCurrentEntry();
    } catch (error) {
      console.error('Failed to update field:', error);
      throw new Error('Failed to update field');
    }
  }

  async completeSection(sectionId: string): Promise<void> {
    if (!this.currentEntry) {
      throw new Error('No active documentation entry');
    }

    try {
      if (!this.currentEntry.completedSections.includes(sectionId)) {
        this.currentEntry.completedSections.push(sectionId);
        this.currentEntry.updatedAt = Date.now();

        // Update on server
        await this.api.put(
          `/documentation/entries/${this.currentEntry.id}/section`,
          {
            sectionId,
            completed: true,
          }
        );

        // Save locally
        await this.saveCurrentEntry();
      }
    } catch (error) {
      console.error('Failed to complete section:', error);
      throw new Error('Failed to complete section');
    }
  }

  async submitForReview(): Promise<DocumentationFeedback> {
    if (!this.currentEntry) {
      throw new Error('No active documentation entry');
    }

    try {
      // Get feedback from server
      const feedback = await this.api.post(
        `/documentation/entries/${this.currentEntry.id}/review`
      );

      // Update entry
      this.currentEntry.status = 'completed';
      this.currentEntry.feedback = feedback;
      this.currentEntry.score = feedback.overallScore;
      this.currentEntry.updatedAt = Date.now();

      // Save updates
      await this.saveCurrentEntry();

      // Track completion
      await this.tracking.trackActivity({
        userId: this.currentEntry.userId,
        moduleId: this.currentEntry.templateId,
        activityType: 'documentation',
        duration: this.currentEntry.updatedAt - this.currentEntry.createdAt,
        progress: 100,
        score: feedback.overallScore,
        completionStatus: 'completed',
        metadata: {
          entryId: this.currentEntry.id,
          completeness: feedback.completeness,
          accuracy: feedback.accuracy,
          organization: feedback.organization,
        },
      });

      return feedback;
    } catch (error) {
      console.error('Failed to submit for review:', error);
      throw new Error('Failed to submit for review');
    }
  }

  getAutoCompleteSuggestions(type: string, partial: string): string[] {
    const data = this.autoCompleteData.get(type);
    if (!data) return [];

    const normalizedPartial = partial.toLowerCase();
    return data.suggestions
      .filter(s => s.text.toLowerCase().includes(normalizedPartial))
      .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
      .map(s => s.text);
  }

  async getDocumentationHistory(
    userId: string,
    templateType?: string
  ): Promise<DocumentationEntry[]> {
    try {
      return await this.api.get('/documentation/history', {
        userId,
        templateType,
      });
    } catch (error) {
      console.error('Failed to get documentation history:', error);
      return [];
    }
  }

  getTemplate(templateId: string): DocumentationTemplate | null {
    return this.templates.get(templateId) || null;
  }

  getCurrentEntry(): DocumentationEntry | null {
    return this.currentEntry;
  }

  private async saveCurrentEntry(): Promise<void> {
    if (!this.currentEntry) return;

    try {
      // Save to local storage
      await AsyncStorage.setItem(
        `documentation_entry_${this.currentEntry.id}`,
        JSON.stringify(this.currentEntry)
      );

      // Update on server
      await this.api.put(
        `/documentation/entries/${this.currentEntry.id}`,
        this.currentEntry
      );
    } catch (error) {
      console.error('Failed to save documentation entry:', error);
    }
  }

  async cleanup(): Promise<void> {
    this.currentEntry = null;
  }
}

export default DocumentationService;

