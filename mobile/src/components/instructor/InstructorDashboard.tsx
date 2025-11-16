import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import {
  InstructorDashboardService,
  StudentOverview,
  CohortMetrics,
  InterventionRecommendation,
  ModuleInsights,
} from '../../services/InstructorDashboardService';

interface InstructorDashboardProps {
  instructorId: string;
  onStudentSelect?: (studentId: string) => void;
  onModuleSelect?: (moduleId: string) => void;
}

export const InstructorDashboard: React.FC<InstructorDashboardProps> = ({
  instructorId,
  onStudentSelect,
  onModuleSelect,
}) => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentOverview[]>([]);
  const [metrics, setMetrics] = useState<CohortMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<
    InterventionRecommendation[]
  >([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [moduleInsights, setModuleInsights] = useState<ModuleInsights | null>(
    null
  );

  const theme = useTheme();
  const { width } = Dimensions.get('window');
  const dashboardService = InstructorDashboardService.getInstance();

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      await dashboardService.initialize(instructorId);
      await refreshData();
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const [studentList, cohortMetrics, interventions] = await Promise.all([
        dashboardService.getStudentList(instructorId, {
          status: selectedStatus,
          moduleId: selectedModule || undefined,
          searchTerm,
        }),
        dashboardService.getCohortMetrics(instructorId),
        dashboardService.getInterventionRecommendations(instructorId),
      ]);

      setStudents(studentList);
      setMetrics(cohortMetrics);
      setRecommendations(interventions);

      if (selectedModule) {
        const insights = await dashboardService.getModuleInsights(selectedModule);
        setModuleInsights(insights);
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const handleGenerateReport = async (type: 'student' | 'cohort') => {
    try {
      const url =
        type === 'student'
          ? await dashboardService.generateStudentReport(students[0].id)
          : await dashboardService.generateCohortReport(instructorId);

      // Handle report URL (e.g., open in browser or download)
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const renderOverviewStats = () => {
    if (!metrics) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {metrics.activeStudents}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.text }]}>
            Active Students
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {metrics.averageScore.toFixed(1)}%
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.text }]}>
            Average Score
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {metrics.averageCompletion.toFixed(1)}%
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.text }]}>
            Completion Rate
          </Text>
        </View>
      </View>
    );
  };

  const renderPerformanceChart = () => {
    if (!metrics) return null;

    const data = {
      labels: metrics.activityTrend.map(point => point.date),
      datasets: [
        {
          data: metrics.activityTrend.map(point => point.averageScore),
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
          Performance Trend
        </Text>
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

  const renderStudentList = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Students
        </Text>
        <TextInput
          style={[
            styles.searchInput,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.surface,
            },
          ]}
          value={searchTerm}
          onChangeText={text => {
            setSearchTerm(text);
            refreshData();
          }}
          placeholder="Search students..."
          placeholderTextColor={theme.colors.text + '80'}
        />
      </View>
      <FlatList
        data={students}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.studentCard,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() => onStudentSelect?.(item.id)}
          >
            <View style={styles.studentHeader}>
              <Text style={[styles.studentName, { color: theme.colors.text }]}>
                {item.name}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.status === 'active'
                        ? '#4CAF50'
                        : item.status === 'inactive'
                        ? '#FFA000'
                        : '#2196F3',
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
            </View>
            <View style={styles.studentStats}>
              <View style={styles.studentStat}>
                <Text
                  style={[styles.studentStatValue, { color: theme.colors.text }]}
                >
                  {item.progress.overallScore}%
                </Text>
                <Text
                  style={[styles.studentStatLabel, { color: theme.colors.text }]}
                >
                  Score
                </Text>
              </View>
              <View style={styles.studentStat}>
                <Text
                  style={[styles.studentStatValue, { color: theme.colors.text }]}
                >
                  {item.progress.completionRate}%
                </Text>
                <Text
                  style={[styles.studentStatLabel, { color: theme.colors.text }]}
                >
                  Complete
                </Text>
              </View>
              <View style={styles.studentStat}>
                <Text
                  style={[styles.studentStatValue, { color: theme.colors.text }]}
                >
                  {Math.floor(item.progress.timeSpent / 60)}h
                </Text>
                <Text
                  style={[styles.studentStatLabel, { color: theme.colors.text }]}
                >
                  Time
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderRecommendations = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Recommendations
      </Text>
      {recommendations.map((rec, index) => (
        <View
          key={index}
          style={[
            styles.recommendationCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Icon
            name={
              rec.type === 'support'
                ? 'account-alert'
                : rec.type === 'challenge'
                ? 'trophy'
                : 'refresh'
            }
            size={24}
            color={
              rec.priority === 'high'
                ? '#F44336'
                : rec.priority === 'medium'
                ? '#FFA000'
                : '#4CAF50'
            }
          />
          <View style={styles.recommendationContent}>
            <Text
              style={[styles.recommendationTitle, { color: theme.colors.text }]}
            >
              {rec.reason}
            </Text>
            <View style={styles.recommendationActions}>
              {rec.suggestedActions.map((action, actionIndex) => (
                <Text
                  key={actionIndex}
                  style={[
                    styles.recommendationAction,
                    { color: theme.colors.text },
                  ]}
                >
                  • {action}
                </Text>
              ))}
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderModuleInsights = () => {
    if (!moduleInsights) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Module Insights: {moduleInsights.title}
        </Text>
        <View style={styles.insightsGrid}>
          <View
            style={[
              styles.insightCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text style={[styles.insightValue, { color: theme.colors.text }]}>
              {moduleInsights.metrics.difficulty.toFixed(1)}
            </Text>
            <Text style={[styles.insightLabel, { color: theme.colors.text }]}>
              Difficulty
            </Text>
          </View>
          <View
            style={[
              styles.insightCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text style={[styles.insightValue, { color: theme.colors.text }]}>
              {moduleInsights.metrics.reliability.toFixed(2)}
            </Text>
            <Text style={[styles.insightLabel, { color: theme.colors.text }]}>
              Reliability
            </Text>
          </View>
          <View
            style={[
              styles.insightCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text style={[styles.insightValue, { color: theme.colors.text }]}>
              {Math.round(moduleInsights.metrics.averageCompletionTime)}m
            </Text>
            <Text style={[styles.insightLabel, { color: theme.colors.text }]}>
              Avg. Time
            </Text>
          </View>
        </View>
        <View style={styles.improvements}>
          {moduleInsights.improvements.map((improvement, index) => (
            <View
              key={index}
              style={[
                styles.improvementCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Text
                style={[styles.improvementText, { color: theme.colors.text }]}
              >
                {improvement.suggestion}
              </Text>
              <View
                style={[
                  styles.impactBadge,
                  {
                    backgroundColor:
                      improvement.impact === 'high'
                        ? '#F44336'
                        : improvement.impact === 'medium'
                        ? '#FFA000'
                        : '#4CAF50',
                  },
                ]}
              >
                <Text style={styles.impactText}>
                  {improvement.impact.toUpperCase()}
                </Text>
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

  return (
    <ScrollView style={styles.container}>
      {renderOverviewStats()}
      {renderPerformanceChart()}
      {renderStudentList()}
      {renderRecommendations()}
      {moduleInsights && renderModuleInsights()}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => handleGenerateReport('cohort')}
        >
          <Icon name="file-chart" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>Generate Cohort Report</Text>
        </TouchableOpacity>
      </View>
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
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
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
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchInput: {
    flex: 1,
    marginLeft: 16,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  studentCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
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
  studentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  studentStat: {
    alignItems: 'center',
  },
  studentStatValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  studentStatLabel: {
    fontSize: 12,
  },
  recommendationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  recommendationContent: {
    flex: 1,
    marginLeft: 12,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  recommendationActions: {
    marginTop: 4,
  },
  recommendationAction: {
    fontSize: 14,
    marginBottom: 4,
  },
  insightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  insightCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  insightValue: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightLabel: {
    fontSize: 12,
  },
  improvements: {
    marginTop: 16,
  },
  improvementCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  improvementText: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  impactText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    marginTop: 16,
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default InstructorDashboard;