import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import {
  ContentManagementService,
  ContentItem,
  ContentTemplate,
  ContentVersion,
  ValidationResult,
} from '../../services/ContentManagementService';

interface ContentManagerProps {
  userId: string;
  onContentSelect?: (contentId: string) => void;
}

export const ContentManager: React.FC<ContentManagerProps> = ({
  userId,
  onContentSelect,
}) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [templates, setTemplates] = useState<Map<string, ContentTemplate>>(
    new Map()
  );
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: [] as string[],
    tags: [] as string[],
  });
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [versionHistory, setVersionHistory] = useState<ContentVersion[]>([]);

  const theme = useTheme();
  const contentService = ContentManagementService.getInstance();

  useEffect(() => {
    initializeManager();
  }, []);

  const initializeManager = async () => {
    try {
      setLoading(true);
      await contentService.initialize();
      await refreshContent();
    } catch (error) {
      console.error('Failed to initialize content manager:', error);
      Alert.alert('Error', 'Failed to initialize content manager');
    } finally {
      setLoading(false);
    }
  };

  const refreshContent = async () => {
    try {
      const contentList = await contentService.listContent({
        type: selectedType || undefined,
        status: filters.status.length > 0 ? filters.status : undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        search: searchTerm || undefined,
      });
      setContent(contentList);
    } catch (error) {
      console.error('Failed to refresh content:', error);
      Alert.alert('Error', 'Failed to load content');
    }
  };

  const handleCreateContent = async () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select a content type');
      return;
    }

    try {
      const template = await contentService.getTemplate(selectedType);
      setFormData({});
      setValidation(null);
      setEditMode(true);
      setSelectedContent(null);
    } catch (error) {
      console.error('Failed to start content creation:', error);
      Alert.alert('Error', 'Failed to start content creation');
    }
  };

  const handleEditContent = async (item: ContentItem) => {
    try {
      const versions = await contentService.getVersionHistory(item.id);
      setVersionHistory(versions);
      setFormData(item.content);
      setValidation(null);
      setEditMode(true);
      setSelectedContent(item);
    } catch (error) {
      console.error('Failed to start content editing:', error);
      Alert.alert('Error', 'Failed to start editing');
    }
  };

  const handleSaveContent = async () => {
    try {
      if (selectedContent) {
        // Update existing content
        const updated = await contentService.updateContent(selectedContent.id, {
          content: formData,
          metadata: {
            author: userId,
            status: 'draft',
          },
        });
        setSelectedContent(updated);
      } else {
        // Create new content
        const created = await contentService.createContent(
          selectedType!,
          formData,
          {
            author: userId,
            status: 'draft',
          }
        );
        setSelectedContent(created);
      }

      setEditMode(false);
      refreshContent();
      Alert.alert('Success', 'Content saved successfully');
    } catch (error) {
      console.error('Failed to save content:', error);
      Alert.alert('Error', 'Failed to save content');
    }
  };

  const handleValidate = async () => {
    try {
      const template = await contentService.getTemplate(
        selectedType || selectedContent?.type || ''
      );
      const result = await contentService.validateContent(formData, template);
      setValidation(result);

      if (!result.isValid) {
        Alert.alert(
          'Validation Errors',
          result.errors.map(e => e.message).join('\n')
        );
      }

      return result.isValid;
    } catch (error) {
      console.error('Validation failed:', error);
      Alert.alert('Error', 'Failed to validate content');
      return false;
    }
  };

  const renderContentList = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Content
        </Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleCreateContent}
        >
          <Icon name="plus" size={24} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create New</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[
          styles.searchInput,
          {
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
          },
        ]}
        value={searchTerm}
        onChangeText={text => {
          setSearchTerm(text);
          refreshContent();
        }}
        placeholder="Search content..."
        placeholderTextColor={theme.colors.text + '80'}
      />

      <FlatList
        data={content}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.contentCard,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() => handleEditContent(item)}
          >
            <View style={styles.contentHeader}>
              <Text style={[styles.contentTitle, { color: theme.colors.text }]}>
                {item.title}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.metadata.status === 'published'
                        ? '#4CAF50'
                        : item.metadata.status === 'review'
                        ? '#FFA000'
                        : '#9E9E9E',
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {item.metadata.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text
              style={[styles.contentDescription, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
            <View style={styles.contentMeta}>
              <Text style={[styles.metaText, { color: theme.colors.text }]}>
                v{item.metadata.version} • Updated{' '}
                {new Date(item.metadata.updatedAt).toLocaleDateString()}
              </Text>
              <View style={styles.tags}>
                {item.metadata.tags.map((tag, index) => (
                  <View
                    key={index}
                    style={[
                      styles.tag,
                      { backgroundColor: theme.colors.primary + '20' },
                    ]}
                  >
                    <Text
                      style={[styles.tagText, { color: theme.colors.primary }]}
                    >
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderEditor = () => {
    if (!editMode) return null;

    const template = templates.get(
      selectedType || selectedContent?.type || ''
    );
    if (!template) return null;

    return (
      <View style={styles.editor}>
        <View style={styles.editorHeader}>
          <Text style={[styles.editorTitle, { color: theme.colors.text }]}>
            {selectedContent ? 'Edit Content' : 'Create New Content'}
          </Text>
          <View style={styles.editorActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#9E9E9E' }]}
              onPress={() => setEditMode(false)}
            >
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
              onPress={handleValidate}
            >
              <Text style={styles.actionButtonText}>Validate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              onPress={handleSaveContent}
            >
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.editorContent}>
          {template.structure.fields.map((field, index) => (
            <View key={index} style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
                {field.name}
                {field.required && ' *'}
              </Text>
              {renderField(field)}
              {validation?.errors.some(e => e.field === field.name) && (
                <Text style={styles.errorText}>
                  {
                    validation.errors.find(e => e.field === field.name)
                      ?.message
                  }
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderField = (field: any) => {
    const value = formData[field.name];

    switch (field.type) {
      case 'string':
        return (
          <TextInput
            style={[
              styles.textInput,
              { color: theme.colors.text, backgroundColor: theme.colors.surface },
            ]}
            value={value}
            onChangeText={text =>
              setFormData(prev => ({ ...prev, [field.name]: text }))
            }
            placeholder={`Enter ${field.name}...`}
            placeholderTextColor={theme.colors.text + '80'}
            multiline={field.multiline}
          />
        );

      case 'select':
        return (
          <View style={styles.selectContainer}>
            {field.options?.map((option: string, index: number) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.selectOption,
                  value === option && styles.selectedOption,
                  { backgroundColor: theme.colors.surface },
                ]}
                onPress={() =>
                  setFormData(prev => ({ ...prev, [field.name]: option }))
                }
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

  return (
    <View style={styles.container}>
      {editMode ? renderEditor() : renderContentList()}
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
  section: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  searchInput: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  contentCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  contentDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  contentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  tagText: {
    fontSize: 12,
  },
  editor: {
    flex: 1,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  editorTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  editorActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  editorContent: {
    flex: 1,
    padding: 16,
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
    borderRadius: 8,
    padding: 12,
    minHeight: 40,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -4,
  },
  selectOption: {
    margin: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
});

export default ContentManager;

