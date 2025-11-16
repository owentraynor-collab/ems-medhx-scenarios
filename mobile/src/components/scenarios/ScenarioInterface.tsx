import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import {
  ScenarioService,
  ScenarioState,
  VitalSigns,
  PatientState,
  AIResponse,
  RedFlag,
} from '../../services/ScenarioService';

interface ScenarioInterfaceProps {
  scenarioId: string;
  userId: string;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export const ScenarioInterface: React.FC<ScenarioInterfaceProps> = ({
  scenarioId,
  userId,
  onComplete,
  onExit,
}) => {
  const [state, setState] = useState<ScenarioState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [processing, setProcessing] = useState(false);
  const [conversation, setConversation] = useState<
    Array<{ type: 'question' | 'answer'; content: string }>
  >([]);
  const [showVitals, setShowVitals] = useState(true);
  const [showRedFlags, setShowRedFlags] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<string | null>(
    null
  );

  const scrollViewRef = useRef<ScrollView>(null);
  const theme = useTheme();
  const scenarioService = ScenarioService.getInstance();
  const vitalsOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    startScenario();
    return () => {
      scenarioService.cleanup();
    };
  }, []);

  const startScenario = async () => {
    try {
      setLoading(true);
      setError(null);
      const initialState = await scenarioService.startScenario(userId, scenarioId);
      setState(initialState);
      
      // Add initial context to conversation
      setConversation([
        {
          type: 'answer',
          content: `Dispatch: ${initialState.context.location}. ${
            initialState.context.timeOfDay
          }. Available units: ${initialState.context.resources.available.join(
            ', '
          )}.`,
        },
      ]);
    } catch (err) {
      setError('Failed to start scenario');
      console.error('Scenario start error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSubmit = async () => {
    if (!question.trim() || processing || !state) return;

    try {
      setProcessing(true);
      
      // Add question to conversation
      setConversation(prev => [
        ...prev,
        { type: 'question', content: question },
      ]);
      
      // Get AI response
      const response = await scenarioService.askQuestion(question);
      
      // Add response to conversation
      setConversation(prev => [
        ...prev,
        { type: 'answer', content: response.content },
      ]);

      // Clear question
      setQuestion('');

      // Update state if changed
      const updatedState = scenarioService.getCurrentState();
      if (updatedState) {
        setState(updatedState);
        
        // Animate vitals change if they were updated
        if (response.vitalSigns) {
          animateVitalsUpdate();
        }
      }

      // Scroll to bottom
      scrollViewRef.current?.scrollToEnd();
    } catch (err) {
      Alert.alert('Error', 'Failed to process question');
    } finally {
      setProcessing(false);
    }
  };

  const animateVitalsUpdate = () => {
    Animated.sequence([
      Animated.timing(vitalsOpacity, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(vitalsOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleIntervention = async (type: string) => {
    if (!state || processing) return;

    try {
      setProcessing(true);
      
      const intervention = await scenarioService.performIntervention({
        id: Date.now().toString(),
        type: 'treatment',
        name: type,
      });

      // Add intervention to conversation
      setConversation(prev => [
        ...prev,
        { type: 'answer', content: `Intervention: ${intervention.outcome}` },
      ]);

      // Update state
      const updatedState = scenarioService.getCurrentState();
      if (updatedState) {
        setState(updatedState);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to perform intervention');
    } finally {
      setProcessing(false);
      setSelectedIntervention(null);
    }
  };

  const handleRedFlagIdentification = async (redFlag: RedFlag) => {
    if (!state || processing) return;

    try {
      await scenarioService.identifyRedFlag(redFlag.id);
      
      // Update state
      const updatedState = scenarioService.getCurrentState();
      if (updatedState) {
        setState(updatedState);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to identify red flag');
    }
  };

  const handleComplete = async () => {
    if (!state || processing) return;

    try {
      setProcessing(true);
      const result = await scenarioService.completeScenario();
      onComplete(result.score);
    } catch (err) {
      Alert.alert('Error', 'Failed to complete scenario');
    } finally {
      setProcessing(false);
    }
  };

  const confirmExit = () => {
    Alert.alert(
      'Exit Scenario',
      'Are you sure you want to exit? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: onExit },
      ]
    );
  };

  const renderVitalSigns = (vitals: VitalSigns) => (
    <Animated.View
      style={[styles.vitalsContainer, { opacity: vitalsOpacity }]}
    >
      <View style={styles.vitalRow}>
        <View style={styles.vital}>
          <Text style={[styles.vitalLabel, { color: theme.colors.text }]}>
            HR
          </Text>
          <Text style={[styles.vitalValue, { color: theme.colors.text }]}>
            {vitals.heartRate}
          </Text>
        </View>
        <View style={styles.vital}>
          <Text style={[styles.vitalLabel, { color: theme.colors.text }]}>
            BP
          </Text>
          <Text style={[styles.vitalValue, { color: theme.colors.text }]}>
            {vitals.bloodPressure}
          </Text>
        </View>
        <View style={styles.vital}>
          <Text style={[styles.vitalLabel, { color: theme.colors.text }]}>
            RR
          </Text>
          <Text style={[styles.vitalValue, { color: theme.colors.text }]}>
            {vitals.respiratoryRate}
          </Text>
        </View>
        <View style={styles.vital}>
          <Text style={[styles.vitalLabel, { color: theme.colors.text }]}>
            SpO2
          </Text>
          <Text style={[styles.vitalValue, { color: theme.colors.text }]}>
            {vitals.oxygenSaturation}%
          </Text>
        </View>
      </View>
      {vitals.gcs && (
        <View style={styles.gcsContainer}>
          <Text style={[styles.gcsLabel, { color: theme.colors.text }]}>
            GCS: {vitals.gcs.total} (E{vitals.gcs.eyes} V{vitals.gcs.verbal} M
            {vitals.gcs.motor})
          </Text>
        </View>
      )}
    </Animated.View>
  );

  const renderRedFlags = (redFlags: RedFlag[]) => (
    <View style={styles.redFlagsContainer}>
      {redFlags.map(flag => (
        <TouchableOpacity
          key={flag.id}
          style={[
            styles.redFlag,
            flag.identified && styles.identifiedRedFlag,
            { backgroundColor: theme.colors.surface },
          ]}
          onPress={() => handleRedFlagIdentification(flag)}
          disabled={flag.identified}
        >
          <Icon
            name={flag.identified ? 'alert-circle' : 'alert-circle-outline'}
            size={24}
            color={
              flag.severity === 'critical'
                ? '#F44336'
                : flag.severity === 'high'
                ? '#FF9800'
                : '#4CAF50'
            }
          />
          <Text
            style={[
              styles.redFlagText,
              { color: theme.colors.text },
              flag.identified && styles.identifiedRedFlagText,
            ]}
          >
            {flag.description}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !state) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={startScenario}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={confirmExit} style={styles.exitButton}>
          <Icon name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => setShowVitals(!showVitals)}
            style={styles.headerButton}
          >
            <Icon
              name={showVitals ? 'heart' : 'heart-outline'}
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowRedFlags(!showRedFlags)}
            style={styles.headerButton}
          >
            <Icon
              name={showRedFlags ? 'alert' : 'alert-outline'}
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Vital Signs */}
      {showVitals && renderVitalSigns(state.vitalSigns)}

      {/* Red Flags */}
      {showRedFlags && renderRedFlags(state.redFlags)}

      {/* Conversation */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.conversation}
        contentContainerStyle={styles.conversationContent}
      >
        {conversation.map((message, index) => (
          <View
            key={index}
            style={[
              styles.message,
              message.type === 'question'
                ? styles.questionMessage
                : styles.answerMessage,
            ]}
          >
            <Text style={[styles.messageText, { color: theme.colors.text }]}>
              {message.content}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.surface,
            },
          ]}
          value={question}
          onChangeText={setQuestion}
          placeholder="Ask a question..."
          placeholderTextColor={theme.colors.text + '80'}
          multiline
          disabled={processing}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: theme.colors.primary },
            processing && styles.disabledButton,
          ]}
          onPress={handleQuestionSubmit}
          disabled={processing || !question.trim()}
        >
          <Icon
            name={processing ? 'loading' : 'send'}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => setSelectedIntervention('assessment')}
        >
          <Icon name="stethoscope" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Assess</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
          onPress={() => setSelectedIntervention('treatment')}
        >
          <Icon name="medical-bag" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Treat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
          onPress={() => setSelectedIntervention('medication')}
        >
          <Icon name="pill" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Medicate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#F44336' }]}
          onPress={handleComplete}
        >
          <Icon name="flag-checkered" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Complete</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  exitButton: {
    padding: 8,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 16,
  },
  vitalsContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  vitalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vital: {
    alignItems: 'center',
  },
  vitalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  vitalValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  gcsContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  gcsLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  redFlagsContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  redFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  identifiedRedFlag: {
    opacity: 0.6,
  },
  redFlagText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
  },
  identifiedRedFlagText: {
    textDecorationLine: 'line-through',
  },
  conversation: {
    flex: 1,
  },
  conversationContent: {
    padding: 16,
  },
  message: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  questionMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2196F3',
  },
  answerMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  disabledButton: {
    opacity: 0.5,
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

export default ScenarioInterface;

