import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { QuizService, QuizQuestion, QuizFeedback } from '../../services/QuizService';
import { useTheme } from '../../hooks/useTheme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface QuizInterfaceProps {
  moduleId: string;
  userId: string;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export const QuizInterface: React.FC<QuizInterfaceProps> = ({
  moduleId,
  userId,
  onComplete,
  onExit,
}) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<QuizFeedback | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [progress] = useState(new Animated.Value(0));
  const [error, setError] = useState<string | null>(null);

  const theme = useTheme();
  const quizService = QuizService.getInstance();

  useEffect(() => {
    startQuiz();
  }, []);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: (currentIndex + 1) / questions.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentIndex, questions.length]);

  const startQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      const attempt = await quizService.startQuiz(moduleId, userId);
      const moduleQuestions = await quizService.getModuleQuestions(moduleId);
      setQuestions(
        attempt.questions.map(qId => 
          moduleQuestions.find(q => q.id === qId)!
        )
      );
    } catch (err) {
      setError('Failed to start quiz');
      console.error('Quiz start error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = async (answerIndex: number) => {
    if (selectedAnswer !== null || loading) return;

    try {
      setLoading(true);
      setSelectedAnswer(answerIndex);

      const feedback = await quizService.submitAnswer(
        questions[currentIndex].id,
        answerIndex
      );
      
      setFeedback(feedback);
      setShowExplanation(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex === questions.length - 1) {
      handleComplete();
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setFeedback(null);
      setShowExplanation(false);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      const result = await quizService.completeQuiz();
      onComplete(result.score);
    } catch (err) {
      Alert.alert('Error', 'Failed to complete quiz');
    }
  };

  const confirmExit = () => {
    Alert.alert(
      'Exit Quiz',
      'Are you sure you want to exit? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: onExit },
      ]
    );
  };

  if (loading && questions.length === 0) {
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
          onPress={startQuiz}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];

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
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.text }]}>
          {currentIndex + 1} / {questions.length}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Question */}
        <Text style={[styles.question, { color: theme.colors.text }]}>
          {currentQuestion.question}
        </Text>

        {/* Options */}
        <View style={styles.options}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = feedback?.correct && isSelected;
            const isWrong = feedback?.correct === false && isSelected;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.option,
                  isSelected && styles.selectedOption,
                  isCorrect && styles.correctOption,
                  isWrong && styles.wrongOption,
                  { backgroundColor: theme.colors.surface },
                ]}
                onPress={() => handleAnswerSelect(index)}
                disabled={selectedAnswer !== null}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.selectedOptionText,
                    { color: theme.colors.text },
                  ]}
                >
                  {option}
                </Text>
                {isCorrect && (
                  <Icon name="check-circle" size={24} color="#4CAF50" />
                )}
                {isWrong && (
                  <Icon name="close-circle" size={24} color="#F44336" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Explanation */}
        {showExplanation && feedback && (
          <View style={styles.explanation}>
            <Text style={[styles.explanationTitle, { color: theme.colors.text }]}>
              Explanation
            </Text>
            <Text style={[styles.explanationText, { color: theme.colors.text }]}>
              {feedback.explanation}
            </Text>
            {feedback.relatedTopics && feedback.relatedTopics.length > 0 && (
              <View style={styles.relatedTopics}>
                <Text style={[styles.relatedTitle, { color: theme.colors.text }]}>
                  Related Topics:
                </Text>
                {feedback.relatedTopics.map((topic, index) => (
                  <Text
                    key={index}
                    style={[styles.topicText, { color: theme.colors.primary }]}
                  >
                    • {topic}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {selectedAnswer !== null && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleNext}
          >
            <Text style={styles.buttonText}>
              {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
            </Text>
          </TouchableOpacity>
        )}
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
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  question: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 24,
  },
  options: {
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedOption: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  correctOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  wrongOption: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  selectedOptionText: {
    fontWeight: '500',
  },
  explanation: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginTop: 24,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  relatedTopics: {
    marginTop: 16,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  topicText: {
    fontSize: 14,
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
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
  error: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default QuizInterface;

