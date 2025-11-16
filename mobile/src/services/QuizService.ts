import { ApiService } from './ApiService';
import { StudentTrackingService } from './StudentTrackingService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QuizQuestion {
  id: string;
  moduleId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  tags: string[];
  category: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  moduleId: string;
  questions: string[];
  answers: { [questionId: string]: number };
  score: number;
  startTime: number;
  endTime: number;
  completed: boolean;
}

export interface QuizFeedback {
  questionId: string;
  correct: boolean;
  selectedAnswer: number;
  explanation: string;
  relatedTopics?: string[];
  recommendedResources?: string[];
}

export class QuizService {
  private static instance: QuizService;
  private api: ApiService;
  private trackingService: StudentTrackingService;
  private currentAttempt: QuizAttempt | null = null;
  private questionCache: Map<string, QuizQuestion[]> = new Map();

  private constructor() {
    this.api = ApiService.getInstance();
    this.trackingService = StudentTrackingService.getInstance();
  }

  static getInstance(): QuizService {
    if (!QuizService.instance) {
      QuizService.instance = new QuizService();
    }
    return QuizService.instance;
  }

  async startQuiz(moduleId: string, userId: string, questionCount: number = 5): Promise<QuizAttempt> {
    try {
      // Get available questions for the module
      const questions = await this.getModuleQuestions(moduleId);
      
      // Randomly select questions
      const selectedQuestions = this.selectRandomQuestions(questions, questionCount);
      
      // Create new attempt
      const attempt: QuizAttempt = {
        id: `${moduleId}-${Date.now()}`,
        userId,
        moduleId,
        questions: selectedQuestions.map(q => q.id),
        answers: {},
        score: 0,
        startTime: Date.now(),
        endTime: 0,
        completed: false,
      };

      // Save attempt locally
      await this.saveAttempt(attempt);
      this.currentAttempt = attempt;

      // Track activity
      await this.trackingService.trackActivity({
        userId,
        moduleId,
        activityType: 'quiz',
        duration: 0,
        progress: 0,
        completionStatus: 'started',
        metadata: {
          attemptId: attempt.id,
          questionCount,
        },
      });

      return attempt;
    } catch (error) {
      console.error('Failed to start quiz:', error);
      throw new Error('Failed to start quiz');
    }
  }

  private async getModuleQuestions(moduleId: string): Promise<QuizQuestion[]> {
    try {
      // Check cache first
      if (this.questionCache.has(moduleId)) {
        return this.questionCache.get(moduleId)!;
      }

      // Fetch from API
      const questions = await this.api.get(`/modules/${moduleId}/questions`);
      
      // Update cache
      this.questionCache.set(moduleId, questions);
      
      return questions;
    } catch (error) {
      // Fallback to local storage
      const cached = await AsyncStorage.getItem(`quiz_questions_${moduleId}`);
      if (cached) {
        return JSON.parse(cached);
      }
      throw error;
    }
  }

  private selectRandomQuestions(questions: QuizQuestion[], count: number): QuizQuestion[] {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  async submitAnswer(questionId: string, answer: number): Promise<QuizFeedback> {
    if (!this.currentAttempt) {
      throw new Error('No active quiz attempt');
    }

    try {
      // Get question details
      const questions = await this.getModuleQuestions(this.currentAttempt.moduleId);
      const question = questions.find(q => q.id === questionId);
      
      if (!question) {
        throw new Error('Question not found');
      }

      // Record answer
      this.currentAttempt.answers[questionId] = answer;
      
      // Generate feedback
      const feedback: QuizFeedback = {
        questionId,
        correct: answer === question.correctAnswer,
        selectedAnswer: answer,
        explanation: question.explanation,
        relatedTopics: question.tags,
        recommendedResources: await this.getRecommendedResources(question.category),
      };

      // Save progress
      await this.saveAttempt(this.currentAttempt);

      return feedback;
    } catch (error) {
      console.error('Failed to submit answer:', error);
      throw new Error('Failed to submit answer');
    }
  }

  async completeQuiz(): Promise<{ score: number; feedback: QuizFeedback[] }> {
    if (!this.currentAttempt) {
      throw new Error('No active quiz attempt');
    }

    try {
      const questions = await this.getModuleQuestions(this.currentAttempt.moduleId);
      let correctAnswers = 0;
      const feedback: QuizFeedback[] = [];

      // Calculate score and generate feedback
      for (const questionId of this.currentAttempt.questions) {
        const question = questions.find(q => q.id === questionId);
        const answer = this.currentAttempt.answers[questionId];
        
        if (question) {
          const isCorrect = answer === question.correctAnswer;
          if (isCorrect) correctAnswers++;

          feedback.push({
            questionId,
            correct: isCorrect,
            selectedAnswer: answer,
            explanation: question.explanation,
            relatedTopics: question.tags,
            recommendedResources: await this.getRecommendedResources(question.category),
          });
        }
      }

      // Update attempt
      this.currentAttempt.score = (correctAnswers / this.currentAttempt.questions.length) * 100;
      this.currentAttempt.endTime = Date.now();
      this.currentAttempt.completed = true;

      // Save final attempt
      await this.saveAttempt(this.currentAttempt);

      // Track completion
      await this.trackingService.trackActivity({
        userId: this.currentAttempt.userId,
        moduleId: this.currentAttempt.moduleId,
        activityType: 'quiz',
        duration: this.currentAttempt.endTime - this.currentAttempt.startTime,
        progress: 100,
        score: this.currentAttempt.score,
        completionStatus: 'completed',
        metadata: {
          attemptId: this.currentAttempt.id,
          correctAnswers,
          totalQuestions: this.currentAttempt.questions.length,
        },
      });

      return {
        score: this.currentAttempt.score,
        feedback,
      };
    } catch (error) {
      console.error('Failed to complete quiz:', error);
      throw new Error('Failed to complete quiz');
    }
  }

  private async saveAttempt(attempt: QuizAttempt): Promise<void> {
    try {
      // Save to API
      await this.api.post('/quiz/attempts', attempt);
    } catch (error) {
      // Fallback to local storage
      const attempts = await this.getLocalAttempts();
      attempts.push(attempt);
      await AsyncStorage.setItem('quiz_attempts', JSON.stringify(attempts));
    }
  }

  private async getLocalAttempts(): Promise<QuizAttempt[]> {
    const stored = await AsyncStorage.getItem('quiz_attempts');
    return stored ? JSON.parse(stored) : [];
  }

  async getQuizHistory(userId: string, moduleId?: string): Promise<QuizAttempt[]> {
    try {
      // Get from API
      const attempts = await this.api.get('/quiz/attempts', {
        userId,
        moduleId,
      });
      return attempts;
    } catch (error) {
      // Fallback to local storage
      const attempts = await this.getLocalAttempts();
      return attempts.filter(a => 
        a.userId === userId && 
        (!moduleId || a.moduleId === moduleId)
      );
    }
  }

  private async getRecommendedResources(category: string): Promise<string[]> {
    try {
      const resources = await this.api.get(`/resources/${category}`);
      return resources.map((r: any) => r.title);
    } catch {
      return [];
    }
  }

  async syncLocalAttempts(): Promise<void> {
    try {
      const attempts = await this.getLocalAttempts();
      if (attempts.length === 0) return;

      // Sync with server
      await this.api.post('/quiz/attempts/sync', attempts);
      
      // Clear local storage
      await AsyncStorage.removeItem('quiz_attempts');
    } catch (error) {
      console.error('Failed to sync attempts:', error);
    }
  }
}

export default QuizService;

