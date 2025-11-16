import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import {
  Card,
  Title,
  Text,
  ProgressBar,
  Surface,
  Chip,
  MD3Colors,
  IconButton,
} from 'react-native-paper';

interface PerformanceMetrics {
  overallScore: number;
  criticalActions: {
    completed: number;
    total: number;
    timing: { action: string; actual: number; target: number }[];
  };
  redFlags: {
    identified: number;
    total: number;
    timing: { flag: string; timeToIdentification: number }[];
  };
  interventions: {
    correct: number;
    total: number;
    sequence: { action: string; expected: number; actual: number }[];
  };
}

interface PerformanceVisualizerProps {
  metrics: PerformanceMetrics;
  onMetricPress?: (metricType: string) => void;
}

const PerformanceVisualizer: React.FC<PerformanceVisualizerProps> = ({
  metrics,
  onMetricPress,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return MD3Colors.success40;
    if (score >= 80) return MD3Colors.tertiary40;
    if (score >= 70) return MD3Colors.warning40;
    return MD3Colors.error40;
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return 'Expert';
    if (score >= 80) return 'Proficient';
    if (score >= 70) return 'Competent';
    return 'Developing';
  };

  const renderOverallScore = () => (
    <Card style={styles.scoreCard}>
      <Card.Content>
        <View style={styles.scoreHeader}>
          <Title>Overall Performance</Title>
          <Chip
            mode="flat"
            style={[styles.levelChip, { backgroundColor: getScoreColor(metrics.overallScore) }]}
          >
            {getPerformanceLevel(metrics.overallScore)}
          </Chip>
        </View>
        <Surface style={styles.scoreContainer}>
          <Text style={[styles.scoreText, { color: getScoreColor(metrics.overallScore) }]}>
            {metrics.overallScore}%
          </Text>
          <ProgressBar
            progress={metrics.overallScore / 100}
            color={getScoreColor(metrics.overallScore)}
            style={styles.progressBar}
          />
        </Surface>
      </Card.Content>
    </Card>
  );

  const renderCriticalActions = () => (
    <Card style={styles.metricCard} onPress={() => onMetricPress?.('criticalActions')}>
      <Card.Content>
        <View style={styles.metricHeader}>
          <Title>Critical Actions</Title>
          <IconButton icon="timer" size={24} />
        </View>
        <View style={styles.metricContent}>
          <View style={styles.metricStats}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={styles.statValue}>
              {metrics.criticalActions.completed}/{metrics.criticalActions.total}
            </Text>
          </View>
          <View style={styles.timingContainer}>
            {metrics.criticalActions.timing.map((timing, index) => (
              <View key={index} style={styles.timingItem}>
                <Text style={styles.timingLabel}>{timing.action}</Text>
                <View style={styles.timingBar}>
                  <View 
                    style={[
                      styles.timingProgress,
                      {
                        width: `${Math.min(100, (timing.target / timing.actual) * 100)}%`,
                        backgroundColor: timing.actual <= timing.target ? 
                          MD3Colors.success40 : MD3Colors.error40,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.timingValue}>{timing.actual}s</Text>
              </View>
            ))}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderRedFlags = () => (
    <Card style={styles.metricCard} onPress={() => onMetricPress?.('redFlags')}>
      <Card.Content>
        <View style={styles.metricHeader}>
          <Title>Red Flag Recognition</Title>
          <IconButton icon="flag" size={24} />
        </View>
        <View style={styles.metricContent}>
          <View style={styles.metricStats}>
            <Text style={styles.statLabel}>Identified</Text>
            <Text style={styles.statValue}>
              {metrics.redFlags.identified}/{metrics.redFlags.total}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {metrics.redFlags.timing.map((flag, index) => (
              <Surface key={index} style={styles.flagCard}>
                <Text style={styles.flagText}>{flag.flag}</Text>
                <Text style={styles.flagTiming}>
                  {flag.timeToIdentification}s
                </Text>
              </Surface>
            ))}
          </ScrollView>
        </View>
      </Card.Content>
    </Card>
  );

  const renderInterventions = () => (
    <Card style={styles.metricCard} onPress={() => onMetricPress?.('interventions')}>
      <Card.Content>
        <View style={styles.metricHeader}>
          <Title>Interventions</Title>
          <IconButton icon="medical-bag" size={24} />
        </View>
        <View style={styles.metricContent}>
          <View style={styles.metricStats}>
            <Text style={styles.statLabel}>Correct Sequence</Text>
            <Text style={styles.statValue}>
              {metrics.interventions.correct}/{metrics.interventions.total}
            </Text>
          </View>
          <View style={styles.sequenceContainer}>
            {metrics.interventions.sequence.map((item, index) => (
              <View key={index} style={styles.sequenceItem}>
                <Text style={styles.sequenceAction}>{item.action}</Text>
                <View style={styles.sequenceIndicator}>
                  <Text style={styles.sequenceNumber}>
                    {item.actual === item.expected ? '✓' : `${item.actual + 1}`}
                  </Text>
                  <Text style={styles.sequenceExpected}>
                    Expected: {item.expected + 1}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      {renderOverallScore()}
      {renderCriticalActions()}
      {renderRedFlags()}
      {renderInterventions()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scoreCard: {
    margin: 16,
    elevation: 4,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelChip: {
    height: 28,
  },
  scoreContainer: {
    alignItems: 'center',
    padding: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    marginTop: 8,
  },
  metricCard: {
    margin: 16,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricContent: {
    marginTop: 16,
  },
  metricStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 16,
    color: MD3Colors.neutral60,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  timingContainer: {
    marginTop: 8,
  },
  timingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  timingLabel: {
    flex: 2,
    fontSize: 14,
  },
  timingBar: {
    flex: 3,
    height: 8,
    backgroundColor: MD3Colors.neutral90,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  timingProgress: {
    height: '100%',
    borderRadius: 4,
  },
  timingValue: {
    flex: 1,
    fontSize: 14,
    textAlign: 'right',
  },
  flagCard: {
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    elevation: 1,
  },
  flagText: {
    fontSize: 14,
    marginBottom: 4,
  },
  flagTiming: {
    fontSize: 12,
    color: MD3Colors.neutral60,
  },
  sequenceContainer: {
    marginTop: 8,
  },
  sequenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: MD3Colors.neutral90,
  },
  sequenceAction: {
    flex: 1,
    fontSize: 14,
  },
  sequenceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sequenceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  sequenceExpected: {
    fontSize: 12,
    color: MD3Colors.neutral60,
  },
});

export default PerformanceVisualizer;

