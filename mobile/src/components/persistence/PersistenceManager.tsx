import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import { DataPersistenceService } from '../../services/DataPersistenceService';

interface PersistenceManagerProps {
  userId: string;
  deviceId: string;
  onError?: (error: Error) => void;
}

export const PersistenceManager: React.FC<PersistenceManagerProps> = ({
  userId,
  deviceId,
  onError,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  const theme = useTheme();
  const persistenceService = DataPersistenceService.getInstance();

  useEffect(() => {
    initializeService();
  }, []);

  useEffect(() => {
    const statusInterval = setInterval(refreshStatus, 30000); // Update every 30 seconds
    return () => clearInterval(statusInterval);
  }, []);

  const initializeService = async () => {
    try {
      setLoading(true);
      await persistenceService.initialize();
      await refreshStatus();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    try {
      const status = await persistenceService.getSyncStatus();
      setSyncStatus(status);
    } catch (err) {
      console.error('Failed to refresh status:', err);
    }
  };

  const handleManualSync = async () => {
    if (syncing) return;

    try {
      setSyncing(true);
      await persistenceService.synchronize();
      await refreshStatus();
      Alert.alert('Success', 'Synchronization completed successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to synchronize data');
    } finally {
      setSyncing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
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
          onPress={initializeService}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Sync Status */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Sync Status
          </Text>
          <TouchableOpacity
            style={[
              styles.syncButton,
              { backgroundColor: theme.colors.primary },
              syncing && styles.disabledButton,
            ]}
            onPress={handleManualSync}
            disabled={syncing}
          >
            <Icon
              name={syncing ? 'sync' : 'sync'}
              size={20}
              color="#FFFFFF"
              style={syncing && styles.rotating}
            />
            <Text style={styles.syncButtonText}>
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: theme.colors.text }]}>
              Last Sync
            </Text>
            <Text style={[styles.statusValue, { color: theme.colors.text }]}>
              {syncStatus?.lastSync
                ? formatTimestamp(syncStatus.lastSync)
                : 'Never'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: theme.colors.text }]}>
              Pending Changes
            </Text>
            <Text
              style={[
                styles.statusValue,
                { color: syncStatus?.pendingChanges > 0 ? '#FFA000' : '#4CAF50' },
              ]}
            >
              {syncStatus?.pendingChanges || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Storage Usage */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Storage Usage
        </Text>
        <View style={styles.storageCard}>
          <Text style={[styles.storageTotal, { color: theme.colors.text }]}>
            Total: {formatBytes(syncStatus?.storageUsage.total || 0)}
          </Text>
          {syncStatus?.storageUsage.byType &&
            Object.entries(syncStatus.storageUsage.byType).map(
              ([type, size]: [string, any]) => (
                <View key={type} style={styles.storageRow}>
                  <Text style={[styles.storageType, { color: theme.colors.text }]}>
                    {type}
                  </Text>
                  <Text
                    style={[styles.storageSize, { color: theme.colors.text }]}
                  >
                    {formatBytes(size)}
                  </Text>
                </View>
              )
            )}
        </View>
      </View>

      {/* Sync Errors */}
      {syncStatus?.syncErrors.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Recent Sync Issues
          </Text>
          {syncStatus.syncErrors.map((error: any, index: number) => (
            <View
              key={index}
              style={[
                styles.errorCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Text style={[styles.errorTime, { color: theme.colors.text }]}>
                {formatTimestamp(error.timestamp)}
              </Text>
              <Text style={[styles.errorMessage, { color: theme.colors.error }]}>
                {error.error}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  statusCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  storageCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  storageTotal: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storageType: {
    fontSize: 14,
  },
  storageSize: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  errorTime: {
    fontSize: 12,
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
  rotating: {
    transform: [{ rotate: '360deg' }],
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

export default PersistenceManager;

