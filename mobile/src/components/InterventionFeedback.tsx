import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  List,
  Surface,
  Text,
  ProgressBar,
  Chip,
  Button,
  Portal,
  Dialog,
  MD3Colors,
} from 'react-native-paper';

interface Intervention {
  id: string;
  name: string;
  category: string;
  priority: 'immediate' | 'urgent' | 'priority' | 'delayed';
  timeToComplete: number;
  steps: string[];
}

interface FeedbackMetrics {
  timeToRecognition: number;
  timeToIntervention: number;
  criticalStepsCompleted: boolean[];
  sequenceScore: number;
  overallScore: number;
  missedOpportunities: string[];
  excellentChoices: string[];
  improvementAreas: string[];
}

interface InterventionFeedbackProps {
  selectedInterventions: Intervention[];
  recommendedInterventions: Intervention[];
  patientOutcome: string;
  metrics: FeedbackMetrics;
  onComplete: () => void;
}

const InterventionFeedback: React.FC<InterventionFeedbackProps> = ({
  selectedInterventions,
  recommendedInterventions,
  patientOutcome,
  metrics,
  onComplete,
}) => {
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const calculatePerformanceLevel = (score: number): string => {
    if (score >= 90) return 'Expert Performance';
    if (score >= 80) return 'Proficient Performance';
    if (score >= 70) return 'Competent Performance';
    return 'Developing Performance';
  };

  const renderPerformanceOverview = () => (
    <Card style={styles.overviewCard}>
      <Card.Content>
        <Title>Performance Overview</Title>
        <Surface style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{metrics.overallScore}%</Text>
          <Text style={styles.levelText}>
            {calculatePerformanceLevel(metrics.overallScore)}
          </Text>
          <ProgressBar
            progress={metrics.overallScore / 100}
            color={getScoreColor(metrics.overallScore)}
            style={styles.progressBar}
          />
        </Surface>

        <View style={styles.metricsContainer}>
          <Chip 
            icon="clock"
            style={styles.metricChip}
            onPress={() => setSelectedMetric('recognition')}
          >
            Recognition: {metrics.timeToRecognition}s
          </Chip>
          <Chip
            icon="clock-fast"
            style={styles.metricChip}
            onPress={() => setSelectedMetric('intervention')}
          >
            Intervention: {metrics.timeToIntervention}s
          </Chip>
          <Chip
            icon="check-circle"
            style={styles.metricChip}
            onPress={() => setSelectedMetric('sequence')}
          >
            Sequence: {metrics.sequenceScore}%
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );

  const renderInterventionComparison = () => (
    <Card style={styles.comparisonCard}>
      <Card.Content>
        <Title>Intervention Analysis</Title>
        
        <View style={styles.comparisonSection}>
          <Text style={styles.sectionTitle}>Selected Interventions</Text>
          {selectedInterventions.map((intervention, index) => (
            <Surface key={intervention.id} style={styles.interventionItem}>
              <Text style={styles.interventionNumber}>{index + 1}</Text>
              <View style={styles.interventionDetails}>
                <Text style={styles.interventionName}>{intervention.name}</Text>
                <Text style={styles.interventionTiming}>
                  Time: {intervention.timeToComplete}min
                </Text>
              </View>
              <Chip 
                style={[
                  styles.priorityChip,
                  { backgroundColor: getPriorityColor(intervention.priority) }
                ]}
              >
                {intervention.priority}
              </Chip>
            </Surface>
          ))}
        </View>

        {metrics.missedOpportunities.length > 0 && (
          <View style={styles.missedSection}>
            <Text style={styles.sectionTitle}>Missed Opportunities</Text>
            {metrics.missedOpportunities.map((missed, index) => (
              <Text key={index} style={styles.missedItem}>• {missed}</Text>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderFeedbackSummary = () => (
    <Card style={styles.feedbackCard}>
      <Card.Content>
        <Title>Performance Feedback</Title>

        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackTitle}>Excellent Choices</Text>
          {metrics.excellentChoices.map((choice, index) => (
            <Text key={index} style={styles.feedbackItem}>✓ {choice}</Text>
          ))}
        </View>

        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackTitle}>Areas for Improvement</Text>
          {metrics.improvementAreas.map((area, index) => (
            <Text key={index} style={styles.feedbackItem}>• {area}</Text>
          ))}
        </View>

        <View style={styles.outcomeSection}>
          <Text style={styles.outcomeTitle}>Patient Outcome</Text>
          <Text style={styles.outcomeText}>{patientOutcome}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderDetailedAnalysisDialog = () => (
    <Portal>
      <Dialog
        visible={showDetailedAnalysis}
        onDismiss={() => setShowDetailedAnalysis(false)}
        style={styles.dialog}
      >
        <Dialog.Title>Detailed Performance Analysis</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView>
            <List.Section>
              <List.Subheader>Critical Steps Analysis</List.Subheader>
              {metrics.criticalStepsCompleted.map((completed, index) => (
                <List.Item
                  key={index}
                  title={`Step ${index + 1}`}
                  description={completed ? 'Completed correctly' : 'Needs improvement'}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={completed ? 'check-circle' : 'alert-circle'}
                      color={completed ? MD3Colors.success40 : MD3Colors.error40}
                    />
                  )}
                />
              ))}

              <List.Subheader>Time Analysis</List.Subheader>
              <List.Item
                title="Recognition Time"
                description={`${metrics.timeToRecognition} seconds`}
                left={props => <List.Icon {...props} icon="clock" />}
              />
              <List.Item
                title="Intervention Time"
                description={`${metrics.timeToIntervention} seconds`}
                left={props => <List.Icon {...props} icon="clock-fast" />}
              />

              <List.Subheader>Sequence Analysis</List.Subheader>
              <List.Item
                title="Sequence Score"
                description={`${metrics.sequenceScore}%`}
                left={props => <List.Icon {...props} icon="order-numeric-ascending" />}
              />
            </List.Section>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={() => setShowDetailedAnalysis(false)}>Close</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        {renderPerformanceOverview()}
        {renderInterventionComparison()}
        {renderFeedbackSummary()}
        
        <Button
          mode="contained"
          onPress={() => setShowDetailedAnalysis(true)}
          style={styles.analysisButton}
        >
          View Detailed Analysis
        </Button>
        
        <Button
          mode="contained"
          onPress={onComplete}
          style={styles.completeButton}
        >
          Complete Review
        </Button>
      </ScrollView>
      {renderDetailedAnalysisDialog()}
    </View>
  );
};

const getScoreColor = (score: number) => {
  if (score >= 90) return MD3Colors.success40;
  if (score >= 80) return MD3Colors.tertiary40;
  if (score >= 70) return MD3Colors.warning40;
  return MD3Colors.error40;
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'immediate': return MD3Colors.error40;
    case 'urgent': return MD3Colors.warning40;
    case 'priority': return MD3Colors.tertiary40;
    default: return MD3Colors.neutral40;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  overviewCard: {
    marginBottom: 16,
  },
  scoreContainer: {
    alignItems: 'center',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: MD3Colors.primary40,
  },
  levelText: {
    fontSize: 18,
    marginVertical: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  metricChip: {
    margin: 4,
  },
  comparisonCard: {
    marginBottom: 16,
  },
  comparisonSection: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: MD3Colors.primary40,
  },
  interventionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginVertical: 4,
    borderRadius: 8,
  },
  interventionNumber: {
    width: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  interventionDetails: {
    flex: 1,
    marginLeft: 8,
  },
  interventionName: {
    fontSize: 16,
  },
  interventionTiming: {
    fontSize: 12,
    color: MD3Colors.neutral60,
  },
  priorityChip: {
    marginLeft: 8,
  },
  missedSection: {
    marginTop: 16,
  },
  missedItem: {
    marginLeft: 8,
    marginVertical: 2,
    color: MD3Colors.error40,
  },
  feedbackCard: {
    marginBottom: 16,
  },
  feedbackSection: {
    marginVertical: 8,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: MD3Colors.primary40,
  },
  feedbackItem: {
    marginLeft: 8,
    marginVertical: 2,
  },
  outcomeSection: {
    marginTop: 16,
    padding: 8,
    backgroundColor: MD3Colors.primary95,
    borderRadius: 8,
  },
  outcomeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  outcomeText: {
    fontSize: 14,
  },
  analysisButton: {
    marginBottom: 8,
  },
  completeButton: {
    marginBottom: 16,
  },
  dialog: {
    maxHeight: '80%',
  },
});

export default InterventionFeedback;

