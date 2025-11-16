import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Card,
  Title,
  Text,
  List,
  Surface,
  Button,
  Divider,
  MD3Colors,
  IconButton,
} from 'react-native-paper';

interface LearningPoint {
  topic: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  resources?: {
    type: 'video' | 'article' | 'protocol' | 'quiz';
    title: string;
    link: string;
  }[];
}

interface ImprovementArea {
  area: string;
  currentScore: number;
  targetScore: number;
  recommendations: string[];
}

interface LearningRecommendationsProps {
  learningPoints: LearningPoint[];
  improvementAreas: ImprovementArea[];
  onResourceSelect: (resource: any) => void;
}

const LearningRecommendations: React.FC<LearningRecommendationsProps> = ({
  learningPoints,
  improvementAreas,
  onResourceSelect,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return MD3Colors.error40;
      case 'medium': return MD3Colors.warning40;
      case 'low': return MD3Colors.tertiary40;
      default: return MD3Colors.neutral40;
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return 'video';
      case 'article': return 'file-document';
      case 'protocol': return 'clipboard-list';
      case 'quiz': return 'help-circle';
      default: return 'link';
    }
  };

  const renderLearningPoints = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Key Learning Points</Title>
        <ScrollView>
          {learningPoints.map((point, index) => (
            <Surface key={index} style={styles.pointContainer}>
              <View style={styles.pointHeader}>
                <Text style={styles.pointTopic}>{point.topic}</Text>
                <Surface
                  style={[
                    styles.priorityIndicator,
                    { backgroundColor: getPriorityColor(point.priority) },
                  ]}
                >
                  <Text style={styles.priorityText}>{point.priority}</Text>
                </Surface>
              </View>
              <Text style={styles.pointDescription}>{point.description}</Text>
              
              {point.resources && (
                <View style={styles.resourcesContainer}>
                  <Text style={styles.resourcesTitle}>Recommended Resources:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {point.resources.map((resource, rIndex) => (
                      <Button
                        key={rIndex}
                        mode="outlined"
                        icon={getResourceIcon(resource.type)}
                        onPress={() => onResourceSelect(resource)}
                        style={styles.resourceButton}
                      >
                        {resource.title}
                      </Button>
                    ))}
                  </ScrollView>
                </View>
              )}
            </Surface>
          ))}
        </ScrollView>
      </Card.Content>
    </Card>
  );

  const renderImprovementAreas = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Areas for Improvement</Title>
        {improvementAreas.map((area, index) => (
          <View key={index} style={styles.improvementArea}>
            <View style={styles.areaHeader}>
              <Text style={styles.areaTitle}>{area.area}</Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.currentScore}>{area.currentScore}%</Text>
                <IconButton
                  icon="arrow-right"
                  size={20}
                  iconColor={MD3Colors.neutral60}
                />
                <Text style={styles.targetScore}>{area.targetScore}%</Text>
              </View>
            </View>
            <View style={styles.recommendationsContainer}>
              {area.recommendations.map((rec, rIndex) => (
                <Text key={rIndex} style={styles.recommendation}>
                  • {rec}
                </Text>
              ))}
            </View>
            <Divider style={styles.divider} />
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      {renderLearningPoints()}
      {renderImprovementAreas()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  pointContainer: {
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 1,
  },
  pointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointTopic: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  priorityIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  pointDescription: {
    fontSize: 14,
    color: MD3Colors.neutral80,
    marginBottom: 8,
  },
  resourcesContainer: {
    marginTop: 8,
  },
  resourcesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resourceButton: {
    marginRight: 8,
  },
  improvementArea: {
    marginVertical: 8,
  },
  areaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  areaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentScore: {
    fontSize: 16,
    color: MD3Colors.error40,
  },
  targetScore: {
    fontSize: 16,
    color: MD3Colors.success40,
  },
  recommendationsContainer: {
    marginTop: 8,
    paddingLeft: 8,
  },
  recommendation: {
    fontSize: 14,
    color: MD3Colors.neutral80,
    marginVertical: 2,
  },
  divider: {
    marginVertical: 8,
  },
});

export default LearningRecommendations;

