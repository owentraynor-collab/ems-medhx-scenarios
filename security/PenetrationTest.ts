import axios from 'axios';
import { performance } from 'perf_hooks';

interface PenTestResult {
  endpoint: string;
  vulnerability: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  payload?: string;
  response?: any;
}

interface TestConfig {
  baseUrl: string;
  endpoints: string[];
  payloads: Record<string, any[]>;
  headers?: Record<string, string>;
}

class PenetrationTester {
  private results: PenTestResult[] = [];
  private config: TestConfig;

  constructor(config: TestConfig) {
    this.config = config;
  }

  async runAllTests(): Promise<PenTestResult[]> {
    await this.testAuthentication();
    await this.testAuthorization();
    await this.testInjection();
    await this.testXSS();
    await this.testCSRF();
    await this.testDataExposure();
    await this.testRateLimiting();
    await this.testFileUpload();
    await this.testEncryption();
    await this.testSessionHandling();

    return this.results;
  }

  private async testAuthentication(): Promise<void> {
    // Test weak passwords
    const weakPasswords = [
      'password123',
      '12345678',
      'qwerty',
      'admin123',
    ];

    for (const password of weakPasswords) {
      try {
        const response = await axios.post(`${this.config.baseUrl}/auth/login`, {
          username: 'admin',
          password,
        });

        if (response.status === 200) {
          this.addResult({
            endpoint: '/auth/login',
            vulnerability: 'Weak Password Accepted',
            severity: 'high',
            details: 'System accepts weak passwords',
            payload: password,
          });
        }
      } catch (error) {
        // Expected behavior
      }
    }

    // Test brute force protection
    const startTime = performance.now();
    let loginAttempts = 0;

    while (performance.now() - startTime < 5000) {
      try {
        await axios.post(`${this.config.baseUrl}/auth/login`, {
          username: 'admin',
          password: 'test123',
        });
        loginAttempts++;
      } catch (error) {
        if (error.response?.status === 429) {
          break;
        }
      }
    }

    if (loginAttempts > 10) {
      this.addResult({
        endpoint: '/auth/login',
        vulnerability: 'Missing Rate Limiting',
        severity: 'high',
        details: `Allowed ${loginAttempts} login attempts in 5 seconds`,
      });
    }
  }

  private async testAuthorization(): Promise<void> {
    // Test unauthorized access
    const endpoints = [
      '/api/users',
      '/api/admin',
      '/api/settings',
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${this.config.baseUrl}${endpoint}`);
        
        this.addResult({
          endpoint,
          vulnerability: 'Missing Authorization Check',
          severity: 'critical',
          details: 'Endpoint accessible without authentication',
          response: response.data,
        });
      } catch (error) {
        // Expected behavior
      }
    }

    // Test privilege escalation
    const userToken = await this.getTestUserToken();
    
    try {
      const response = await axios.post(
        `${this.config.baseUrl}/api/users/promote`,
        { userId: 'test', role: 'admin' },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      if (response.status === 200) {
        this.addResult({
          endpoint: '/api/users/promote',
          vulnerability: 'Privilege Escalation',
          severity: 'critical',
          details: 'Regular user can promote to admin',
        });
      }
    } catch (error) {
      // Expected behavior
    }
  }

  private async testInjection(): Promise<void> {
    const sqlInjectionPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users; --",
    ];

    for (const payload of sqlInjectionPayloads) {
      try {
        const response = await axios.get(
          `${this.config.baseUrl}/api/users/search?name=${payload}`
        );

        if (response.data?.length > 0) {
          this.addResult({
            endpoint: '/api/users/search',
            vulnerability: 'SQL Injection',
            severity: 'critical',
            details: 'Endpoint vulnerable to SQL injection',
            payload,
          });
        }
      } catch (error) {
        // Expected behavior
      }
    }
  }

  private async testXSS(): Promise<void> {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '"><script>alert("xss")</script>',
      'javascript:alert("xss")//',
    ];

    for (const payload of xssPayloads) {
      try {
        const response = await axios.post(
          `${this.config.baseUrl}/api/comments`,
          { content: payload }
        );

        if (response.data?.content?.includes(payload)) {
          this.addResult({
            endpoint: '/api/comments',
            vulnerability: 'Cross-Site Scripting (XSS)',
            severity: 'high',
            details: 'Unescaped content in response',
            payload,
          });
        }
      } catch (error) {
        // Expected behavior
      }
    }
  }

  private async testCSRF(): Promise<void> {
    const endpoints = this.config.endpoints.filter(e => 
      e.startsWith('/api/') && !e.includes('/auth/')
    );

    for (const endpoint of endpoints) {
      try {
        const response = await axios.post(
          `${this.config.baseUrl}${endpoint}`,
          { test: 'data' },
          { headers: { 'Origin': 'http://evil.com' } }
        );

        if (response.status === 200) {
          this.addResult({
            endpoint,
            vulnerability: 'Missing CSRF Protection',
            severity: 'high',
            details: 'Endpoint accepts cross-origin requests',
          });
        }
      } catch (error) {
        // Expected behavior
      }
    }
  }

  private async testDataExposure(): Promise<void> {
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    
    for (const endpoint of this.config.endpoints) {
      try {
        const response = await axios.get(`${this.config.baseUrl}${endpoint}`);
        
        const exposedFields = this.findSensitiveData(response.data, sensitiveFields);
        if (exposedFields.length > 0) {
          this.addResult({
            endpoint,
            vulnerability: 'Sensitive Data Exposure',
            severity: 'high',
            details: `Exposed sensitive fields: ${exposedFields.join(', ')}`,
          });
        }
      } catch (error) {
        // Expected behavior
      }
    }
  }

  private async testRateLimiting(): Promise<void> {
    const startTime = performance.now();
    let requestCount = 0;

    while (performance.now() - startTime < 1000) {
      try {
        await axios.get(`${this.config.baseUrl}/api/test`);
        requestCount++;
      } catch (error) {
        if (error.response?.status === 429) {
          break;
        }
      }
    }

    if (requestCount > 100) {
      this.addResult({
        endpoint: '/api/test',
        vulnerability: 'Insufficient Rate Limiting',
        severity: 'medium',
        details: `Allowed ${requestCount} requests per second`,
      });
    }
  }

  private async testFileUpload(): Promise<void> {
    const maliciousFiles = [
      { name: 'test.php', content: '<?php system($_GET["cmd"]); ?>' },
      { name: 'test.jpg.php', content: '<?php phpinfo(); ?>' },
      { name: '../../../etc/passwd', content: 'test' },
    ];

    for (const file of maliciousFiles) {
      try {
        const formData = new FormData();
        formData.append('file', new Blob([file.content]), file.name);

        const response = await axios.post(
          `${this.config.baseUrl}/api/upload`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        if (response.status === 200) {
          this.addResult({
            endpoint: '/api/upload',
            vulnerability: 'Unsafe File Upload',
            severity: 'high',
            details: `Accepted potentially malicious file: ${file.name}`,
          });
        }
      } catch (error) {
        // Expected behavior
      }
    }
  }

  private async testEncryption(): Promise<void> {
    // Test SSL/TLS configuration
    try {
      const response = await axios.get(`${this.config.baseUrl.replace('https', 'http')}/api/test`);
      
      if (response.status === 200) {
        this.addResult({
          endpoint: 'all',
          vulnerability: 'Missing SSL/TLS Enforcement',
          severity: 'high',
          details: 'Server accepts unencrypted connections',
        });
      }
    } catch (error) {
      // Expected behavior
    }

    // Test weak cipher support
    // This would typically be done with a more sophisticated SSL/TLS testing tool
  }

  private async testSessionHandling(): Promise<void> {
    // Test session fixation
    const initialSession = await this.getTestSession();
    const loginResponse = await this.loginWithSession(initialSession);

    if (loginResponse.sessionId === initialSession) {
      this.addResult({
        endpoint: '/auth/login',
        vulnerability: 'Session Fixation',
        severity: 'high',
        details: 'Session ID not regenerated after login',
      });
    }

    // Test session timeout
    const session = await this.getTestSession();
    await new Promise(resolve => setTimeout(resolve, 3600000)); // 1 hour
    
    try {
      const response = await axios.get(
        `${this.config.baseUrl}/api/test`,
        { headers: { 'Cookie': `session=${session}` } }
      );

      if (response.status === 200) {
        this.addResult({
          endpoint: 'all',
          vulnerability: 'Missing Session Timeout',
          severity: 'medium',
          details: 'Sessions do not expire after inactivity',
        });
      }
    } catch (error) {
      // Expected behavior
    }
  }

  private addResult(result: PenTestResult): void {
    this.results.push(result);
  }

  private async getTestUserToken(): Promise<string> {
    try {
      const response = await axios.post(`${this.config.baseUrl}/auth/login`, {
        username: 'testuser',
        password: 'testpass',
      });
      return response.data.token;
    } catch (error) {
      return '';
    }
  }

  private async getTestSession(): Promise<string> {
    try {
      const response = await axios.get(`${this.config.baseUrl}/api/test`);
      return response.headers['set-cookie']?.[0]?.split(';')[0] || '';
    } catch (error) {
      return '';
    }
  }

  private async loginWithSession(sessionId: string): Promise<any> {
    try {
      return await axios.post(
        `${this.config.baseUrl}/auth/login`,
        { username: 'testuser', password: 'testpass' },
        { headers: { 'Cookie': `session=${sessionId}` } }
      );
    } catch (error) {
      return {};
    }
  }

  private findSensitiveData(obj: any, sensitiveFields: string[]): string[] {
    const found: string[] = [];
    
    const search = (o: any) => {
      if (!o || typeof o !== 'object') return;
      
      Object.keys(o).forEach(key => {
        if (sensitiveFields.includes(key.toLowerCase())) {
          found.push(key);
        }
        if (typeof o[key] === 'object') {
          search(o[key]);
        }
      });
    };

    search(obj);
    return found;
  }
}

export default PenetrationTester;

