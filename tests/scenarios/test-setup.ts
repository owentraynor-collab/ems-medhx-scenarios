/**
 * Test Setup and Global Configuration
 * 
 * This file runs before all tests to set up the testing environment
 */

// Extend Jest matchers with custom ones for scenario testing
expect.extend({
  toHaveIdentifiedRedFlag(received: string[], flagId: string) {
    const pass = received.includes(flagId);
    if (pass) {
      return {
        message: () => `expected ${flagId} not to be identified`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${flagId} to be identified, but it was not found in ${JSON.stringify(received)}`,
        pass: false,
      };
    }
  },

  toHaveMissedCriticalAction(received: string[], actionName: string) {
    const pass = received.includes(actionName);
    if (pass) {
      return {
        message: () => `expected ${actionName} not to be missed`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${actionName} to be in missed actions`,
        pass: false,
      };
    }
  },

  toHaveScoreAbove(received: number, threshold: number) {
    const pass = received > threshold;
    if (pass) {
      return {
        message: () => `expected score ${received} not to be above ${threshold}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected score ${received} to be above ${threshold}`,
        pass: false,
      };
    }
  },
});

// Global test configuration
beforeAll(() => {
  console.log('Starting Scenario Test Suite...');
});

afterAll(() => {
  console.log('Scenario Test Suite Completed');
});

// Mock console methods to reduce noise in tests (optional)
global.console = {
  ...console,
  // Uncomment to suppress logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// TypeScript declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveIdentifiedRedFlag(flagId: string): R;
      toHaveMissedCriticalAction(actionName: string): R;
      toHaveScoreAbove(threshold: number): R;
    }
  }
}

export {};

