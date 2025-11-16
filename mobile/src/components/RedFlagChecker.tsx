import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Card,
  Checkbox,
  Title,
  Paragraph,
  Button,
  List,
  Surface,
  Text,
  Portal,
  Dialog,
  MD3Colors,
} from 'react-native-paper';

interface RedFlag {
  id: string;
  finding: string;
  significance: string;
  requiredAction: string;
  category: 'neurological' | 'cardiovascular' | 'respiratory' | 'abdominal' | 'musculoskeletal' | 'general';
  severity: 'critical' | 'urgent' | 'important';
}

interface RedFlagCheckerProps {
  availableRedFlags: RedFlag[];
  onRedFlagIdentified: (redFlag: RedFlag) => void;
  onComplete: (identifiedFlags: RedFlag[]) => void;
}

const RedFlagChecker: React.FC<RedFlagCheckerProps> = ({
  availableRedFlags,
  onRedFlagIdentified,
  onComplete,
}) => {
  const [identifiedFlags, setIdentifiedFlags] = useState<Set<string>>(new Set());
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<RedFlag | null>(null);

  const handleFlagToggle = (flag: RedFlag) => {
    const newIdentified = new Set(identifiedFlags);
    if (newIdentified.has(flag.id)) {
      newIdentified.delete(flag.id);
    } else {
      newIdentified.add(flag.id);
      onRedFlagIdentified(flag);
    }
    setIdentifiedFlags(newIdentified);
  };

  const handleExplanation = (flag: RedFlag) => {
    setSelectedFlag(flag);
    setShowExplanation(true);
  };

  const renderExplanationDialog = () => (
    <Portal>
      <Dialog visible={showExplanation} onDismiss={() => setShowExplanation(false)}>
        <Dialog.Title>Clinical Significance</Dialog.Title>
        <Dialog.Content>
          {selectedFlag && (
            <>
              <Text style={styles.dialogSubtitle}>Finding:</Text>
              <Text style={styles.dialogText}>{selectedFlag.finding}</Text>
              
              <Text style={styles.dialogSubtitle}>Clinical Significance:</Text>
              <Text style={styles.dialogText}>{selectedFlag.significance}</Text>
              
              <Text style={styles.dialogSubtitle}>Required Action:</Text>
              <Text style={styles.dialogText}>{selectedFlag.requiredAction}</Text>
            </>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowExplanation(false)}>Close</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  const renderFlagsByCategory = () => {
    const categories = Array.from(
      new Set(availableRedFlags.map(flag => flag.category))
    );

    return categories.map(category => (
      <Surface key={category} style={styles.categoryContainer}>
        <Title style={styles.categoryTitle}>
          {category.charAt(0).toUpperCase() + category.slice(1)} Red Flags
        </Title>
        {availableRedFlags
          .filter(flag => flag.category === category)
          .map(flag => (
            <Card key={flag.id} style={styles.flagCard}>
              <Card.Content>
                <View style={styles.flagHeader}>
                  <Checkbox
                    status={identifiedFlags.has(flag.id) ? 'checked' : 'unchecked'}
                    onPress={() => handleFlagToggle(flag)}
                  />
                  <Paragraph style={styles.flagText}>{flag.finding}</Paragraph>
                </View>
                <Button
                  mode="text"
                  onPress={() => handleExplanation(flag)}
                >
                  Learn More
                </Button>
              </Card.Content>
            </Card>
          ))}
      </Surface>
    ));
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {renderFlagsByCategory()}
      </ScrollView>
      <Button
        mode="contained"
        style={styles.completeButton}
        onPress={() => onComplete(
          availableRedFlags.filter(flag => identifiedFlags.has(flag.id))
        )}
      >
        Complete Assessment
      </Button>
      {renderExplanationDialog()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoryContainer: {
    margin: 8,
    padding: 8,
    borderRadius: 8,
    elevation: 2,
  },
  categoryTitle: {
    marginBottom: 8,
    color: MD3Colors.primary40,
  },
  flagCard: {
    marginVertical: 4,
  },
  flagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagText: {
    flex: 1,
    marginLeft: 8,
  },
  completeButton: {
    margin: 16,
  },
  dialogSubtitle: {
    fontWeight: 'bold',
    marginTop: 8,
    color: MD3Colors.primary40,
  },
  dialogText: {
    marginBottom: 8,
  },
});

export default RedFlagChecker;

