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
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import {
  DocumentationService,
  DocumentationTemplate,
  DocumentationEntry,
  DocumentationSection,
  DocumentationField,
  DocumentationFeedback,
} from '../../services/DocumentationService';

interface DocumentationInterfaceProps {
  templateId: string;
  userId: string;
  scenarioId?: string;
  onComplete: (feedback: DocumentationFeedback) => void;
  onExit: () => void;
}

export const DocumentationInterface: React.FC<DocumentationInterfaceProps> = ({
  templateId,
  userId,
  scenarioId,
  onComplete,
  onExit,
}) => {
  const [template, setTemplate] = useState<DocumentationTemplate | null>(null);
  const [entry, setEntry] = useState<DocumentationEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const theme = useTheme();
  const docService = DocumentationService.getInstance();

  useEffect(() => {
    startDocumentation();
    return () => {
      docService.cleanup();
    };
  }, []);

  useEffect(() => {
    if (entry && template) {
      const progress =
        (entry.completedSections.length / template.sections.length) * 100;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [entry?.completedSections.length]);

  const startDocumentation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get template
      const docTemplate = docService.getTemplate(templateId);
      if (!docTemplate) {
        throw new Error('Template not found');
      }
      setTemplate(docTemplate);

      // Start new entry
      const newEntry = await docService.startDocumentation(
        userId,
        templateId,
        scenarioId
      );
      setEntry(newEntry);
    } catch (err) {
      setError('Failed to start documentation');
      console.error('Documentation start error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = async (field: DocumentationField, value: any) => {
    if (!entry) return;

    try {
      await docService.updateField(field.id, value);
      
      // Update local state
      const updatedEntry = docService.getCurrentEntry();
      if (updatedEntry) {
        setEntry(updatedEntry);
      }

      // Get suggestions if text field
      if (field.type === 'text' && typeof value === 'string') {
        const newSuggestions = docService.getAutoCompleteSuggestions(
          field.id,
          value
        );
        setSuggestions(newSuggestions);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update field');
    }
  };

  const handleSectionComplete = async (section: DocumentationSection) => {
    if (!entry || !template) return;

    try {
      // Validate required fields
      const missingRequired = section.fields
        .filter(
          field =>
            field.validation?.required &&
            !entry.values[field.id]
        )
        .map(field => field.label);

      if (missingRequired.length > 0) {
        Alert.alert(
          'Missing Required Fields',
          `Please complete the following fields:\n${missingRequired.join('\n')}`
        );
        return;
      }

      await docService.completeSection(section.id);
      
      // Update local state
      const updatedEntry = docService.getCurrentEntry();
      if (updatedEntry) {
        setEntry(updatedEntry);
      }

      // Move to next section if available
      if (currentSectionIndex < template.sections.length - 1) {
        setCurrentSectionIndex(prev => prev + 1);
        scrollViewRef.current?.scrollTo({ y: 0 });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to complete section');
    }
  };

  const handleSubmit = async () => {
    if (!entry || !template || processing) return;

    try {
      setProcessing(true);
      const feedback = await docService.submitForReview();
      onComplete(feedback);
    } catch (err) {
      Alert.alert('Error', 'Failed to submit documentation');
    } finally {
      setProcessing(false);
    }
  };

  const confirmExit = () => {
    Alert.alert(
      'Exit Documentation',
      'Are you sure you want to exit? Your progress will be saved as a draft.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: onExit },
      ]
    );
  };

  const renderField = (field: DocumentationField) => {
    const value = entry?.values[field.id];
    const isCompleted = value !== undefined && value !== '';
    const hasError =
      field.validation?.required && !isCompleted && entry?.status === 'completed';

    switch (field.type) {
      case 'text':
        return (
          <View style={styles.fieldContainer}>
            <Text
              style={[
                styles.fieldLabel,
                { color: theme.colors.text },
                hasError && styles.errorText,
              ]}
            >
              {field.label}
              {field.validation?.required && ' *'}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surface,
                },
                hasError && styles.errorInput,
              ]}
              value={value}
              onChangeText={text => handleFieldChange(field, text)}
              placeholder={field.placeholder}
              placeholderTextColor={theme.colors.text + '80'}
              multiline
            />
            {field.helpText && (
              <Text style={[styles.helpText, { color: theme.colors.text + '80' }]}>
                {field.helpText}
              </Text>
            )}
            {suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.suggestion,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    onPress={() => handleFieldChange(field, suggestion)}
                  >
                    <Text style={{ color: theme.colors.text }}>
                      {suggestion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );

      case 'select':
        return (
          <View style={styles.fieldContainer}>
            <Text
              style={[
                styles.fieldLabel,
                { color: theme.colors.text },
                hasError && styles.errorText,
              ]}
            >
              {field.label}
              {field.validation?.required && ' *'}
            </Text>
            <View style={styles.selectContainer}>
              {field.options?.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.selectOption,
                    value === option && styles.selectedOption,
                    { backgroundColor: theme.colors.surface },
                  ]}
                  onPress={() => handleFieldChange(field, option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: theme.colors.text },
                      value === option && styles.selectedOptionText,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'checkbox':
        return (
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => handleFieldChange(field, !value)}
          >
            <Icon
              name={value ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color={theme.colors.primary}
            />
            <Text style={[styles.checkboxLabel, { color: theme.colors.text }]}>
              {field.label}
            </Text>
          </TouchableOpacity>
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

  if (error || !template || !entry) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={startDocumentation}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentSection = template.sections[currentSectionIndex];

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
        <Text style={[styles.progressText, { color: theme.colors.text }]}>
          {currentSectionIndex + 1} / {template.sections.length}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Section Title */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {currentSection.title}
        </Text>

        {/* Fields */}
        {currentSection.fields.map(field => (
          <View key={field.id} style={styles.fieldWrapper}>
            {renderField(field)}
          </View>
        ))}

        {/* Navigation */}
        <View style={styles.navigation}>
          {currentSectionIndex > 0 && (
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => setCurrentSectionIndex(prev => prev - 1)}
            >
              <Icon name="chevron-left" size={24} color={theme.colors.text} />
              <Text style={[styles.navButtonText, { color: theme.colors.text }]}>
                Previous
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: theme.colors.primary },
              processing && styles.disabledButton,
            ]}
            onPress={() =>
              currentSectionIndex === template.sections.length - 1
                ? handleSubmit()
                : handleSectionComplete(currentSection)
            }
            disabled={processing}
          >
            <Text style={styles.buttonText}>
              {currentSectionIndex === template.sections.length - 1
                ? 'Submit'
                : 'Next'}
            </Text>
            {currentSectionIndex < template.sections.length - 1 && (
              <Icon name="chevron-right" size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
  },
  fieldWrapper: {
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    minHeight: 40,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  helpText: {
    fontSize: 12,
    marginTop: 4,
  },
  suggestionsContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  suggestion: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  selectOption: {
    margin: 4,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedOption: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  optionText: {
    fontSize: 14,
  },
  selectedOptionText: {
    fontWeight: '500',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  navButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#F44336',
  },
  errorInput: {
    borderColor: '#F44336',
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

export default DocumentationInterface;

