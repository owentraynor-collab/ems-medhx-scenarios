import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import {
  AssessmentService,
  AssessmentState,
  AssessmentCriteria,
  AssessmentFinding,
  AssessmentAction,
} from '../../services/AssessmentService';

interface AssessmentInterfaceProps {
  scenarioId: string;
  userId: string;
  onComplete: (evaluation: any) => void;
  onExit: () => void;
}

export const AssessmentInterface: React.FC<AssessmentInterfaceProps> = ({
  scenarioId,
  userId,
  onComplete,
  onExit,
}) => {
  const [state, setState] = useState<AssessmentState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCriteria, setSelectedCriteria] = useState<AssessmentCriteria | null>(
    null
  );
  const [selectedFindings, setSelectedFindings] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const theme = useTheme();
  const assessmentService = AssessmentService.getInstance();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    startAssessment();
    return () => {
      assessmentService.cleanup();
    };
  }, []);

  useEffect(() => {
    if (state) {
      const progress =
        (state.completedCriteria.length /
          assessmentService.getCurrentCriteria().length) *
        100;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [state?.completedCriteria.length]);

  const startAssessment = async () => {
    try {
      setLoading(true);
      setError(null);
      const initialState = await assessmentService.startAssessment(
        userId,
        scenarioId
      );
      setState(initialState);
    } catch (err) {
      setError('Failed to start assessment');
      console.error('Assessment start error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCriteriaSelect = (criteria: AssessmentCriteria) => {
    setSelectedCriteria(criteria);
    setSelectedFindings([]);
    setNotes('');
  };

  const handleFindingToggle = (findingId: string) => {
    setSelectedFindings(prev =>
      prev.includes(findingId)
        ? prev.filter(id => id !== findingId)
        : [...prev, findingId]
    );
  };

  const handleAssessmentSubmit = async () => {
    if (!selectedCriteria || processing || !state) return;

    try {
      setProcessing(true);

      const action = await assessmentService.performAssessment(
        selectedCriteria.id,
        selectedFindings,
        notes
      );

      // Update state
      const updatedState = assessmentService.getCurrentState();
      if (updatedState) {
        setState(updatedState);
      }

      // Clear selection
      setSelectedCriteria(null);
      setSelectedFindings([]);
      setNotes('');

      // Scroll to bottom
      scrollViewRef.current?.scrollToEnd();
    } catch (err) {
      Alert.alert('Error', 'Failed to submit assessment');
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = async () => {
    if (!state || processing) return;

    try {
      setProcessing(true);
      const evaluation = await assessmentService.completeAssessment();
      onComplete(evaluation);
    } catch (err) {
      Alert.alert('Error', 'Failed to complete assessment');
    } finally {
      setProcessing(false);
    }
  };

  const confirmExit = () => {
    Alert.alert(
      'Exit Assessment',
      'Are you sure you want to exit? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: onExit },
      ]
    );
  };

  const renderCriteria = (criteria: AssessmentCriteria) => {
    const isCompleted = state?.completedCriteria.includes(criteria.id);
    const isSelected = selectedCriteria?.id === criteria.id;
    const isAvailable = !isCompleted && (!criteria.dependencies?.some(
      depId => !state?.completedCriteria.includes(depId)
    ));

    return (
      <TouchableOpacity
        key={criteria.id}
        style={[
          styles.criteriaItem,
          isCompleted && styles.completedCriteria,
          isSelected && styles.selectedCriteria,
          !isAvailable && styles.unavailableCriteria,
          { backgroundColor: theme.colors.surface },
        ]}
        onPress={() => isAvailable && handleCriteriaSelect(criteria)}
        disabled={!isAvailable || isCompleted}
      >
        <View style={styles.criteriaHeader}>
          <Text
            style={[
              styles.criteriaTitle,
              { color: theme.colors.text },
              isCompleted && styles.completedText,
            ]}
          >
            {criteria.description}
          </Text>
          {criteria.required && (
            <View
              style={[
                styles.requiredBadge,
                { backgroundColor: theme.colors.error + '20' },
              ]}
            >
              <Text
                style={[styles.requiredText, { color: theme.colors.error }]}
              >
                Required
              </Text>
            </View>
          )}
        </View>
        {isCompleted && (
          <Icon name="check-circle" size={24} color="#4CAF50" />
        )}
      </TouchableOpacity>
    );
  };

  const renderFindings = (findings: AssessmentFinding[]) => {
    return findings.map(finding => (
      <TouchableOpacity
        key={finding.id}
        style={[
          styles.findingItem,
          selectedFindings.includes(finding.id) && styles.selectedFinding,
          { backgroundColor: theme.colors.surface },
        ]}
        onPress={() => handleFindingToggle(finding.id)}
      >
        <View style={styles.findingContent}>
          <Text style={[styles.findingText, { color: theme.colors.text }]}>
            {finding.description}
          </Text>
          {finding.requiresIntervention && (
            <View
              style={[
                styles.interventionBadge,
                { backgroundColor: theme.colors.warning + '20' },
              ]}
            >
              <Text
                style={[
                  styles.interventionText,
                  { color: theme.colors.warning },
                ]}
              >
                Requires Intervention
              </Text>
            </View>
          )}
        </View>
        <Icon
          name={
            selectedFindings.includes(finding.id)
              ? 'checkbox-marked'
              : 'checkbox-blank-outline'
          }
          size={24}
          color={theme.colors.primary}
        />
      </TouchableOpacity>
    ));
  };

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
          onPress={startAssessment}
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
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: theme.colors.primary,
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={[styles.phaseText, { color: theme.colors.text }]}>
          {state.currentPhase.charAt(0).toUpperCase() +
            state.currentPhase.slice(1)}{' '}
          Assessment
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Available Criteria */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Assessment Criteria
          </Text>
          {assessmentService.getCurrentCriteria().map(renderCriteria)}
        </View>

        {/* Selected Criteria Details */}
        {selectedCriteria && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Findings
            </Text>
            {renderFindings(
              assessmentService.getRelevantFindings(selectedCriteria.id)
            )}
            <TextInput
              style={[
                styles.notesInput,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes..."
              placeholderTextColor={theme.colors.text + '80'}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: theme.colors.primary },
                processing && styles.disabledButton,
              ]}
              onPress={handleAssessmentSubmit}
              disabled={processing}
            >
              <Text style={styles.buttonText}>Submit Assessment</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Complete Button */}
      {!selectedCriteria && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.completeButton,
              { backgroundColor: theme.colors.primary },
              processing && styles.disabledButton,
            ]}
            onPress={handleComplete}
            disabled={processing}
          >
            <Text style={styles.buttonText}>Complete Assessment</Text>
          </TouchableOpacity>
        </View>
      )}
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
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  exitButton: {
    padding: 8,
  },
  progressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  phaseText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  criteriaHeader: {
    flex: 1,
    marginRight: 8,
  },
  criteriaTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  completedCriteria: {
    opacity: 0.6,
  },
  selectedCriteria: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  unavailableCriteria: {
    opacity: 0.4,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  requiredBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  requiredText: {
    fontSize: 12,
    fontWeight: '500',
  },
  findingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  findingContent: {
    flex: 1,
    marginRight: 8,
  },
  findingText: {
    fontSize: 16,
  },
  selectedFinding: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  interventionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  interventionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  notesInput: {
    minHeight: 100,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  completeButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
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

export default AssessmentInterface;

