import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PieChart } from 'react-native-chart-kit';

interface QuizResultsProps {
  score: number;
  feedback: Array<{
    questionId: string;
    correct: boolean;
    explanation: string;
    relatedTopics?: string[];
    recommendedResources?: string[];
  }>;
  onRetry: () => void;
  onContinue: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  score,
  feedback,
  onRetry,
  onContinue,
}) => {
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;

  const correctAnswers = feedback.filter(f => f.correct).length;
  const totalQuestions = feedback.length;
  const incorrectAnswers = totalQuestions - correctAnswers;

  const chartData = [
    {
      name: 'Correct',
      population: correctAnswers,
      color: '#4CAF50',
      legendFontColor: theme.colors.text,
    },
    {
      name: 'Incorrect',
      population: incorrectAnswers,
      color: '#F44336',
      legendFontColor: theme.colors.text,
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4CAF50';
    if (score >= 70) return '#FFC107';
    return '#F44336';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Excellent work!';
    if (score >= 70) return 'Good job!';
    return 'Keep practicing!';
  };

  const getRecommendations = () => {
    const incorrectFeedback = feedback.filter(f => !f.correct);
    const topics = incorrectFeedback
      .flatMap(f => f.relatedTopics || [])
      .reduce((acc: { [key: string]: number }, topic) => {
        acc[topic] = (acc[topic] || 0) + 1;
        return acc;
      }, {});

    return Object.entries(topics)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Score Overview */}
      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreTitle, { color: theme.colors.text }]}>
          Quiz Complete!
        </Text>
        <Text
          style={[
            styles.scoreValue,
            { color: getScoreColor(score) },
          ]}
        >
          {score}%
        </Text>
        <Text style={[styles.scoreMessage, { color: theme.colors.text }]}>
          {getScoreMessage(score)}
        </Text>
      </View>

      {/* Performance Chart */}
      <View style={styles.chartContainer}>
        <PieChart
          data={chartData}
          width={screenWidth - 32}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>

      {/* Performance Breakdown */}
      <View style={styles.breakdownContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Performance Breakdown
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="check-circle" size={24} color="#4CAF50" />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {correctAnswers}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>
              Correct
            </Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="close-circle" size={24} color="#F44336" />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {incorrectAnswers}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>
              Incorrect
            </Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="percent" size={24} color="#2196F3" />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {score}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text }]}>
              Score
            </Text>
          </View>
        </View>
      </View>

      {/* Areas for Improvement */}
      {incorrectAnswers > 0 && (
        <View style={styles.improvementContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Areas for Improvement
          </Text>
          {getRecommendations().map((topic, index) => (
            <Text
              key={index}
              style={[styles.improvementItem, { color: theme.colors.text }]}
            >
              • {topic}
            </Text>
          ))}
        </View>
      )}

      {/* Recommended Resources */}
      <View style={styles.resourcesContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Recommended Resources
        </Text>
        {feedback
          .filter(f => !f.correct && f.recommendedResources)
          .flatMap(f => f.recommendedResources || [])
          .slice(0, 3)
          .map((resource, index) => (
            <Text
              key={index}
              style={[styles.resourceItem, { color: theme.colors.primary }]}
            >
              → {resource}
            </Text>
          ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.button, styles.retryButton]}
          onPress={onRetry}
        >
          <Icon name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.continueButton]}
          onPress={onContinue}
        >
          <Icon name="arrow-right" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Continue</Text>
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
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 8,
  },
  scoreMessage: {
    fontSize: 18,
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  breakdownContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  improvementContainer: {
    marginBottom: 24,
  },
  improvementItem: {
    fontSize: 16,
    marginBottom: 8,
    paddingLeft: 8,
  },
  resourcesContainer: {
    marginBottom: 24,
  },
  resourceItem: {
    fontSize: 16,
    marginBottom: 8,
    paddingLeft: 8,
    textDecorationLine: 'underline',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
  },
  retryButton: {
    backgroundColor: '#F44336',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default QuizResults;

