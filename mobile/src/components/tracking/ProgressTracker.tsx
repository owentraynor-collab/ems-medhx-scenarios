import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { StudentTrackingService } from '../../services/StudentTrackingService';
import { useTheme } from '../../hooks/useTheme';
import { formatDuration } from '../../utils/timeUtils';

interface ProgressData {
  totalModulesCompleted: number;
  averageScore: number;
  timeSpent: number;
  lastActivity: string;
  strengthAreas: string[];
  improvementAreas: string[];
  recommendedModules: string[];
}

interface ProgressTrackerProps {
  userId: string;
  onModuleSelect?: (moduleId: string) => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  userId,
  onModuleSelect,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const trackingService = StudentTrackingService.getInstance();

  useEffect(() => {
    loadProgressData();
  }, [userId]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const snapshot = await trackingService.getProgressSnapshot(userId);
      setProgressData(snapshot);
      
      // Format data for charts
      const formattedData = formatChartData(snapshot);
      setChartData(formattedData);
    } catch (err) {
      setError('Failed to load progress data');
      console.error('Progress loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = (data: ProgressData) => {
    // Sample chart data structure
    return {
      labels: ['Module 1', 'Module 2', 'Module 3', 'Module 4'],
      datasets: [{
        data: [
          data.averageScore,
          data.averageScore * 0.9,
          data.averageScore * 1.1,
          data.averageScore,
        ],
      }],
    };
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
      </View>
    );
  }

  if (!progressData) {
    return (
      <View style={styles.centered}>
        <Text>No progress data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Overview Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress Overview</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{progressData.totalModulesCompleted}</Text>
            <Text style={styles.statLabel}>Modules Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{progressData.averageScore}%</Text>
            <Text style={styles.statLabel}>Average Score</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatDuration(progressData.timeSpent)}
            </Text>
            <Text style={styles.statLabel}>Time Spent</Text>
          </View>
        </View>
      </View>

      {/* Performance Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Trend</Text>
        <LineChart
          data={chartData}
          width={width - 40}
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

      {/* Strengths & Areas for Improvement */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Strengths</Text>
        {progressData.strengthAreas.map((strength, index) => (
          <Text key={`strength-${index}`} style={styles.listItem}>
            • {strength}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Areas for Improvement</Text>
        {progressData.improvementAreas.map((area, index) => (
          <Text key={`improvement-${index}`} style={styles.listItem}>
            • {area}
          </Text>
        ))}
      </View>

      {/* Recommended Modules */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended Next Steps</Text>
        {progressData.recommendedModules.map((module, index) => (
          <Text
            key={`module-${index}`}
            style={[styles.listItem, styles.clickable]}
            onPress={() => onModuleSelect?.(module)}
          >
            → {module}
          </Text>
        ))}
      </View>

      {/* Last Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Last Activity</Text>
        <Text style={styles.lastActivity}>{progressData.lastActivity}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  listItem: {
    fontSize: 16,
    marginBottom: 8,
    paddingLeft: 8,
  },
  clickable: {
    textDecorationLine: 'underline',
  },
  lastActivity: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666',
  },
  error: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ProgressTracker;

