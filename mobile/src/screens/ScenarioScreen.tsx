import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  List,
  Divider,
  Surface,
  Text,
  IconButton,
  MD3Colors,
  Portal,
  Dialog,
} from 'react-native-paper';

interface VitalSigns {
  bloodPressure: string;
  heartRate: number;
  respiratoryRate: string | number;
  spO2: number;
  temperature?: number;
}

interface ScenarioAction {
  id: string;
  text: string;
  type: 'assessment' | 'intervention' | 'documentation';
  isCorrect: boolean;
  feedback: string;
}

const ScenarioScreen = () => {
  const [currentPhase, setCurrentPhase] = useState<'dispatch' | 'scene' | 'assessment' | 'intervention'>('dispatch');
  const [showVitals, setShowVitals] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ScenarioAction | null>(null);

  const renderDispatchPhase = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Dispatch Information</Title>
        <Paragraph>Dispatch: EMS-1, respond to 123 Main St for a 68-year-old female with back pain.</Paragraph>
        <View style={styles.timeInfo}>
          <Text>Time of Call: 14:30</Text>
          <Text>Priority: Non-emergent response</Text>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => setCurrentPhase('scene')}>Respond to Scene</Button>
      </Card.Actions>
    </Card>
  );

  const renderScenePhase = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Scene Assessment</Title>
        <Paragraph>You arrive to find the patient sitting in a recliner, appearing uncomfortable.</Paragraph>
        <List.Section>
          <List.Item
            title="Scene Safety"
            left={props => <List.Icon {...props} icon="shield" />}
            onPress={() => {}}
          />
          <List.Item
            title="Initial Impression"
            left={props => <List.Icon {...props} icon="eye" />}
            onPress={() => {}}
          />
        </List.Section>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => setShowVitals(true)}>Check Vitals</Button>
        <Button onPress={() => setCurrentPhase('assessment')}>Begin Assessment</Button>
      </Card.Actions>
    </Card>
  );

  const renderVitalsDialog = () => (
    <Portal>
      <Dialog visible={showVitals} onDismiss={() => setShowVitals(false)}>
        <Dialog.Title>Vital Signs</Dialog.Title>
        <Dialog.Content>
          <Text>BP: 142/88</Text>
          <Text>HR: 88</Text>
          <Text>RR: 18</Text>
          <Text>SpO2: 98%</Text>
          <Text>Temp: 37.2°C</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowVitals(false)}>Close</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  const renderAssessmentPhase = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Patient Assessment</Title>
        <Surface style={styles.assessmentTools}>
          <IconButton
            icon="stethoscope"
            size={30}
            onPress={() => {}}
          />
          <IconButton
            icon="needle"
            size={30}
            onPress={() => {}}
          />
          <IconButton
            icon="heart-pulse"
            size={30}
            onPress={() => {}}
          />
          <IconButton
            icon="brain"
            size={30}
            onPress={() => {}}
          />
        </Surface>
        <Divider style={styles.divider} />
        <List.Section>
          <List.Subheader>Available Actions</List.Subheader>
          <List.Item
            title="Perform Neurological Exam"
            description="Check motor function, sensation, and reflexes"
            left={props => <List.Icon {...props} icon="brain" />}
            onPress={() => {}}
          />
          <List.Item
            title="Ask About Pain"
            description="Assess pain characteristics and progression"
            left={props => <List.Icon {...props} icon="message-question" />}
            onPress={() => {}}
          />
          <List.Item
            title="Review Medical History"
            description="Including cancer history and current medications"
            left={props => <List.Icon {...props} icon="file-document" />}
            onPress={() => {}}
          />
        </List.Section>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => setCurrentPhase('intervention')}>Proceed to Interventions</Button>
      </Card.Actions>
    </Card>
  );

  const renderInterventionPhase = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Interventions</Title>
        <List.Section>
          <List.Item
            title="Establish IV Access"
            description="For potential emergency interventions"
            left={props => <List.Icon {...props} icon="needle" />}
            onPress={() => {}}
          />
          <List.Item
            title="Apply Spinal Motion Restriction"
            description="If indicated by assessment findings"
            left={props => <List.Icon {...props} icon="human-cane" />}
            onPress={() => {}}
          />
          <List.Item
            title="Transport Decision"
            description="Choose appropriate destination facility"
            left={props => <List.Icon {...props} icon="ambulance" />}
            onPress={() => {}}
          />
        </List.Section>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {currentPhase === 'dispatch' && renderDispatchPhase()}
        {currentPhase === 'scene' && renderScenePhase()}
        {currentPhase === 'assessment' && renderAssessmentPhase()}
        {currentPhase === 'intervention' && renderInterventionPhase()}
        {renderVitalsDialog()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  timeInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  divider: {
    marginVertical: 8,
  },
  assessmentTools: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
    marginVertical: 8,
    elevation: 1,
    borderRadius: 8,
  },
});

export default ScenarioScreen;

