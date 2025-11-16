import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { StudentTrackingService } from '../../services/StudentTrackingService';
import { useTheme } from '../../hooks/useTheme';
import { formatDistanceToNow } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface DeviceSession {
  deviceId: string;
  platform: string;
  lastSync: number;
  activeModules: string[];
}

interface SessionManagerProps {
  userId: string;
  onSessionSelect?: (deviceId: string) => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  userId,
  onSessionSelect,
}) => {
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');

  const theme = useTheme();
  const trackingService = StudentTrackingService.getInstance();

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [userId]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const deviceSessions = await trackingService.getActiveSessions(userId);
      setSessions(deviceSessions);
      
      // Get current device ID
      const deviceInfo = await Platform.select({
        ios: () => Promise.resolve(Platform.constants.systemName),
        android: () => Promise.resolve(Platform.constants.Brand),
      })();
      setCurrentDeviceId(deviceInfo);
    } catch (err) {
      setError('Failed to load active sessions');
      console.error('Session loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionSelect = (session: DeviceSession) => {
    if (onSessionSelect) {
      onSessionSelect(session.deviceId);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'ios':
        return 'apple';
      case 'android':
        return 'android';
      case 'web':
        return 'web';
      default:
        return 'devices';
    }
  };

  const renderSession = ({ item: session }: { item: DeviceSession }) => {
    const isCurrentDevice = session.deviceId === currentDeviceId;
    const lastSyncTime = formatDistanceToNow(new Date(session.lastSync), {
      addSuffix: true,
    });

    return (
      <TouchableOpacity
        style={[
          styles.sessionCard,
          isCurrentDevice && styles.currentDevice,
          { backgroundColor: theme.colors.surface },
        ]}
        onPress={() => handleSessionSelect(session)}
      >
        <View style={styles.sessionHeader}>
          <Icon
            name={getPlatformIcon(session.platform)}
            size={24}
            color={theme.colors.primary}
          />
          <Text style={[styles.platformText, { color: theme.colors.text }]}>
            {session.platform}
            {isCurrentDevice && ' (Current)'}
          </Text>
        </View>

        <View style={styles.sessionDetails}>
          <Text style={[styles.lastSync, { color: theme.colors.text }]}>
            Last active: {lastSyncTime}
          </Text>
          
          {session.activeModules.length > 0 && (
            <View style={styles.moduleList}>
              <Text style={[styles.moduleHeader, { color: theme.colors.text }]}>
                Active Modules:
              </Text>
              {session.activeModules.map((module, index) => (
                <Text
                  key={`${session.deviceId}-module-${index}`}
                  style={[styles.moduleItem, { color: theme.colors.text }]}
                >
                  • {module}
                </Text>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading sessions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Active Sessions
      </Text>
      
      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={(session) => session.deviceId}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            No active sessions found
          </Text>
        }
      />
    </View>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  listContainer: {
    flexGrow: 1,
  },
  sessionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currentDevice: {
    borderWidth: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  sessionDetails: {
    marginLeft: 32,
  },
  lastSync: {
    fontSize: 14,
    marginBottom: 8,
  },
  moduleList: {
    marginTop: 8,
  },
  moduleHeader: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  moduleItem: {
    fontSize: 14,
    marginLeft: 8,
    marginBottom: 2,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
  },
  error: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default SessionManager;

