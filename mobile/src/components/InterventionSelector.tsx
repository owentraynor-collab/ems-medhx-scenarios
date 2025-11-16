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
  Button,
  List,
  Surface,
  Text,
  Chip,
  Portal,
  Dialog,
  IconButton,
  ProgressBar,
  MD3Colors,
} from 'react-native-paper';

interface Intervention {
  id: string;
  name: string;
  category: 'airway' | 'breathing' | 'circulation' | 'medication' | 'monitoring' | 'transport' | 'other';
  priority: 'immediate' | 'urgent' | 'priority' | 'delayed';
  icon: string;
  requirements?: string[];
  contraindications?: string[];
  steps: string[];
  rationale: string;
  timeToComplete: number; // in minutes
}

interface InterventionSelectorProps {
  availableInterventions: Intervention[];
  patientCondition: string;
  identifiedRedFlags: string[];
  onInterventionComplete: (intervention: Intervention) => void;
  onComplete: () => void;
}

const InterventionSelector: React.FC<InterventionSelectorProps> = ({
  availableInterventions,
  patientCondition,
  identifiedRedFlags,
  onInterventionComplete,
  onComplete,
}) => {
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [implementingIntervention, setImplementingIntervention] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedInterventions, setCompletedInterventions] = useState<Set<string>>(new Set());

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate': return MD3Colors.error50;
      case 'urgent': return MD3Colors.error40;
      case 'priority': return MD3Colors.warning40;
      default: return MD3Colors.neutral40;
    }
  };

  const handleInterventionSelect = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setShowDetails(true);
  };

  const startImplementation = () => {
    setShowDetails(false);
    setImplementingIntervention(true);
    setCurrentStep(0);
  };

  const completeStep = () => {
    if (selectedIntervention && currentStep < selectedIntervention.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeIntervention();
    }
  };

  const completeIntervention = () => {
    if (selectedIntervention) {
      const newCompleted = new Set(completedInterventions);
      newCompleted.add(selectedIntervention.id);
      setCompletedInterventions(newCompleted);
      onInterventionComplete(selectedIntervention);
    }
    setImplementingIntervention(false);
    setSelectedIntervention(null);
  };

  const renderInterventionDetails = () => (
    <Portal>
      <Dialog visible={showDetails} onDismiss={() => setShowDetails(false)}>
        <Dialog.Title>{selectedIntervention?.name}</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.sectionTitle}>Rationale</Text>
          <Text style={styles.contentText}>{selectedIntervention?.rationale}</Text>

          {selectedIntervention?.requirements && (
            <>
              <Text style={styles.sectionTitle}>Requirements</Text>
              {selectedIntervention.requirements.map((req, index) => (
                <Text key={index} style={styles.bulletPoint}>• {req}</Text>
              ))}
            </>
          )}

          {selectedIntervention?.contraindications && (
            <>
              <Text style={styles.sectionTitle}>Contraindications</Text>
              {selectedIntervention.contraindications.map((contra, index) => (
                <Text key={index} style={styles.bulletPoint}>• {contra}</Text>
              ))}
            </>
          )}

          <Text style={styles.sectionTitle}>Estimated Time</Text>
          <Text style={styles.contentText}>{selectedIntervention?.timeToComplete} minutes</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowDetails(false)}>Cancel</Button>
          <Button mode="contained" onPress={startImplementation}>Implement</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  const renderImplementationDialog = () => (
    <Portal>
      <Dialog visible={implementingIntervention} onDismiss={() => setImplementingIntervention(false)}>
        <Dialog.Title>Implementing: {selectedIntervention?.name}</Dialog.Title>
        <Dialog.Content>
          <ProgressBar
            progress={(currentStep + 1) / (selectedIntervention?.steps.length || 1)}
            style={styles.progressBar}
          />
          
          <Text style={styles.stepTitle}>Step {currentStep + 1} of {selectedIntervention?.steps.length}</Text>
          <Text style={styles.stepText}>{selectedIntervention?.steps[currentStep]}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setImplementingIntervention(false)}>Cancel</Button>
          <Button mode="contained" onPress={completeStep}>
            {currentStep < (selectedIntervention?.steps.length || 0) - 1 ? 'Next Step' : 'Complete'}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  const renderInterventionsByCategory = () => {
    const categories = Array.from(
      new Set(availableInterventions.map(int => int.category))
    );

    return categories.map(category => (
      <Surface key={category} style={styles.categoryContainer}>
        <Title style={styles.categoryTitle}>
          {category.charAt(0).toUpperCase() + category.slice(1)} Interventions
        </Title>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.interventionRow}>
            {availableInterventions
              .filter(int => int.category === category)
              .map(intervention => (
                <Card
                  key={intervention.id}
                  style={[
                    styles.interventionCard,
                    completedInterventions.has(intervention.id) && styles.completedCard
                  ]}
                  onPress={() => handleInterventionSelect(intervention)}
                >
                  <Card.Content>
                    <IconButton
                      icon={intervention.icon}
                      size={30}
                      iconColor={getPriorityColor(intervention.priority)}
                    />
                    <Text style={styles.interventionName}>{intervention.name}</Text>
                    <Chip
                      style={[styles.priorityChip, { backgroundColor: getPriorityColor(intervention.priority) }]}
                    >
                      {intervention.priority}
                    </Chip>
                  </Card.Content>
                </Card>
              ))}
          </View>
        </ScrollView>
      </Surface>
    ));
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Patient Condition</Title>
            <Paragraph>{patientCondition}</Paragraph>
            <View style={styles.redFlagsContainer}>
              {identifiedRedFlags.map((flag, index) => (
                <Chip key={index} style={styles.redFlagChip}>{flag}</Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
        {renderInterventionsByCategory()}
      </ScrollView>
      <Button
        mode="contained"
        style={styles.completeButton}
        onPress={onComplete}
        disabled={completedInterventions.size === 0}
      >
        Complete Interventions
      </Button>
      {renderInterventionDetails()}
      {renderImplementationDialog()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryCard: {
    margin: 8,
    backgroundColor: MD3Colors.primary99,
  },
  redFlagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  redFlagChip: {
    margin: 4,
    backgroundColor: MD3Colors.error90,
  },
  categoryContainer: {
    margin: 8,
    padding: 8,
    borderRadius: 8,
  },
  categoryTitle: {
    marginBottom: 8,
    color: MD3Colors.primary40,
  },
  interventionRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  interventionCard: {
    width: 150,
    marginRight: 8,
  },
  completedCard: {
    backgroundColor: MD3Colors.primary95,
  },
  interventionName: {
    textAlign: 'center',
    marginVertical: 4,
  },
  priorityChip: {
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    color: MD3Colors.primary40,
  },
  contentText: {
    fontSize: 14,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    marginLeft: 8,
    marginBottom: 4,
  },
  progressBar: {
    marginVertical: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  stepText: {
    fontSize: 14,
    lineHeight: 20,
  },
  completeButton: {
    margin: 16,
  },
});

export default InterventionSelector;

