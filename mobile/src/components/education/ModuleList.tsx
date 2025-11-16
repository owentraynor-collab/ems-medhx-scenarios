import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import {
  EducationalContentService,
  Module,
  ModuleProgress,
} from '../../services/EducationalContentService';

interface ModuleListProps {
  userId: string;
  category?: string;
  onModuleSelect: (moduleId: string) => void;
}

interface ModuleItemProps {
  module: Module;
  progress: ModuleProgress | null;
  onSelect: () => void;
}

const ModuleItem: React.FC<ModuleItemProps> = ({ module, progress, onSelect }) => {
  const theme = useTheme();
  const [progressAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (progress) {
      const completedPercentage =
        (progress.completedSections.length / module.sections.length) * 100;
      Animated.timing(progressAnim, {
        toValue: completedPercentage,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [progress?.completedSections.length]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic':
        return '#4CAF50';
      case 'intermediate':
        return '#FFC107';
      case 'advanced':
        return '#F44336';
      default:
        return theme.colors.text;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <TouchableOpacity
      style={[styles.moduleItem, { backgroundColor: theme.colors.surface }]}
      onPress={onSelect}
    >
      <View style={styles.moduleHeader}>
        <View style={styles.titleContainer}>
          <Text style={[styles.moduleTitle, { color: theme.colors.text }]}>
            {module.title}
          </Text>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(module.difficulty) + '20' },
            ]}
          >
            <Text
              style={[
                styles.difficultyText,
                { color: getDifficultyColor(module.difficulty) },
              ]}
            >
              {module.difficulty}
            </Text>
          </View>
        </View>
        <Text
          style={[styles.moduleDescription, { color: theme.colors.text }]}
          numberOfLines={2}
        >
          {module.description}
        </Text>
      </View>

      <View style={styles.moduleFooter}>
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Icon name="clock-outline" size={16} color={theme.colors.text} />
            <Text style={[styles.statText, { color: theme.colors.text }]}>
              {formatDuration(module.estimatedDuration)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Icon name="book-outline" size={16} color={theme.colors.text} />
            <Text style={[styles.statText, { color: theme.colors.text }]}>
              {module.sections.length} sections
            </Text>
          </View>
          {progress?.timeSpent ? (
            <View style={styles.stat}>
              <Icon name="timer-outline" size={16} color={theme.colors.text} />
              <Text style={[styles.statText, { color: theme.colors.text }]}>
                {formatDuration(Math.floor(progress.timeSpent / 60))}
              </Text>
            </View>
          ) : null}
        </View>

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
      </View>
    </TouchableOpacity>
  );
};

export const ModuleList: React.FC<ModuleListProps> = ({
  userId,
  category,
  onModuleSelect,
}) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<{ [key: string]: ModuleProgress }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);

  const theme = useTheme();
  const contentService = EducationalContentService.getInstance();

  useEffect(() => {
    loadModules();
  }, [category]);

  useEffect(() => {
    filterModules();
  }, [searchQuery, modules]);

  const loadModules = async () => {
    try {
      setLoading(true);
      setError(null);

      const moduleList = await contentService.getModules(category);
      setModules(moduleList);

      // Load progress for all modules
      const progressData: { [key: string]: ModuleProgress } = {};
      await Promise.all(
        moduleList.map(async module => {
          const moduleProgress = await contentService.getModuleProgress(
            userId,
            module.id
          );
          progressData[module.id] = moduleProgress;
        })
      );
      setProgress(progressData);
    } catch (err) {
      setError('Failed to load modules');
      console.error('Module loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterModules = () => {
    if (!searchQuery.trim()) {
      setFilteredModules(modules);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = modules.filter(module => {
      const searchText = `
        ${module.title}
        ${module.description}
        ${module.tags.join(' ')}
      `.toLowerCase();

      return searchText.includes(query);
    });

    setFilteredModules(filtered);
  };

  if (loading) {
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
          onPress={loadModules}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={24} color={theme.colors.text} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search modules..."
          placeholderTextColor={theme.colors.text + '80'}
        />
        {searchQuery ? (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Icon name="close" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Module List */}
      <FlatList
        data={filteredModules}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ModuleItem
            module={item}
            progress={progress[item.id]}
            onSelect={() => onModuleSelect(item.id)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon
              name="book-open-variant"
              size={48}
              color={theme.colors.text + '40'}
            />
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              {searchQuery
                ? 'No modules match your search'
                : 'No modules available'}
            </Text>
          </View>
        }
      />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    padding: 16,
  },
  moduleItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  moduleHeader: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  moduleTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moduleDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  moduleFooter: {
    marginTop: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 14,
    marginLeft: 4,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
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

export default ModuleList;

