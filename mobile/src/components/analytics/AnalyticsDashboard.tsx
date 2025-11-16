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
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import {
  LearningAnalyticsService,
  PerformanceMetrics,
  LearningPath,
  CompetencyMap,
} from '../../services/LearningAnalyticsService';

interface AnalyticsDashboardProps {
  userId: string;
  onModuleSelect?: (moduleId: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userId,
  onModuleSelect,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [competencies, setCompetencies] = useState<CompetencyMap | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'daily' | 'weekly'>(
    'daily'
  );

  const theme = useTheme();
  const { width } = Dimensions.get('window');
  const analyticsService = LearningAnalyticsService.getInstance();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      await analyticsService.initializeAnalytics(userId);
      const [metricsData, pathData, competencyData, insightsData] =
        await Promise.all([
          analyticsService.getPerformanceMetrics(userId),
          analyticsService.getLearningPath(userId),
          analyticsService.getCompetencyMap(userId),
          analyticsService.getInsights(userId),
        ]);

      setMetrics(metricsData);
      setLearningPath(pathData);
      setCompetencies(competencyData);
      setInsights(insightsData);
    } catch (err) {
      setError('Failed to load analytics');
      console.error('Analytics loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const renderPerformanceChart = () => {
    if (!metrics) return null;

    const data = {
      labels:
        selectedTimeframe === 'daily'
          ? metrics.trends.daily.map(d => d.date)
          : metrics.trends.weekly.map(w => w.week),
      datasets: [
        {
          data:
            selectedTimeframe === 'daily'
              ? metrics.trends.daily.map(d => d.score)
              : metrics.trends.weekly.map(w => w.averageScore),
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            Performance Trend
          </Text>
          <View style={styles.timeframeSelector}>
            <TouchableOpacity
              style={[
                styles.timeframeButton,
                selectedTimeframe === 'daily' && styles.selectedTimeframe,
              ]}
              onPress={() => setSelectedTimeframe('daily')}
            >
              <Text
                style={[
                  styles.timeframeText,
                  { color: theme.colors.text },
                  selectedTimeframe === 'daily' && styles.selectedTimeframeText,
                ]}
              >
                Daily
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.timeframeButton,
                selectedTimeframe === 'weekly' && styles.selectedTimeframe,
              ]}
              onPress={() => setSelectedTimeframe('weekly')}
            >
              <Text
                style={[
                  styles.timeframeText,
                  { color: theme.colors.text },
                  selectedTimeframe === 'weekly' && styles.selectedTimeframeText,
                ]}
              >
                Weekly
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

  const renderCompetencyRadar = () => {
    if (!competencies) return null;

    const competencyLevels = {
      novice: 1,
      beginner: 2,
      competent: 3,
      proficient: 4,
      expert: 5,
    };

    const data = Object.entries(competencies).map(([name, data]) => ({
      name,
      score: competencyLevels[data.level],
    }));

    return (
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
          Competency Map
        </Text>
        <PieChart
          data={data.map(item => ({
            name: item.name,
            population: item.score,
            color: `hsl(${(item.score / 5) * 120}, 70%, 50%)`,
            legendFontColor: theme.colors.text,
          }))}
          width={width - 32}
          height={220}
          chartConfig={{
            color: (opacity = 1) => theme.colors.text,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
        />
      </View>
    );
  };

  const renderInsights = () => {
    if (!insights.length) return null;

    return (
      <View style={styles.insightsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Insights & Recommendations
        </Text>
        {insights.map((insight, index) => (
          <View
            key={index}
            style={[
              styles.insightCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Icon
              name={
                insight.type === 'achievement'
                  ? 'trophy'
                  : insight.type === 'warning'
                  ? 'alert'
                  : insight.type === 'suggestion'
                  ? 'lightbulb'
                  : 'flag'
              }
              size={24}
              color={
                insight.type === 'achievement'
                  ? '#4CAF50'
                  : insight.type === 'warning'
                  ? '#F44336'
                  : insight.type === 'suggestion'
                  ? '#2196F3'
                  : '#FFC107'
              }
            />
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: theme.colors.text }]}>
                {insight.title}
              </Text>
              <Text
                style={[styles.insightDescription, { color: theme.colors.text }]}
              >
                {insight.description}
              </Text>
              {insight.actionable && insight.action && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() =>
                    insight.action?.moduleId &&
                    onModuleSelect?.(insight.action.moduleId)
                  }
                >
                  <Text style={styles.actionButtonText}>
                    {insight.action.description}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderLearningPath = () => {
    if (!learningPath) return null;

    return (
      <View style={styles.pathContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Learning Path
        </Text>
        <Text style={[styles.currentLevel, { color: theme.colors.text }]}>
          Current Level: {learningPath.currentLevel}
        </Text>
        <View style={styles.milestones}>
          {learningPath.nextMilestones.map((milestone, index) => (
            <View
              key={index}
              style={[
                styles.milestoneCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View style={styles.milestoneHeader}>
                <Text
                  style={[styles.milestoneTitle, { color: theme.colors.text }]}
                >
                  {milestone.description}
                </Text>
                <Text
                  style={[styles.milestoneProgress, { color: theme.colors.text }]}
                >
                  {milestone.progress}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.colors.primary,
                      width: `${milestone.progress}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
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
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={loadAnalytics}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Overall Stats */}
      {metrics && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {metrics.overall.averageScore}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>
              Average Score
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {metrics.overall.completionRate}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>
              Completion Rate
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatDuration(metrics.overall.timeSpent)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>
              Time Spent
            </Text>
          </View>
        </View>
      )}

      {/* Performance Chart */}
      {renderPerformanceChart()}

      {/* Competency Radar */}
      {renderCompetencyRadar()}

      {/* Learning Path */}
      {renderLearningPath()}

      {/* Insights */}
      {renderInsights()}
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectedTimeframe: {
    backgroundColor: '#FFFFFF',
  },
  timeframeText: {
    fontSize: 14,
  },
  selectedTimeframeText: {
    fontWeight: '500',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  pathContainer: {
    marginBottom: 24,
  },
  currentLevel: {
    fontSize: 16,
    marginBottom: 16,
  },
  milestones: {
    marginBottom: 16,
  },
  milestoneCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  milestoneProgress: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  insightsContainer: {
    marginBottom: 24,
  },
  insightCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  insightContent: {
    flex: 1,
    marginLeft: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  actionButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  error: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AnalyticsDashboard;

