import { ApiService } from './ApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ContentItem {
  id: string;
  type: 'module' | 'quiz' | 'scenario' | 'assessment';
  title: string;
  description: string;
  content: any;
  metadata: {
    author: string;
    createdAt: number;
    updatedAt: number;
    version: string;
    status: 'draft' | 'review' | 'published' | 'archived';
    tags: string[];
    difficulty: 'basic' | 'intermediate' | 'advanced';
    prerequisites?: string[];
    estimatedDuration?: number;
  };
  validation: {
    required: boolean;
    rules: Array<{
      type: string;
      params: any;
      message: string;
    }>;
  };
}

export interface ContentVersion {
  id: string;
  contentId: string;
  version: string;
  changes: string[];
  content: any;
  author: string;
  timestamp: number;
  status: 'draft' | 'review' | 'published' | 'archived';
}

export interface ContentTemplate {
  id: string;
  type: string;
  name: string;
  description: string;
  structure: {
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
      validation?: any;
      options?: any[];
    }>;
    sections?: Array<{
      name: string;
      fields: string[];
    }>;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
}

export class ContentManagementService {
  private static instance: ContentManagementService;
  private api: ApiService;
  private contentCache: Map<string, ContentItem> = new Map();
  private templateCache: Map<string, ContentTemplate> = new Map();
  private versionCache: Map<string, ContentVersion[]> = new Map();

  private constructor() {
    this.api = ApiService.getInstance();
  }

  static getInstance(): ContentManagementService {
    if (!ContentManagementService.instance) {
      ContentManagementService.instance = new ContentManagementService();
    }
    return ContentManagementService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Load templates
      const templates = await this.api.get('/content/templates');
      templates.forEach((template: ContentTemplate) => {
        this.templateCache.set(template.id, template);
      });

      // Cache templates locally
      await AsyncStorage.setItem('content_templates', JSON.stringify(templates));
    } catch (error) {
      // Load from cache if available
      const cached = await AsyncStorage.getItem('content_templates');
      if (cached) {
        JSON.parse(cached).forEach((template: ContentTemplate) => {
          this.templateCache.set(template.id, template);
        });
      }
    }
  }

  async createContent(
    type: string,
    content: any,
    metadata: Partial<ContentItem['metadata']>
  ): Promise<ContentItem> {
    try {
      // Validate content against template
      const template = await this.getTemplate(type);
      const validation = await this.validateContent(content, template);
      
      if (!validation.isValid) {
        throw new Error(
          `Invalid content: ${validation.errors
            .map(e => e.message)
            .join(', ')}`
        );
      }

      // Create content item
      const contentItem: ContentItem = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        type,
        title: content.title || '',
        description: content.description || '',
        content,
        metadata: {
          author: metadata.author || '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: '1.0.0',
          status: 'draft',
          tags: metadata.tags || [],
          difficulty: metadata.difficulty || 'basic',
          prerequisites: metadata.prerequisites,
          estimatedDuration: metadata.estimatedDuration,
        },
        validation: {
          required: template.structure.fields.some(f => f.required),
          rules: template.structure.fields
            .filter(f => f.validation)
            .map(f => ({
              type: f.validation.type,
              params: f.validation.params,
              message: f.validation.message,
            })),
        },
      };

      // Save to server
      const saved = await this.api.post('/content', contentItem);
      
      // Update cache
      this.contentCache.set(saved.id, saved);
      
      return saved;
    } catch (error) {
      console.error('Failed to create content:', error);
      throw error;
    }
  }

  async updateContent(
    id: string,
    updates: Partial<ContentItem>
  ): Promise<ContentItem> {
    try {
      const current = await this.getContent(id);
      if (!current) {
        throw new Error('Content not found');
      }

      // Validate updates
      const template = await this.getTemplate(current.type);
      const validation = await this.validateContent(
        { ...current.content, ...updates.content },
        template
      );

      if (!validation.isValid) {
        throw new Error(
          `Invalid content: ${validation.errors
            .map(e => e.message)
            .join(', ')}`
        );
      }

      // Create new version
      const version: ContentVersion = {
        id: `${id}-v${Date.now()}`,
        contentId: id,
        version: this.incrementVersion(current.metadata.version),
        changes: this.generateChangeLog(current, updates),
        content: updates.content || current.content,
        author: updates.metadata?.author || current.metadata.author,
        timestamp: Date.now(),
        status: updates.metadata?.status || current.metadata.status,
      };

      // Save version
      await this.api.post(`/content/${id}/versions`, version);

      // Update content
      const updated: ContentItem = {
        ...current,
        ...updates,
        metadata: {
          ...current.metadata,
          ...updates.metadata,
          updatedAt: Date.now(),
          version: version.version,
        },
      };

      // Save updates
      const saved = await this.api.put(`/content/${id}`, updated);
      
      // Update caches
      this.contentCache.set(saved.id, saved);
      const versions = this.versionCache.get(id) || [];
      this.versionCache.set(id, [...versions, version]);

      return saved;
    } catch (error) {
      console.error('Failed to update content:', error);
      throw error;
    }
  }

  async getContent(id: string): Promise<ContentItem | null> {
    try {
      // Try cache first
      if (this.contentCache.has(id)) {
        return this.contentCache.get(id)!;
      }

      // Fetch from server
      const content = await this.api.get(`/content/${id}`);
      this.contentCache.set(id, content);
      return content;
    } catch (error) {
      console.error('Failed to get content:', error);
      return null;
    }
  }

  async listContent(
    filters?: {
      type?: string;
      status?: string[];
      tags?: string[];
      author?: string;
      search?: string;
    }
  ): Promise<ContentItem[]> {
    try {
      const content = await this.api.get('/content', filters);
      
      // Update cache
      content.forEach((item: ContentItem) => {
        this.contentCache.set(item.id, item);
      });

      return content;
    } catch (error) {
      console.error('Failed to list content:', error);
      return [];
    }
  }

  async getTemplate(type: string): Promise<ContentTemplate> {
    if (this.templateCache.has(type)) {
      return this.templateCache.get(type)!;
    }

    throw new Error(`Template not found for type: ${type}`);
  }

  async getVersionHistory(contentId: string): Promise<ContentVersion[]> {
    try {
      // Try cache first
      if (this.versionCache.has(contentId)) {
        return this.versionCache.get(contentId)!;
      }

      // Fetch from server
      const versions = await this.api.get(`/content/${contentId}/versions`);
      this.versionCache.set(contentId, versions);
      return versions;
    } catch (error) {
      console.error('Failed to get version history:', error);
      return [];
    }
  }

  async validateContent(
    content: any,
    template: ContentTemplate
  ): Promise<ValidationResult> {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];

    // Check required fields
    template.structure.fields.forEach(field => {
      if (field.required && !content[field.name]) {
        errors.push({
          field: field.name,
          message: `${field.name} is required`,
        });
      }
    });

    // Check field types and validation rules
    template.structure.fields.forEach(field => {
      const value = content[field.name];
      if (value !== undefined) {
        // Type validation
        if (!this.validateType(value, field.type)) {
          errors.push({
            field: field.name,
            message: `${field.name} must be of type ${field.type}`,
          });
        }

        // Custom validation rules
        if (field.validation) {
          const validationResult = this.runValidationRules(
            value,
            field.validation
          );
          errors.push(...validationResult.errors);
          warnings.push(...validationResult.warnings);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null;
      default:
        return true;
    }
  }

  private runValidationRules(
    value: any,
    rules: any
  ): { errors: any[]; warnings: any[] } {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Implement custom validation rules here
    // Example: length, range, pattern matching, etc.

    return { errors, warnings };
  }

  private incrementVersion(version: string): string {
    const [major, minor, patch] = version.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  private generateChangeLog(
    current: ContentItem,
    updates: Partial<ContentItem>
  ): string[] {
    const changes: string[] = [];

    // Compare and log changes
    if (updates.title !== current.title) {
      changes.push(`Updated title`);
    }
    if (updates.description !== current.description) {
      changes.push(`Updated description`);
    }
    if (updates.metadata?.status !== current.metadata.status) {
      changes.push(`Changed status to ${updates.metadata?.status}`);
    }
    if (updates.content) {
      changes.push(`Updated content`);
    }

    return changes;
  }

  async cleanup(): Promise<void> {
    this.contentCache.clear();
    this.templateCache.clear();
    this.versionCache.clear();
  }
}

export default ContentManagementService;

