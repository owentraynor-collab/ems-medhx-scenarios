import { ApiService } from './ApiService';
import { LearningAnalyticsService } from './LearningAnalyticsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StudentOverview {
  id: string;
  name: string;
  email: string;
  enrollmentDate: number;
  lastActive: number;
  progress: {
    overallScore: number;
    completionRate: number;
    timeSpent: number;
    moduleProgress: {
      [moduleId: string]: {
        completed: boolean;
        score: number;
        attempts: number;
        lastAttempt: number;
      };
    };
  };
  status: 'active' | 'inactive' | 'completed';
  flags: Array<{
    type: 'warning' | 'achievement' | 'milestone';
    message: string;
    timestamp: number;
  }>;
}

export interface CohortMetrics {
  totalStudents: number;
  activeStudents: number;
  averageScore: number;
  averageCompletion: number;
  moduleStats: {
    [moduleId: string]: {
      averageScore: number;
      completionRate: number;
      attemptRate: number;
      timeSpent: number;
    };
  };
  performanceDistribution: {
    ranges: string[];
    counts: number[];
  };
  activityTrend: Array<{
    date: string;
    activeUsers: number;
    completions: number;
    averageScore: number;
  }>;
}

export interface InterventionRecommendation {
  studentId: string;
  type: 'support' | 'challenge' | 'review';
  reason: string;
  suggestedActions: string[];
  priority: 'high' | 'medium' | 'low';
  moduleId?: string;
}

export interface ModuleInsights {
  moduleId: string;
  title: string;
  metrics: {
    difficulty: number;
    discriminationIndex: number;
    reliability: number;
    averageCompletionTime: number;
  };
  questionAnalysis: Array<{
    questionId: string;
    correctRate: number;
    averageAttempts: number;
    commonMistakes: string[];
  }>;
  improvements: Array<{
    target: 'content' | 'questions' | 'difficulty';
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

export class InstructorDashboardService {
  private static instance: InstructorDashboardService;
  private api: ApiService;
  private analytics: LearningAnalyticsService;
  private studentCache: Map<string, StudentOverview> = new Map();
  private cohortCache: Map<string, CohortMetrics> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.api = ApiService.getInstance();
    this.analytics = LearningAnalyticsService.getInstance();
  }

  static getInstance(): InstructorDashboardService {
    if (!InstructorDashboardService.instance) {
      InstructorDashboardService.instance = new InstructorDashboardService();
    }
    return InstructorDashboardService.instance;
  }

  async initialize(instructorId: string): Promise<void> {
    try {
      // Load cached data
      const cachedStudents = await AsyncStorage.getItem('instructor_students');
      if (cachedStudents) {
        const students = JSON.parse(cachedStudents);
        students.forEach((student: StudentOverview) => {
          this.studentCache.set(student.id, student);
        });
      }

      // Start periodic updates
      this.startPeriodicUpdates(instructorId);
    } catch (error) {
      console.error('Failed to initialize instructor dashboard:', error);
      throw error;
    }
  }

  private startPeriodicUpdates(instructorId: string): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      try {
        await this.refreshData(instructorId);
      } catch (error) {
        console.error('Failed to refresh instructor data:', error);
      }
    }, 5 * 60 * 1000); // Update every 5 minutes
  }

  private async refreshData(instructorId: string): Promise<void> {
    try {
      // Fetch latest data
      const [students, cohortMetrics] = await Promise.all([
        this.api.get(`/instructor/${instructorId}/students`),
        this.api.get(`/instructor/${instructorId}/cohort-metrics`),
      ]);

      // Update caches
      students.forEach((student: StudentOverview) => {
        this.studentCache.set(student.id, student);
      });
      this.cohortCache.set(instructorId, cohortMetrics);

      // Update local storage
      await AsyncStorage.setItem('instructor_students', JSON.stringify(students));
      await AsyncStorage.setItem(
        'instructor_cohort_metrics',
        JSON.stringify(cohortMetrics)
      );
    } catch (error) {
      console.error('Failed to refresh data:', error);
      throw error;
    }
  }

  async getStudentOverview(studentId: string): Promise<StudentOverview> {
    try {
      // Try API first
      const student = await this.api.get(`/students/${studentId}/overview`);
      this.studentCache.set(studentId, student);
      return student;
    } catch (error) {
      // Fallback to cache
      const cached = this.studentCache.get(studentId);
      if (cached) {
        return cached;
      }
      throw error;
    }
  }

  async getStudentList(
    instructorId: string,
    filters?: {
      status?: string[];
      moduleId?: string;
      scoreRange?: { min: number; max: number };
      searchTerm?: string;
    }
  ): Promise<StudentOverview[]> {
    try {
      const students = await this.api.get('/instructor/students', {
        instructorId,
        ...filters,
      });
      
      // Update cache
      students.forEach((student: StudentOverview) => {
        this.studentCache.set(student.id, student);
      });

      return students;
    } catch (error) {
      // Fallback to cache and apply filters locally
      const cachedStudents = Array.from(this.studentCache.values());
      return this.filterStudents(cachedStudents, filters);
    }
  }

  private filterStudents(
    students: StudentOverview[],
    filters?: {
      status?: string[];
      moduleId?: string;
      scoreRange?: { min: number; max: number };
      searchTerm?: string;
    }
  ): StudentOverview[] {
    if (!filters) return students;

    return students.filter(student => {
      if (filters.status && !filters.status.includes(student.status)) {
        return false;
      }

      if (
        filters.moduleId &&
        !student.progress.moduleProgress[filters.moduleId]?.completed
      ) {
        return false;
      }

      if (filters.scoreRange) {
        const score = student.progress.overallScore;
        if (
          score < filters.scoreRange.min ||
          score > filters.scoreRange.max
        ) {
          return false;
        }
      }

      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        return (
          student.name.toLowerCase().includes(term) ||
          student.email.toLowerCase().includes(term)
        );
      }

      return true;
    });
  }

  async getCohortMetrics(instructorId: string): Promise<CohortMetrics> {
    try {
      // Try API first
      const metrics = await this.api.get(`/instructor/${instructorId}/metrics`);
      this.cohortCache.set(instructorId, metrics);
      return metrics;
    } catch (error) {
      // Fallback to cache
      const cached = this.cohortCache.get(instructorId);
      if (cached) {
        return cached;
      }
      throw error;
    }
  }

  async getInterventionRecommendations(
    instructorId: string
  ): Promise<InterventionRecommendation[]> {
    try {
      return await this.api.get(
        `/instructor/${instructorId}/recommendations`
      );
    } catch (error) {
      console.error('Failed to get intervention recommendations:', error);
      return [];
    }
  }

  async getModuleInsights(moduleId: string): Promise<ModuleInsights> {
    try {
      return await this.api.get(`/instructor/modules/${moduleId}/insights`);
    } catch (error) {
      console.error('Failed to get module insights:', error);
      throw error;
    }
  }

  async generateStudentReport(
    studentId: string,
    options: {
      timeframe?: 'week' | 'month' | 'all';
      includeModules?: string[];
      format?: 'pdf' | 'csv';
    } = {}
  ): Promise<string> {
    try {
      const report = await this.api.post('/instructor/reports/student', {
        studentId,
        ...options,
      });
      return report.url;
    } catch (error) {
      console.error('Failed to generate student report:', error);
      throw error;
    }
  }

  async generateCohortReport(
    instructorId: string,
    options: {
      timeframe?: 'week' | 'month' | 'all';
      groupBy?: 'module' | 'status' | 'performance';
      format?: 'pdf' | 'csv';
    } = {}
  ): Promise<string> {
    try {
      const report = await this.api.post('/instructor/reports/cohort', {
        instructorId,
        ...options,
      });
      return report.url;
    } catch (error) {
      console.error('Failed to generate cohort report:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.studentCache.clear();
    this.cohortCache.clear();
  }
}

export default InstructorDashboardService;

