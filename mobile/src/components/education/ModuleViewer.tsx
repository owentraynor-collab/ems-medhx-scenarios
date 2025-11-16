import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Animated,
  useWindowDimensions,
} from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import {
  EducationalContentService,
  Module,
  ContentSection,
  ModuleProgress,
} from '../../services/EducationalContentService';

interface ModuleViewerProps {
  moduleId: string;
  userId: string;
  onComplete?: () => void;
  onExit?: () => void;
}

export const ModuleViewer: React.FC<ModuleViewerProps> = ({
  moduleId,
  userId,
  onComplete,
  onExit,
}) => {
  const [module, setModule] = useState<Module | null>(null);
  const [progress, setProgress] = useState<ModuleProgress | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [progressValue] = useState(new Animated.Value(0));

  const scrollViewRef = useRef<ScrollView>(null);
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const contentService = EducationalContentService.getInstance();

  // Timer for tracking time spent
  const timeTracker = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    loadModule();
    startTimeTracking();

    return () => {
      if (timeTracker.current) {
        clearInterval(timeTracker.current);
      }
      updateTimeSpent();
    };
  }, []);

  useEffect(() => {
    if (module && progress) {
      const completedPercentage =
        (progress.completedSections.length / module.sections.length) * 100;
      Animated.timing(progressValue, {
        toValue: completedPercentage,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [progress?.completedSections.length]);

  const startTimeTracking = () => {
    timeTracker.current = setInterval(updateTimeSpent, 60000); // Update every minute
  };

  const updateTimeSpent = async () => {
    if (!module) return;

    const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
    await contentService.updateTimeSpent(userId, moduleId, timeSpent);
    startTime.current = Date.now();
  };

  const loadModule = async () => {
    try {
      setLoading(true);
      setError(null);

      const [moduleData, progressData] = await Promise.all([
        contentService.getModule(moduleId),
        contentService.getModuleProgress(userId, moduleId),
      ]);

      if (!moduleData) {
        throw new Error('Module not found');
      }

      setModule(moduleData);
      setProgress(progressData);

      // Set initial section based on progress
      if (progressData.lastAccessedSection) {
        const sectionIndex = moduleData.sections.findIndex(
          s => s.id === progressData.lastAccessedSection
        );
        if (sectionIndex !== -1) {
          setCurrentSectionIndex(sectionIndex);
        }
      }
    } catch (err) {
      setError('Failed to load module content');
      console.error('Module loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionComplete = async (sectionId: string) => {
    if (!module || !progress) return;

    try {
      const updatedProgress = await contentService.completeSection(
        userId,
        moduleId,
        sectionId
      );
      setProgress(updatedProgress);

      if (updatedProgress.completed && onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Failed to update section progress:', err);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim() || !progress) return;

    try {
      const updatedProgress = await contentService.addNote(
        userId,
        moduleId,
        note.trim()
      );
      setProgress(updatedProgress);
      setNote('');
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const renderSection = (section: ContentSection) => {
    const isCompleted = progress?.completedSections.includes(section.id);

    switch (section.type) {
      case 'text':
        return (
          <View style={styles.textSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionContent, { color: theme.colors.text }]}>
              {section.content}
            </Text>
          </View>
        );

      case 'image':
        return (
          <View style={styles.imageSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {section.title}
            </Text>
            <Image
              source={{ uri: section.mediaUrl }}
              style={styles.image}
              resizeMode="contain"
            />
            {section.content && (
              <Text style={[styles.caption, { color: theme.colors.text }]}>
                {section.content}
              </Text>
            )}
          </View>
        );

      case 'video':
        return (
          <View style={styles.videoSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {section.title}
            </Text>
            <Video
              source={{ uri: section.mediaUrl }}
              style={styles.video}
              controls
              resizeMode="contain"
            />
            {section.content && (
              <Text style={[styles.caption, { color: theme.colors.text }]}>
                {section.content}
              </Text>
            )}
          </View>
        );

      case 'interactive':
        return (
          <View style={styles.interactiveSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {section.title}
            </Text>
            {/* Render interactive content based on interactiveData */}
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !module || !progress) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={loadModule}
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
        <TouchableOpacity onPress={onExit} style={styles.exitButton}>
          <Icon name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: theme.colors.primary,
                width: progressValue.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <TouchableOpacity
          onPress={() => setShowNotes(!showNotes)}
          style={styles.notesButton}
        >
          <Icon
            name={showNotes ? 'note' : 'note-outline'}
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Module Title and Description */}
        <View style={styles.moduleHeader}>
          <Text style={[styles.moduleTitle, { color: theme.colors.text }]}>
            {module.title}
          </Text>
          <Text style={[styles.moduleDescription, { color: theme.colors.text }]}>
            {module.description}
          </Text>
        </View>

        {/* Current Section */}
        {renderSection(module.sections[currentSectionIndex])}

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentSectionIndex === 0 && styles.disabledButton,
            ]}
            onPress={() => setCurrentSectionIndex(prev => prev - 1)}
            disabled={currentSectionIndex === 0}
          >
            <Icon name="chevron-left" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.completeButton, { backgroundColor: theme.colors.primary }]}
            onPress={() =>
              handleSectionComplete(module.sections[currentSectionIndex].id)
            }
          >
            <Icon name="check" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>Complete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              currentSectionIndex === module.sections.length - 1 &&
                styles.disabledButton,
            ]}
            onPress={() => setCurrentSectionIndex(prev => prev + 1)}
            disabled={currentSectionIndex === module.sections.length - 1}
          >
            <Text style={styles.buttonText}>Next</Text>
            <Icon name="chevron-right" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Notes Panel */}
      {showNotes && (
        <View style={styles.notesPanel}>
          <Text style={[styles.notesTitle, { color: theme.colors.text }]}>
            Notes
          </Text>
          <ScrollView style={styles.notesList}>
            {progress.notes.map((note, index) => (
              <Text
                key={index}
                style={[styles.noteItem, { color: theme.colors.text }]}
              >
                • {note}
              </Text>
            ))}
          </ScrollView>
          <View style={styles.addNoteContainer}>
            <TextInput
              style={[
                styles.noteInput,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note..."
              placeholderTextColor={theme.colors.text + '80'}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.addNoteButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleAddNote}
            >
              <Icon name="plus" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
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
  notesButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  moduleHeader: {
    marginBottom: 24,
  },
  moduleTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  moduleDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  textSection: {
    marginBottom: 24,
  },
  imageSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  videoSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  interactiveSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 16,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 8,
  },
  video: {
    width: '100%',
    height: 200,
    marginBottom: 8,
  },
  caption: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 8,
  },
  notesPanel: {
    position: 'absolute',
    right: 0,
    top: 64,
    bottom: 0,
    width: 300,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
    padding: 16,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  notesList: {
    flex: 1,
    marginBottom: 16,
  },
  noteItem: {
    fontSize: 14,
    marginBottom: 8,
    paddingLeft: 8,
  },
  addNoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  noteInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  addNoteButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default ModuleViewer;

