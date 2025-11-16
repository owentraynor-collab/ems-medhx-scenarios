import axios, { AxiosInstance } from 'axios';
import { LocalStorageService } from './LocalStorageService';
import NetInfo from '@react-native-community/netinfo';

class ApiService {
  private api: AxiosInstance;
  private static instance: ApiService;
  private offlineQueue: Array<{
    method: string;
    endpoint: string;
    data?: any;
    retries: number;
  }> = [];

  private constructor() {
    this.api = axios.create({
      baseURL: process.env.API_URL || 'http://localhost:3000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.startOfflineQueueProcessor();
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private setupInterceptors(): void {
    this.api.interceptors.request.use(
      async (config) => {
        const token = await LocalStorageService.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (!error.response) {
          // Network error - queue request for offline processing
          await this.addToOfflineQueue(error.config);
          throw new Error('Network Error - Request queued for offline processing');
        }

        if (error.response.status === 401) {
          // Handle token refresh
          try {
            const newToken = await this.refreshToken();
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return this.api.request(error.config);
          } catch (refreshError) {
            await LocalStorageService.clearAuthToken();
            throw new Error('Authentication expired');
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Student Performance APIs
  async getStudentPerformance(studentId: string, timeRange?: string): Promise<any> {
    try {
      const response = await this.makeRequest('GET', `/students/${studentId}/performance`, { timeRange });
      await LocalStorageService.cachePerformanceData(studentId, response.data);
      return response.data;
    } catch (error) {
      const cachedData = await LocalStorageService.getCachedPerformanceData(studentId);
      if (cachedData) return cachedData;
      throw error;
    }
  }

  async submitPerformance(performanceData: any): Promise<any> {
    return this.makeRequest('POST', '/performance', performanceData);
  }

  async getPerformanceAnalytics(filters: any): Promise<any> {
    try {
      const response = await this.makeRequest('GET', '/analytics/performance', { params: filters });
      await LocalStorageService.cacheAnalyticsData(response.data);
      return response.data;
    } catch (error) {
      const cachedData = await LocalStorageService.getCachedAnalyticsData();
      if (cachedData) return cachedData;
      throw error;
    }
  }

  // Instructor Dashboard APIs
  async getStudentsList(instructorId: string): Promise<any> {
    try {
      const response = await this.makeRequest('GET', `/instructors/${instructorId}/students`);
      await LocalStorageService.cacheStudentsList(instructorId, response.data);
      return response.data;
    } catch (error) {
      const cachedData = await LocalStorageService.getCachedStudentsList(instructorId);
      if (cachedData) return cachedData;
      throw error;
    }
  }

  async getClassPerformance(instructorId: string): Promise<any> {
    try {
      const response = await this.makeRequest('GET', `/instructors/${instructorId}/class-performance`);
      await LocalStorageService.cacheClassPerformance(instructorId, response.data);
      return response.data;
    } catch (error) {
      const cachedData = await LocalStorageService.getCachedClassPerformance(instructorId);
      if (cachedData) return cachedData;
      throw error;
    }
  }

  // Scenario Management APIs
  async getScenarios(filters?: any): Promise<any> {
    try {
      const response = await this.makeRequest('GET', '/scenarios', { params: filters });
      await LocalStorageService.cacheScenarios(response.data);
      return response.data;
    } catch (error) {
      const cachedData = await LocalStorageService.getCachedScenarios();
      if (cachedData) return cachedData;
      throw error;
    }
  }

  async submitScenarioResult(scenarioId: string, result: any): Promise<any> {
    return this.makeRequest('POST', `/scenarios/${scenarioId}/results`, result);
  }

  // Analytics APIs
  async getLearningAnalytics(userId: string): Promise<any> {
    try {
      const response = await this.makeRequest('GET', `/analytics/learning/${userId}`);
      await LocalStorageService.cacheLearningAnalytics(userId, response.data);
      return response.data;
    } catch (error) {
      const cachedData = await LocalStorageService.getCachedLearningAnalytics(userId);
      if (cachedData) return cachedData;
      throw error;
    }
  }

  async getPerformancePredictions(userId: string): Promise<any> {
    return this.makeRequest('GET', `/analytics/predictions/${userId}`);
  }

  // Private helper methods
  private async makeRequest(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<any> {
    try {
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        await this.addToOfflineQueue({ method, endpoint, data });
        throw new Error('No network connection - Request queued');
      }

      const config = {
        method,
        url: endpoint,
        ...(method === 'GET' ? { params: data } : { data }),
      };

      return await this.api.request(config);
    } catch (error) {
      throw error;
    }
  }

  private async addToOfflineQueue(request: any): Promise<void> {
    this.offlineQueue.push({
      method: request.method,
      endpoint: request.url,
      data: request.data,
      retries: 0,
    });
    await LocalStorageService.saveOfflineQueue(this.offlineQueue);
  }

  private async startOfflineQueueProcessor(): Promise<void> {
    setInterval(async () => {
      const networkState = await NetInfo.fetch();
      if (networkState.isConnected && this.offlineQueue.length > 0) {
        await this.processOfflineQueue();
      }
    }, 60000); // Check every minute
  }

  private async processOfflineQueue(): Promise<void> {
    const MAX_RETRIES = 3;

    for (let i = 0; i < this.offlineQueue.length; i++) {
      const request = this.offlineQueue[i];
      
      try {
        await this.api.request({
          method: request.method,
          url: request.endpoint,
          data: request.data,
        });

        // Remove successful request from queue
        this.offlineQueue.splice(i, 1);
        i--;
      } catch (error) {
        request.retries++;
        if (request.retries >= MAX_RETRIES) {
          // Remove failed request after max retries
          this.offlineQueue.splice(i, 1);
          i--;
          // Log failed request
          console.error('Request failed after max retries:', request);
        }
      }
    }

    // Update stored queue
    await LocalStorageService.saveOfflineQueue(this.offlineQueue);
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = await LocalStorageService.getRefreshToken();
    const response = await this.api.post('/auth/refresh', { refreshToken });
    const newToken = response.data.token;
    await LocalStorageService.saveAuthToken(newToken);
    return newToken;
  }
}

export default ApiService.getInstance();

