import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import {
  HealthMonitoringService,
  SystemHealth,
  PerformanceMetrics,
} from '../../services/HealthMonitoringService';

interface HealthDashboardProps {
  refreshInterval?: number;
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({
  refreshInterval = 30000, // 30 seconds
}) => {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'hour' | 'day'>(
    'hour'
  );

  const theme = useTheme();
  const { width } = Dimensions.get('window');
  const healthService = HealthMonitoringService.getInstance();

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const refreshData = async () => {
    try {
      setLoading(true);
      const [currentHealth, performanceMetrics] = await Promise.all([
        healthService.getHealth(),
        healthService.getMetrics({
          start: Date.now() - (selectedTimeRange === 'hour' ? 3600000 : 86400000),
          end: Date.now(),
        }),
      ]);

      setHealth(currentHealth);
      setMetrics(performanceMetrics);
    } catch (error) {
      console.error('Failed to refresh health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return '#4CAF50';
      case 'degraded':
        return '#FFC107';
      case 'critical':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const renderOverallHealth = () => {
    if (!health) return null;

    return (
      <View style={styles.section}>
        <View style={styles.overallHeader}>
          <View style={styles.statusContainer}>
            <Icon
              name={
                health.overall.status === 'healthy'
                  ? 'check-circle'
                  : health.overall.status === 'degraded'
                  ? 'alert-circle'
                  : 'close-circle'
              }
              size={32}
              color={getStatusColor(health.overall.status)}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(health.overall.status) },
              ]}
            >
              {health.overall.status.toUpperCase()}
            </Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreValue, { color: theme.colors.text }]}>
              {health.overall.score}%
            </Text>
            <Text style={[styles.scoreLabel, { color: theme.colors.text }]}>
              Health Score
            </Text>
          </View>
        </View>

        {health.overall.issues > 0 && (
          <View
            style={[
              styles.issuesContainer,
              { backgroundColor: theme.colors.error + '20' },
            ]}
          >
            <Icon name="alert" size={24} color={theme.colors.error} />
            <Text
              style={[styles.issuesText, { color: theme.colors.error }]}
            >
              {health.overall.issues} active issues
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderResourceMetrics = () => {
    if (!health) return null;

    const resources = [
      {
        name: 'Memory',
        icon: 'memory',
        used: health.resources.memory.used,
        total: health.resources.memory.total,
        threshold: health.resources.memory.threshold,
      },
      {
        name: 'Storage',
        icon: 'harddisk',
        used: health.resources.storage.used,
        total: health.resources.storage.total,
        threshold: health.resources.storage.threshold,
      },
      {
        name: 'CPU',
        icon: 'cpu-64-bit',
        used: health.resources.cpu.usage,
        total: 100,
        threshold: health.resources.cpu.threshold,
      },
      {
        name: 'Battery',
        icon: 'battery',
        used: health.resources.battery.level,
        total: 100,
        threshold: 20,
        charging: health.resources.battery.charging,
      },
    ];

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          System Resources
        </Text>
        <View style={styles.resourcesGrid}>
          {resources.map(resource => {
            const usagePercent = (resource.used / resource.total) * 100;
            const isWarning = usagePercent > resource.threshold;

            return (
              <View
                key={resource.name}
                style={[
                  styles.resourceCard,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <View style={styles.resourceHeader}>
                  <Icon
                    name={resource.icon}
                    size={24}
                    color={isWarning ? theme.colors.error : theme.colors.text}
                  />
                  <Text
                    style={[
                      styles.resourceName,
                      { color: theme.colors.text },
                    ]}
                  >
                    {resource.name}
                  </Text>
                </View>
                <View style={styles.resourceStats}>
                  <Text
                    style={[
                      styles.resourceValue,
                      {
                        color: isWarning
                          ? theme.colors.error
                          : theme.colors.text,
                      },
                    ]}
                  >
                    {resource.name === 'Memory' || resource.name === 'Storage'
                      ? formatBytes(resource.used)
                      : `${Math.round(usagePercent)}%`}
                  </Text>
                  {resource.name === 'Battery' && resource.charging && (
                    <Icon name="battery-charging" size={16} color="#4CAF50" />
                  )}
                </View>
                <View style={styles.resourceProgress}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        backgroundColor: isWarning
                          ? theme.colors.error + '40'
                          : theme.colors.primary + '40',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: isWarning
                            ? theme.colors.error
                            : theme.colors.primary,
                          width: `${usagePercent}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderPerformanceChart = () => {
    if (metrics.length === 0) return null;

    const data = {
      labels: metrics
        .slice(-6)
        .map(m =>
          new Date(m.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        ),
      datasets: [
        {
          data: metrics.slice(-6).map(m => m.metrics.cpu || 0),
        },
      ],
    };

    return (
      <View style={styles.section}>
        <View style={styles.chartHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Performance Trends
          </Text>
          <View style={styles.timeRangeSelector}>
            <TouchableOpacity
              style={[
                styles.timeRangeButton,
                selectedTimeRange === 'hour' && styles.selectedTimeRange,
              ]}
              onPress={() => setSelectedTimeRange('hour')}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  { color: theme.colors.text },
                  selectedTimeRange === 'hour' && styles.selectedTimeRangeText,
                ]}
              >
                1H
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.timeRangeButton,
                selectedTimeRange === 'day' && styles.selectedTimeRange,
              ]}
              onPress={() => setSelectedTimeRange('day')}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  { color: theme.colors.text },
                  selectedTimeRange === 'day' && styles.selectedTimeRangeText,
                ]}
              >
                24H
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <LineChart
          data={data}
          width={width - 32}
          height={220}
          chartConfig={{
            backgroundColor: theme.colors.background,
            backgroundGradientFrom: theme.colors.background,
            backgroundGradientTo: theme.colors.background,
            decimalPlaces: 0,
            color: (opacity = 1) => theme.colors.primary,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  if (loading && !health) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {renderOverallHealth()}
      {renderResourceMetrics()}
      {renderPerformanceChart()}
    </ScrollView>
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
  section: {
    padding: 16,
    marginBottom: 8,
  },
  overallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 14,
  },
  issuesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  issuesText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -8,
  },
  resourceCard: {
    flex: 1,
    minWidth: '45%',
    margin: 8,
    padding: 16,
    borderRadius: 8,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resourceName: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  resourceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resourceValue: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  resourceProgress: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    flex: 1,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectedTimeRange: {
    backgroundColor: '#FFFFFF',
  },
  timeRangeText: {
    fontSize: 14,
  },
  selectedTimeRangeText: {
    fontWeight: '500',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default HealthDashboard;

