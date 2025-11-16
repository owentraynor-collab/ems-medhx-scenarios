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
  IconButton,
  Portal,
  Dialog,
  Divider,
  MD3Colors,
} from 'react-native-paper';

interface AssessmentArea {
  id: string;
  title: string;
  icon: string;
  questions: AssessmentQuestion[];
}

interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'open' | 'choice' | 'value';
  options?: string[];
  correctResponse?: string;
  patientResponse: string;
  significance: string;
}

interface PatientAssessmentProps {
  onComplete: (findings: any) => void;
}

const PatientAssessment: React.FC<PatientAssessmentProps> = ({ onComplete }) => {
  const [currentArea, setCurrentArea] = useState<AssessmentArea | null>(null);
  const [showResponse, setShowResponse] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<AssessmentQuestion | null>(null);
  const [findings, setFindings] = useState<Map<string, string>>(new Map());

  const assessmentAreas: AssessmentArea[] = [
    {
      id: 'neuro',
      title: 'Neurological Assessment',
      icon: 'brain',
      questions: [
        {
          id: 'motor',
          question: 'Can you move your legs for me?',
          type: 'open',
          patientResponse: 'I can barely move them, they feel weak',
          significance: 'Potential neurological deficit requiring immediate attention'
        },
        {
          id: 'sensation',
          question: 'Do you have any numbness or tingling?',
          type: 'open',
          patientResponse: 'Yes, both legs feel tingly',
          significance: 'Suggests nerve root involvement'
        }
      ]
    },
    {
      id: 'pain',
      title: 'Pain Assessment',
      icon: 'pain-scale',
      questions: [
        {
          id: 'location',
          question: 'Where exactly is your pain?',
          type: 'open',
          patientResponse: 'Lower back, radiating down both legs',
          significance: 'Pattern suggests nerve root involvement'
        },
        {
          id: 'severity',
          question: 'On a scale of 0-10, how severe is your pain?',
          type: 'value',
          patientResponse: '8/10',
          significance: 'Severe pain requiring intervention'
        }
      ]
    }
  ];

  const handleQuestionPress = (question: AssessmentQuestion) => {
    setSelectedQuestion(question);
    setShowResponse(true);
  };

  const renderResponseDialog = () => (
    <Portal>
      <Dialog visible={showResponse} onDismiss={() => setShowResponse(false)}>
        <Dialog.Title>Patient Response</Dialog.Title>
        <Dialog.Content>
          {selectedQuestion && (
            <>
              <Text style={styles.questionText}>{selectedQuestion.question}</Text>
              <Divider style={styles.divider} />
              <Text style={styles.responseLabel}>Patient Response:</Text>
              <Text style={styles.responseText}>{selectedQuestion.patientResponse}</Text>
              <Text style={styles.significanceLabel}>Clinical Significance:</Text>
              <Text style={styles.significanceText}>{selectedQuestion.significance}</Text>
            </>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowResponse(false)}>Close</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  const renderAssessmentArea = (area: AssessmentArea) => (
    <Card style={styles.areaCard}>
      <Card.Content>
        <View style={styles.areaHeader}>
          <IconButton icon={area.icon} size={24} />
          <Title>{area.title}</Title>
        </View>
        <List.Section>
          {area.questions.map(question => (
            <List.Item
              key={question.id}
              title={question.question}
              onPress={() => handleQuestionPress(question)}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
          ))}
        </List.Section>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        <Surface style={styles.toolbox}>
          {assessmentAreas.map(area => (
            <IconButton
              key={area.id}
              icon={area.icon}
              size={30}
              onPress={() => setCurrentArea(area)}
            />
          ))}
        </Surface>
        {currentArea && renderAssessmentArea(currentArea)}
        {!currentArea && (
          <Card style={styles.instructionCard}>
            <Card.Content>
              <Paragraph>Select an assessment area from the toolbox above</Paragraph>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
      <Button
        mode="contained"
        style={styles.completeButton}
        onPress={() => onComplete(Object.fromEntries(findings))}
      >
        Complete Assessment
      </Button>
      {renderResponseDialog()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
    margin: 8,
    borderRadius: 8,
    elevation: 2,
  },
  areaCard: {
    margin: 8,
  },
  areaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionCard: {
    margin: 8,
    backgroundColor: MD3Colors.primary99,
  },
  divider: {
    marginVertical: 8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  responseLabel: {
    marginTop: 8,
    fontSize: 14,
    color: MD3Colors.primary40,
  },
  responseText: {
    fontSize: 16,
    marginBottom: 8,
  },
  significanceLabel: {
    fontSize: 14,
    color: MD3Colors.primary40,
  },
  significanceText: {
    fontSize: 16,
  },
  completeButton: {
    margin: 16,
  },
});

export default PatientAssessment;

