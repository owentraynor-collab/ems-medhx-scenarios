import ApiService from '../../services/ApiService';
import { LocalStorageService } from '../../services/LocalStorageService';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';

jest.mock('@react-native-community/netinfo');
jest.mock('../../services/LocalStorageService');
jest.mock('axios');

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
  });

  describe('Authentication', () => {
    it('should add auth token to requests', async () => {
      const mockToken = 'test-token';
      (LocalStorageService.getAuthToken as jest.Mock).mockResolvedValue(mockToken);
      (axios.request as jest.Mock).mockResolvedValue({ data: {} });

      await ApiService.getStudentPerformance('123');

      expect(axios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`
          })
        })
      );
    });

    it('should handle token refresh on 401', async () => {
      const oldToken = 'old-token';
      const newToken = 'new-token';
      (LocalStorageService.getAuthToken as jest.Mock).mockResolvedValue(oldToken);
      (axios.request as jest.Mock)
        .mockRejectedValueOnce({ response: { status: 401 } })
        .mockResolvedValueOnce({ data: { token: newToken } })
        .mockResolvedValueOnce({ data: {} });

      await ApiService.getStudentPerformance('123');

      expect(LocalStorageService.saveAuthToken).toHaveBeenCalledWith(newToken);
    });
  });

  describe('Offline Support', () => {
    it('should queue requests when offline', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });
      
      await expect(ApiService.submitPerformance({ data: 'test' }))
        .rejects
        .toThrow('No network connection - Request queued');

      expect(LocalStorageService.saveOfflineQueue).toHaveBeenCalled();
    });

    it('should process offline queue when back online', async () => {
      const queuedRequests = [
        { method: 'POST', endpoint: '/performance', data: { test: 1 } }
      ];
      (LocalStorageService.getOfflineQueue as jest.Mock).mockResolvedValue(queuedRequests);
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
      (axios.request as jest.Mock).mockResolvedValue({ data: {} });

      await ApiService.processOfflineQueue();

      expect(axios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/performance',
          data: { test: 1 }
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should return cached data on network error', async () => {
      const cachedData = { test: 'data' };
      (axios.request as jest.Mock).mockRejectedValue(new Error('Network Error'));
      (LocalStorageService.getCachedPerformanceData as jest.Mock).mockResolvedValue(cachedData);

      const result = await ApiService.getStudentPerformance('123');

      expect(result).toEqual(cachedData);
    });

    it('should handle retry logic for failed requests', async () => {
      (axios.request as jest.Mock)
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({ data: 'success' });

      const result = await ApiService.makeRequest('GET', '/test');

      expect(axios.request).toHaveBeenCalledTimes(3);
      expect(result.data).toBe('success');
    });
  });

  describe('Data Management', () => {
    it('should cache successful responses', async () => {
      const responseData = { test: 'data' };
      (axios.request as jest.Mock).mockResolvedValue({ data: responseData });

      await ApiService.getStudentPerformance('123');

      expect(LocalStorageService.cachePerformanceData).toHaveBeenCalledWith(
        '123',
        responseData
      );
    });

    it('should handle batch operations efficiently', async () => {
      const batchData = [{ id: 1 }, { id: 2 }];
      (axios.request as jest.Mock).mockResolvedValue({ data: { success: true } });

      await ApiService.submitBatchPerformance(batchData);

      expect(axios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/performances/batch',
          data: expect.objectContaining({ performances: batchData })
        })
      );
    });
  });
});

