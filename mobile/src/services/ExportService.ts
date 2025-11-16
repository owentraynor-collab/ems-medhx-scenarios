import { ApiService } from './ApiService';
import { LearningAnalyticsService } from './LearningAnalyticsService';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { Platform } from 'react-native';
import XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'xlsx' | 'json';
  timeRange?: {
    start: number;
    end: number;
  };
  includeData: {
    performance?: boolean;
    quizzes?: boolean;
    scenarios?: boolean;
    documentation?: boolean;
    analytics?: boolean;
  };
  filters?: {
    moduleTypes?: string[];
    minScore?: number;
    maxScore?: number;
    status?: string[];
  };
}

export interface ExportMetadata {
  timestamp: number;
  userId: string;
  format: string;
  dataTypes: string[];
  recordCount: number;
  fileSize: number;
}

export class ExportService {
  private static instance: ExportService;
  private api: ApiService;
  private analytics: LearningAnalyticsService;
  private exportHistory: Map<string, ExportMetadata> = new Map();

  private constructor() {
    this.api = ApiService.getInstance();
    this.analytics = LearningAnalyticsService.getInstance();
  }

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  async exportData(
    userId: string,
    options: ExportOptions
  ): Promise<{ filePath: string; metadata: ExportMetadata }> {
    try {
      // Fetch data from API
      const data = await this.fetchExportData(userId, options);

      // Generate export file
      const { filePath, size } = await this.generateExportFile(data, options);

      // Create metadata
      const metadata: ExportMetadata = {
        timestamp: Date.now(),
        userId,
        format: options.format,
        dataTypes: Object.entries(options.includeData)
          .filter(([_, included]) => included)
          .map(([type]) => type),
        recordCount: this.countRecords(data),
        fileSize: size,
      };

      // Store in history
      this.exportHistory.set(filePath, metadata);

      return { filePath, metadata };
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export data');
    }
  }

  private async fetchExportData(
    userId: string,
    options: ExportOptions
  ): Promise<any> {
    const requests = [];

    if (options.includeData.performance) {
      requests.push(this.analytics.getPerformanceMetrics(userId));
    }

    if (options.includeData.analytics) {
      requests.push(this.analytics.getCompetencyMap(userId));
      requests.push(this.analytics.getLearningPath(userId));
    }

    // Fetch data based on time range and filters
    const queryParams = {
      ...options.timeRange,
      ...options.filters,
    };

    if (options.includeData.quizzes) {
      requests.push(this.api.get('/export/quizzes', { userId, ...queryParams }));
    }

    if (options.includeData.scenarios) {
      requests.push(
        this.api.get('/export/scenarios', { userId, ...queryParams })
      );
    }

    if (options.includeData.documentation) {
      requests.push(this.api.get('/export/documentation', {
        userId,
        ...queryParams,
      }));
    }

    const results = await Promise.all(requests);

    return this.mergeExportData(results, options);
  }

  private mergeExportData(results: any[], options: ExportOptions): any {
    const merged: any = {};
    let index = 0;

    if (options.includeData.performance) {
      merged.performance = results[index++];
    }

    if (options.includeData.analytics) {
      merged.competencies = results[index++];
      merged.learningPath = results[index++];
    }

    if (options.includeData.quizzes) {
      merged.quizzes = results[index++];
    }

    if (options.includeData.scenarios) {
      merged.scenarios = results[index++];
    }

    if (options.includeData.documentation) {
      merged.documentation = results[index];
    }

    return merged;
  }

  private async generateExportFile(
    data: any,
    options: ExportOptions
  ): Promise<{ filePath: string; size: number }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseDir = Platform.select({
      ios: RNFS.DocumentDirectoryPath,
      android: RNFS.ExternalDirectoryPath,
    });

    let content: string | Buffer;
    let filePath: string;

    switch (options.format) {
      case 'pdf':
        content = await this.generatePDF(data);
        filePath = `${baseDir}/export_${timestamp}.pdf`;
        break;

      case 'csv':
        content = this.generateCSV(data);
        filePath = `${baseDir}/export_${timestamp}.csv`;
        break;

      case 'xlsx':
        content = this.generateXLSX(data);
        filePath = `${baseDir}/export_${timestamp}.xlsx`;
        break;

      case 'json':
        content = JSON.stringify(data, null, 2);
        filePath = `${baseDir}/export_${timestamp}.json`;
        break;

      default:
        throw new Error('Unsupported export format');
    }

    await RNFS.writeFile(filePath, content, 'utf8');
    const stats = await RNFS.stat(filePath);

    return { filePath, size: stats.size };
  }

  private async generatePDF(data: any): Promise<string> {
    const doc = new jsPDF();
    let yOffset = 20;

    // Add title
    doc.setFontSize(16);
    doc.text('Performance Report', 20, yOffset);
    yOffset += 10;

    // Add sections based on data
    if (data.performance) {
      doc.setFontSize(14);
      doc.text('Overall Performance', 20, yOffset);
      yOffset += 10;

      const performanceData = [
        ['Metric', 'Value'],
        ['Average Score', `${data.performance.overall.averageScore}%`],
        ['Completion Rate', `${data.performance.overall.completionRate}%`],
        ['Time Spent', `${data.performance.overall.timeSpent} minutes`],
      ];

      doc.autoTable({
        startY: yOffset,
        head: [performanceData[0]],
        body: performanceData.slice(1),
      });

      yOffset = (doc as any).lastAutoTable.finalY + 10;
    }

    if (data.quizzes) {
      doc.setFontSize(14);
      doc.text('Quiz Performance', 20, yOffset);
      yOffset += 10;

      const quizData = data.quizzes.map((quiz: any) => [
        quiz.title,
        quiz.score,
        quiz.attempts,
        quiz.completedAt,
      ]);

      doc.autoTable({
        startY: yOffset,
        head: [['Quiz', 'Score', 'Attempts', 'Completed']],
        body: quizData,
      });

      yOffset = (doc as any).lastAutoTable.finalY + 10;
    }

    // Add more sections as needed...

    return doc.output();
  }

  private generateCSV(data: any): string {
    let csv = '';
    const sections: string[] = [];

    if (data.performance) {
      const performanceCSV = [
        'Metric,Value',
        `Average Score,${data.performance.overall.averageScore}%`,
        `Completion Rate,${data.performance.overall.completionRate}%`,
        `Time Spent,${data.performance.overall.timeSpent} minutes`,
      ].join('\n');
      sections.push('Performance Metrics\n' + performanceCSV);
    }

    if (data.quizzes) {
      const quizCSV = [
        'Quiz,Score,Attempts,Completed',
        ...data.quizzes.map(
          (quiz: any) =>
            `${quiz.title},${quiz.score},${quiz.attempts},${quiz.completedAt}`
        ),
      ].join('\n');
      sections.push('Quiz Results\n' + quizCSV);
    }

    // Add more sections as needed...

    return sections.join('\n\n');
  }

  private generateXLSX(data: any): Buffer {
    const workbook = XLSX.utils.book_new();

    if (data.performance) {
      const performanceData = [
        ['Metric', 'Value'],
        ['Average Score', `${data.performance.overall.averageScore}%`],
        ['Completion Rate', `${data.performance.overall.completionRate}%`],
        ['Time Spent', `${data.performance.overall.timeSpent} minutes`],
      ];
      const performanceSheet = XLSX.utils.aoa_to_sheet(performanceData);
      XLSX.utils.book_append_sheet(
        workbook,
        performanceSheet,
        'Performance Metrics'
      );
    }

    if (data.quizzes) {
      const quizData = [
        ['Quiz', 'Score', 'Attempts', 'Completed'],
        ...data.quizzes.map((quiz: any) => [
          quiz.title,
          quiz.score,
          quiz.attempts,
          quiz.completedAt,
        ]),
      ];
      const quizSheet = XLSX.utils.aoa_to_sheet(quizData);
      XLSX.utils.book_append_sheet(workbook, quizSheet, 'Quiz Results');
    }

    // Add more sheets as needed...

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private countRecords(data: any): number {
    let count = 0;

    if (data.performance) {
      count += Object.keys(data.performance.byModule || {}).length;
    }

    if (data.quizzes) {
      count += data.quizzes.length;
    }

    if (data.scenarios) {
      count += data.scenarios.length;
    }

    if (data.documentation) {
      count += data.documentation.length;
    }

    return count;
  }

  async shareExport(filePath: string): Promise<void> {
    try {
      const options = {
        title: 'Share Performance Report',
        url: `file://${filePath}`,
        type: this.getMimeType(filePath),
      };

      await Share.open(options);
    } catch (error) {
      console.error('Share failed:', error);
      throw new Error('Failed to share export');
    }
  }

  private getMimeType(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'csv':
        return 'text/csv';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'json':
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  }

  async getExportHistory(userId: string): Promise<ExportMetadata[]> {
    try {
      // Get history from server
      const history = await this.api.get('/export/history', { userId });
      
      // Update local cache
      history.forEach((metadata: ExportMetadata) => {
        this.exportHistory.set(`export_${metadata.timestamp}`, metadata);
      });

      return history;
    } catch (error) {
      console.error('Failed to get export history:', error);
      // Return local cache if available
      return Array.from(this.exportHistory.values()).filter(
        metadata => metadata.userId === userId
      );
    }
  }

  async cleanup(): Promise<void> {
    try {
      const baseDir = Platform.select({
        ios: RNFS.DocumentDirectoryPath,
        android: RNFS.ExternalDirectoryPath,
      });

      // Get all export files
      const files = await RNFS.readDir(baseDir);
      const exportFiles = files.filter(file =>
        file.name.startsWith('export_')
      );

      // Keep only last 10 exports
      const oldFiles = exportFiles
        .sort((a, b) => b.mtime!.getTime() - a.mtime!.getTime())
        .slice(10);

      // Delete old files
      await Promise.all(
        oldFiles.map(file => RNFS.unlink(file.path))
      );
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}

export default ExportService;