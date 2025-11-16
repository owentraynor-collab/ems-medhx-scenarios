import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import {
  ExportService,
  ExportOptions,
  ExportMetadata,
} from '../../services/ExportService';

interface ExportInterfaceProps {
  userId: string;
  onComplete?: () => void;
}

export const ExportInterface: React.FC<ExportInterfaceProps> = ({
  userId,
  onComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState<ExportOptions['format']>('pdf');
  const [timeRange, setTimeRange] = useState<{
    start: Date;
    end: Date;
  }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    end: new Date(),
  });
  const [includeData, setIncludeData] = useState({
    performance: true,
    quizzes: true,
    scenarios: true,
    documentation: true,
    analytics: true,
  });
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(
    null
  );
  const [exportHistory, setExportHistory] = useState<ExportMetadata[]>([]);

  const theme = useTheme();
  const exportService = ExportService.getInstance();

  useEffect(() => {
    loadExportHistory();
  }, []);

  const loadExportHistory = async () => {
    try {
      setLoading(true);
      const history = await exportService.getExportHistory(userId);
      setExportHistory(history);
    } catch (error) {
      console.error('Failed to load export history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const options: ExportOptions = {
        format,
        timeRange: {
          start: timeRange.start.getTime(),
          end: timeRange.end.getTime(),
        },
        includeData,
      };

      const { filePath, metadata } = await exportService.exportData(
        userId,
        options
      );

      // Update history
      setExportHistory(prev => [metadata, ...prev]);

      // Share file
      await exportService.shareExport(filePath);

      Alert.alert('Success', 'Export completed successfully');
      onComplete?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const renderFormatSelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Export Format
      </Text>
      <View style={styles.formatGrid}>
        {(['pdf', 'csv', 'xlsx', 'json'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.formatOption,
              format === f && styles.selectedFormat,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() => setFormat(f)}
          >
            <Icon
              name={
                f === 'pdf'
                  ? 'file-pdf-box'
                  : f === 'csv'
                  ? 'file-delimited'
                  : f === 'xlsx'
                  ? 'file-excel'
                  : 'code-json'
              }
              size={24}
              color={format === f ? theme.colors.primary : theme.colors.text}
            />
            <Text
              style={[
                styles.formatText,
                { color: format === f ? theme.colors.primary : theme.colors.text },
              ]}
            >
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDateRange = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Time Range
      </Text>
      <View style={styles.dateContainer}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker('start')}
        >
          <Text style={[styles.dateLabel, { color: theme.colors.text }]}>
            Start Date
          </Text>
          <Text style={[styles.dateValue, { color: theme.colors.text }]}>
            {formatDate(timeRange.start)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker('end')}
        >
          <Text style={[styles.dateLabel, { color: theme.colors.text }]}>
            End Date
          </Text>
          <Text style={[styles.dateValue, { color: theme.colors.text }]}>
            {formatDate(timeRange.end)}
          </Text>
        </TouchableOpacity>
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === 'start' ? timeRange.start : timeRange.end}
          mode="date"
          onChange={(event, date) => {
            setShowDatePicker(null);
            if (date) {
              setTimeRange(prev => ({
                ...prev,
                [showDatePicker]: date,
              }));
            }
          }}
        />
      )}
    </View>
  );

  const renderDataOptions = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Include Data
      </Text>
      {Object.entries(includeData).map(([key, value]) => (
        <View key={key} style={styles.optionRow}>
          <Text
            style={[styles.optionLabel, { color: theme.colors.text }]}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </Text>
          <Switch
            value={value}
            onValueChange={newValue =>
              setIncludeData(prev => ({ ...prev, [key]: newValue }))
            }
            trackColor={{ false: '#767577', true: theme.colors.primary }}
          />
        </View>
      ))}
    </View>
  );

  const renderExportHistory = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Export History
      </Text>
      {exportHistory.map((export_, index) => (
        <View
          key={index}
          style={[
            styles.historyItem,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.historyHeader}>
            <Text style={[styles.historyFormat, { color: theme.colors.text }]}>
              {export_.format.toUpperCase()}
            </Text>
            <Text style={[styles.historyDate, { color: theme.colors.text }]}>
              {new Date(export_.timestamp).toLocaleString()}
            </Text>
          </View>
          <View style={styles.historyDetails}>
            <Text style={[styles.historyStats, { color: theme.colors.text }]}>
              {export_.recordCount} records • {formatBytes(export_.fileSize)}
            </Text>
            <Text style={[styles.historyTypes, { color: theme.colors.text }]}>
              {export_.dataTypes.join(', ')}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {renderFormatSelector()}
      {renderDateRange()}
      {renderDataOptions()}
      {renderExportHistory()}

      <TouchableOpacity
        style={[
          styles.exportButton,
          { backgroundColor: theme.colors.primary },
          exporting && styles.disabledButton,
        ]}
        onPress={handleExport}
        disabled={exporting}
      >
        {exporting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Icon name="export" size={24} color="#FFFFFF" />
            <Text style={styles.exportButtonText}>Export Data</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  formatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -8,
  },
  formatOption: {
    flex: 1,
    minWidth: '40%',
    margin: 8,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedFormat: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  formatText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 1,
    marginHorizontal: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  dateLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  optionLabel: {
    fontSize: 16,
  },
  historyItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyFormat: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 14,
  },
  historyDetails: {
    marginTop: 4,
  },
  historyStats: {
    fontSize: 14,
    marginBottom: 4,
  },
  historyTypes: {
    fontSize: 12,
    opacity: 0.7,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 32,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default ExportInterface;

