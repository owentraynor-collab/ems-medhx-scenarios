import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import {
  ErrorHandlingService,
  ErrorReport,
  RecoveryAction,
} from '../../services/ErrorHandlingService';

interface ErrorMonitorProps {
  onErrorSelect?: (error: ErrorReport) => void;
}

export const ErrorMonitor: React.FC<ErrorMonitorProps> = ({ onErrorSelect }) => {
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  const [recoveryActions, setRecoveryActions] = useState<RecoveryAction[]>([]);
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<{
    start: number;
    end: number;
  }>({
    start: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
    end: Date.now(),
  });

  const theme = useTheme();
  const errorService = ErrorHandlingService.getInstance();

  useEffect(() => {
    refreshData();
  }, [selectedType, selectedStatus, timeRange]);

  const refreshData = async () => {
    try {
      setLoading(true);
      const [errorHistory, recoveryHistory] = await Promise.all([
        errorService.getErrorHistory({
          type: selectedType.length > 0 ? selectedType : undefined,
          status: selectedStatus.length > 0 ? selectedStatus : undefined,
          timeRange,
        }),
        errorService.getRecoveryHistory(),
      ]);

      setErrors(errorHistory);
      setRecoveryActions(recoveryHistory);
    } catch (error) {
      console.error('Failed to refresh error data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getErrorTypeColor = (type: string): string => {
    switch (type) {
      case 'critical':
        return '#F44336';
      case 'error':
        return '#FF9800';
      case 'warning':
        return '#FFC107';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'resolved':
        return '#4CAF50';
      case 'investigating':
        return '#2196F3';
      case 'ignored':
        return '#9E9E9E';
      default:
        return '#F44336';
    }
  };

  const renderErrorItem = ({ item: error }: { item: ErrorReport }) => (
    <TouchableOpacity
      style={[styles.errorCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => onErrorSelect?.(error)}
    >
      <View style={styles.errorHeader}>
        <View style={styles.errorType}>
          <Icon
            name={
              error.type === 'critical'
                ? 'alert-circle'
                : error.type === 'error'
                ? 'alert'
                : 'alert-outline'
            }
            size={24}
            color={getErrorTypeColor(error.type)}
          />
          <Text
            style={[styles.errorComponent, { color: theme.colors.text }]}
          >
            {error.component}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(error.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {error.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={[styles.errorMessage, { color: theme.colors.text }]}>
        {error.message}
      </Text>

      <View style={styles.errorMeta}>
        <Text style={[styles.metaText, { color: theme.colors.text }]}>
          {new Date(error.timestamp).toLocaleString()}
        </Text>
        {error.resolution && (
          <View
            style={[
              styles.resolutionBadge,
              {
                backgroundColor: error.resolution.success
                  ? '#4CAF50'
                  : '#F44336',
              },
            ]}
          >
            <Text style={styles.resolutionText}>
              {error.resolution.success ? 'RESOLVED' : 'FAILED'}
            </Text>
          </View>
        )}
      </View>

      {error.metadata.context && (
        <View style={styles.contextContainer}>
          <Text
            style={[styles.contextTitle, { color: theme.colors.text }]}
          >
            Context
          </Text>
          {Object.entries(error.metadata.context).map(([key, value]) => (
            <Text
              key={key}
              style={[styles.contextItem, { color: theme.colors.text }]}
            >
              {key}: {JSON.stringify(value)}
            </Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderRecoveryItem = ({ item: action }: { item: RecoveryAction }) => (
    <View
      style={[styles.recoveryCard, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.recoveryHeader}>
        <Text style={[styles.recoveryType, { color: theme.colors.text }]}>
          {action.type}
        </Text>
        <View
          style={[
            styles.recoveryStatus,
            {
              backgroundColor: action.success ? '#4CAF50' : '#F44336',
            },
          ]}
        >
          <Text style={styles.recoveryStatusText}>
            {action.success ? 'SUCCESS' : 'FAILED'}
          </Text>
        </View>
      </View>

      <Text style={[styles.recoveryTime, { color: theme.colors.text }]}>
        {new Date(action.timestamp).toLocaleString()}
      </Text>

      {action.error && (
        <Text style={[styles.recoveryError, { color: theme.colors.error }]}>
          {action.error}
        </Text>
      )}
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filters}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {['critical', 'error', 'warning'].map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterChip,
              selectedType.includes(type) && styles.selectedChip,
              {
                backgroundColor: selectedType.includes(type)
                  ? getErrorTypeColor(type)
                  : theme.colors.surface,
              },
            ]}
            onPress={() =>
              setSelectedType(prev =>
                prev.includes(type)
                  ? prev.filter(t => t !== type)
                  : [...prev, type]
              )
            }
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: selectedType.includes(type)
                    ? '#FFFFFF'
                    : theme.colors.text,
                },
              ]}
            >
              {type.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}

        {['new', 'investigating', 'resolved', 'ignored'].map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              selectedStatus.includes(status) && styles.selectedChip,
              {
                backgroundColor: selectedStatus.includes(status)
                  ? getStatusColor(status)
                  : theme.colors.surface,
              },
            ]}
            onPress={() =>
              setSelectedStatus(prev =>
                prev.includes(status)
                  ? prev.filter(s => s !== status)
                  : [...prev, status]
              )
            }
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: selectedStatus.includes(status)
                    ? '#FFFFFF'
                    : theme.colors.text,
                },
              ]}
            >
              {status.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    <View style={styles.container}>
      {renderFilters()}

      <View style={styles.content}>
        <View style={styles.errorsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Errors
          </Text>
          <FlatList
            data={errors}
            renderItem={renderErrorItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
          />
        </View>

        <View style={styles.recoveryContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Recovery Actions
          </Text>
          <FlatList
            data={recoveryActions}
            renderItem={renderRecoveryItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filters: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedChip: {
    borderWidth: 0,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorsContainer: {
    flex: 2,
    marginBottom: 16,
  },
  recoveryContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  errorCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorComponent: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  errorMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  errorMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
  },
  resolutionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resolutionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  contextContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  contextTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  contextItem: {
    fontSize: 12,
    marginBottom: 2,
  },
  recoveryCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  recoveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recoveryType: {
    fontSize: 14,
    fontWeight: '500',
  },
  recoveryStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recoveryStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  recoveryTime: {
    fontSize: 12,
    marginBottom: 4,
  },
  recoveryError: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default ErrorMonitor;

