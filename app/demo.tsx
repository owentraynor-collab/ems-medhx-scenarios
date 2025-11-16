import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Mock components for demo
const MockComponent = ({ title }: { title: string }) => (
  <View style={styles.mockComponent}>
    <Text style={styles.mockTitle}>{title}</Text>
    <Text style={styles.mockDescription}>
      This is a mock component for demonstration purposes. The actual component will be implemented with full functionality.
    </Text>
  </View>
);

type DemoScreen = 'menu' | 'quiz' | 'scenario' | 'documentation' | 'progress' | 'instructor' | 'monitoring' | 'health';

const DEMO_USER_ID = 'demo-user-123';

export default function Demo() {
  const [currentScreen, setCurrentScreen] = useState<DemoScreen>('menu');
  const [role, setRole] = useState<'student' | 'instructor'>('student');

  const renderHeader = () => (
    <View style={styles.header}>
      {currentScreen !== 'menu' && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentScreen('menu')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
          <Text style={styles.backText}>Menu</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.headerTitle}>
        EMS MedHx Demo
      </Text>
      <TouchableOpacity
        style={styles.roleButton}
        onPress={() => setRole(prev => prev === 'student' ? 'instructor' : 'student')}
      >
        <MaterialCommunityIcons
          name={role === 'student' ? 'account-school' : 'teach'}
          size={24}
          color="#000"
        />
        <Text style={styles.roleText}>
          {role === 'student' ? 'Student' : 'Instructor'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderMenu = () => (
    <ScrollView style={styles.menu}>
      <Text style={styles.menuTitle}>Available Features</Text>
      
      {/* Student Features */}
      {role === 'student' && (
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Learning</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setCurrentScreen('quiz')}
          >
            <MaterialCommunityIcons name="format-list-checks" size={24} color="#2196F3" />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Quiz Mode</Text>
              <Text style={styles.menuItemDescription}>
                Practice with multiple-choice questions
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setCurrentScreen('scenario')}
          >
            <MaterialCommunityIcons name="account-injury" size={24} color="#4CAF50" />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Patient Scenarios</Text>
              <Text style={styles.menuItemDescription}>
                Interactive clinical simulations
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setCurrentScreen('documentation')}
          >
            <MaterialCommunityIcons name="file-document-edit" size={24} color="#FF9800" />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Documentation Training</Text>
              <Text style={styles.menuItemDescription}>
                Practice patient care documentation
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setCurrentScreen('progress')}
          >
            <MaterialCommunityIcons name="chart-line" size={24} color="#9C27B0" />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Progress Tracking</Text>
              <Text style={styles.menuItemDescription}>
                View your learning progress
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Instructor Features */}
      {role === 'instructor' && (
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Management</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setCurrentScreen('instructor')}
          >
            <MaterialCommunityIcons name="view-dashboard" size={24} color="#2196F3" />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Instructor Dashboard</Text>
              <Text style={styles.menuItemDescription}>
                Monitor student performance
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setCurrentScreen('monitoring')}
          >
            <MaterialCommunityIcons name="alert-circle" size={24} color="#F44336" />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Error Monitoring</Text>
              <Text style={styles.menuItemDescription}>
                Track and resolve system issues
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setCurrentScreen('health')}
          >
            <MaterialCommunityIcons name="heart-pulse" size={24} color="#4CAF50" />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>System Health</Text>
              <Text style={styles.menuItemDescription}>
                Monitor system performance
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const renderContent = () => {
    switch (currentScreen) {
      case 'quiz':
        return <MockComponent title="Quiz Interface" />;
      case 'scenario':
        return <MockComponent title="Scenario Interface" />;
      case 'documentation':
        return <MockComponent title="Documentation Interface" />;
      case 'progress':
        return <MockComponent title="Progress Tracker" />;
      case 'instructor':
        return <MockComponent title="Instructor Dashboard" />;
      case 'monitoring':
        return <MockComponent title="Error Monitor" />;
      case 'health':
        return <MockComponent title="Health Dashboard" />;
      default:
        return renderMenu();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <StatusBar style="auto" />
      {renderHeader()}
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  roleText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  menu: {
    flex: 1,
    padding: 16,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
    color: '#666',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 12,
  },
  menuItemContent: {
    marginLeft: 16,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
  },
  mockComponent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  mockDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 32,
  },
});