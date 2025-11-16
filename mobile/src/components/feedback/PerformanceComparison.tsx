import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import {
  Card,
  Title,
  Text,
  SegmentedButtons,
  Surface,
  MD3Colors,
  IconButton,
  Button,
  Portal,
  Dialog,
} from 'react-native-paper';

interface PerformanceData {
  date: string;
  scenarioType: string;
  metrics: {
    overallScore: number;
    criticalActions: number;
    redFlags: number;
    interventions: number;
    timing: number;
  };
}

interface PerformanceComparisonProps {
  performances: PerformanceData[];
  onScenarioSelect?: (scenarioType: string) => void;
  onTimeRangeChange?: (range: string) => void;
}

const PerformanceComparison: React.FC<PerformanceComparisonProps> = ({
  performances,
  onScenarioSelect,
  onTimeRangeChange,
}) => {
  const [timeRange, setTimeRange] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('overallScore');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPerformance, setSelectedPerformance] = useState<PerformanceData | null>(null);

  const getScenarioTypes = () => {
    return Array.from(new Set(performances.map(p => p.scenarioType)));
  };

  const getAveragesByScenario = () => {
    const scenarios = getScenarioTypes();
    return scenarios.map(type => {
      const scenarioPerformances = performances.filter(p => p.scenarioType === type);
      return {
        type,
        average: scenarioPerformances.reduce((acc, curr) => acc + curr.metrics.overallScore, 0) / 
                 scenarioPerformances.length,
        count: scenarioPerformances.length,
      };
    });
  };

  const getPerformanceTrend = () => {
    if (performances.length < 2) return 'insufficient_data';
    
    const recent = performances.slice(-3);
    const trend = recent[recent.length - 1].metrics.overallScore - recent[0].metrics.overallScore;
    
    if (trend > 5) return 'improving';
    if (trend < -5) return 'declining';
    return 'stable';
  };

  const renderTrendIndicator = () => {
    const trend = getPerformanceTrend();
    const trendColors = {
      improving: MD3Colors.success40,
      declining: MD3Colors.error40,
      stable: MD3Colors.neutral40,
      insufficient_data: MD3Colors.neutral40,
    };

    const trendIcons = {
      improving: 'trending-up',
      declining: 'trending-down',
      stable: 'trending-neutral',
      insufficient_data: 'help-circle',
    };

    return (
      <Surface style={[styles.trendIndicator, { backgroundColor: trendColors[trend] }]}>
        <IconButton
          icon={trendIcons[trend]}
          iconColor="white"
          size={20}
        />
        <Text style={styles.trendText}>
          {trend.charAt(0).toUpperCase() + trend.slice(1)}
        </Text>
      </Surface>
    );
  };

  const renderTimeRangeSelector = () => (
    <SegmentedButtons
      value={timeRange}
      onValueChange={value => {
        setTimeRange(value);
        onTimeRangeChange?.(value);
      }}
      buttons={[
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
        { value: 'all', label: 'All Time' },
      ]}
      style={styles.timeRangeSelector}
    />
  );

  const renderScenarioComparison = () => {
    const averages = getAveragesByScenario();
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Performance by Scenario Type</Title>
          {averages.map((scenario, index) => (
            <Surface 
              key={index} 
              style={styles.scenarioContainer}
              onTouchEnd={() => onScenarioSelect?.(scenario.type)}
            >
              <View style={styles.scenarioHeader}>
                <Text style={styles.scenarioType}>{scenario.type}</Text>
                <Text style={styles.scenarioCount}>({scenario.count} attempts)</Text>
              </View>
              <View style={styles.scoreBar}>
                <View 
                  style={[
                    styles.scoreProgress,
                    {
                      width: `${scenario.average}%`,
                      backgroundColor: getScoreColor(scenario.average),
                    },
                  ]}
                />
                <Text style={styles.scoreText}>{Math.round(scenario.average)}%</Text>
              </View>
            </Surface>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderMetricTrends = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Performance Trends</Title>
        <View style={styles.metricSelector}>
          <Button
            mode={selectedMetric === 'overallScore' ? 'contained' : 'outlined'}
            onPress={() => setSelectedMetric('overallScore')}
          >
            Overall
          </Button>
          <Button
            mode={selectedMetric === 'criticalActions' ? 'contained' : 'outlined'}
            onPress={() => setSelectedMetric('criticalActions')}
          >
            Critical Actions
          </Button>
          <Button
            mode={selectedMetric === 'redFlags' ? 'contained' : 'outlined'}
            onPress={() => setSelectedMetric('redFlags')}
          >
            Red Flags
          </Button>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.trendGraph}>
            {performances.map((performance, index) => (
              <View 
                key={index}
                style={styles.trendPoint}
                onTouchEnd={() => {
                  setSelectedPerformance(performance);
                  setShowDetails(true);
                }}
              >
                <View 
                  style={[
                    styles.trendBar,
                    {
                      height: `${performance.metrics[selectedMetric]}%`,
                      backgroundColor: getScoreColor(performance.metrics[selectedMetric]),
                    },
                  ]}
                />
                <Text style={styles.trendDate}>
                  {new Date(performance.date).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </Card.Content>
    </Card>
  );

  const renderDetailsDialog = () => (
    <Portal>
      <Dialog visible={showDetails} onDismiss={() => setShowDetails(false)}>
        <Dialog.Title>Performance Details</Dialog.Title>
        <Dialog.Content>
          {selectedPerformance && (
            <View>
              <Text style={styles.detailDate}>
                {new Date(selectedPerformance.date).toLocaleDateString()}
              </Text>
              <Text style={styles.detailType}>
                {selectedPerformance.scenarioType}
              </Text>
              <View style={styles.detailMetrics}>
                <View style={styles.detailMetric}>
                  <Text style={styles.metricLabel}>Overall Score</Text>
                  <Text style={styles.metricValue}>
                    {selectedPerformance.metrics.overallScore}%
                  </Text>
                </View>
                <View style={styles.detailMetric}>
                  <Text style={styles.metricLabel}>Critical Actions</Text>
                  <Text style={styles.metricValue}>
                    {selectedPerformance.metrics.criticalActions}%
                  </Text>
                </View>
                <View style={styles.detailMetric}>
                  <Text style={styles.metricLabel}>Red Flags</Text>
                  <Text style={styles.metricValue}>
                    {selectedPerformance.metrics.redFlags}%
                  </Text>
                </View>
                <View style={styles.detailMetric}>
                  <Text style={styles.metricLabel}>Interventions</Text>
                  <Text style={styles.metricValue}>
                    {selectedPerformance.metrics.interventions}%
                  </Text>
                </View>
                <View style={styles.detailMetric}>
                  <Text style={styles.metricLabel}>Timing</Text>
                  <Text style={styles.metricValue}>
                    {selectedPerformance.metrics.timing}%
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowDetails(false)}>Close</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {renderTrendIndicator()}
        {renderTimeRangeSelector()}
      </View>
      {renderScenarioComparison()}
      {renderMetricTrends()}
      {renderDetailsDialog()}
    </ScrollView>
  );
};

const getScoreColor = (score: number) => {
  if (score >= 90) return MD3Colors.success40;
  if (score >= 80) return MD3Colors.tertiary40;
  if (score >= 70) return MD3Colors.warning40;
  return MD3Colors.error40;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  trendText: {
    color: 'white',
    marginLeft: 4,
  },
  timeRangeSelector: {
    flex: 1,
    marginLeft: 16,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  scenarioContainer: {
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
  },
  scenarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scenarioType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scenarioCount: {
    fontSize: 14,
    color: MD3Colors.neutral60,
  },
  scoreBar: {
    height: 24,
    backgroundColor: MD3Colors.neutral90,
    borderRadius: 12,
    overflow: 'hidden',
  },
  scoreProgress: {
    height: '100%',
    position: 'absolute',
  },
  scoreText: {
    position: 'absolute',
    right: 8,
    top: 2,
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  metricSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  trendGraph: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 200,
    paddingVertical: 16,
  },
  trendPoint: {
    width: 40,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  trendBar: {
    width: 24,
    borderRadius: 12,
  },
  trendDate: {
    fontSize: 10,
    marginTop: 4,
    transform: [{ rotate: '-45deg' }],
  },
  detailDate: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailType: {
    fontSize: 16,
    color: MD3Colors.neutral60,
    marginBottom: 16,
  },
  detailMetrics: {
    marginTop: 16,
  },
  detailMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: MD3Colors.neutral60,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default PerformanceComparison;

