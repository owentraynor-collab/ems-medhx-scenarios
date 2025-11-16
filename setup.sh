#!/bin/bash

# Create project directory if it doesn't exist
mkdir -p EMSMedHx

# Initialize new Expo project with TypeScript template
npx create-expo-app@latest EMSMedHx -t expo-template-blank-typescript

# Navigate to project directory
cd EMSMedHx

# Install required dependencies
npm install @react-navigation/native @react-navigation/native-stack \
  @react-native-async-storage/async-storage \
  expo-notifications \
  expo-file-system \
  expo-print \
  expo-sharing \
  expo-background-fetch \
  expo-task-manager \
  react-native-chart-kit \
  react-native-markdown-display \
  react-native-gesture-handler \
  react-native-reanimated \
  react-native-safe-area-context \
  react-native-screens

# Create necessary directories
mkdir -p src/components/common
mkdir -p src/components/error
mkdir -p src/components/assessment
mkdir -p src/screens
mkdir -p src/navigation
mkdir -p src/services
mkdir -p src/hooks
mkdir -p src/skills/medical/tools
mkdir -p src/skills/medical/references

# Copy all the source files from the parent directory
cp -r ../src/* src/

# Update app.json with required permissions and configurations
cat > app.json << EOL
{
  "expo": {
    "name": "EMS MedHx",
    "slug": "ems-medhx",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.emsmedhx.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.emsmedhx.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-notifications",
      "expo-file-system",
      "expo-print",
      "expo-sharing",
      "expo-background-fetch",
      "expo-task-manager"
    ],
    "permissions": [
      "NOTIFICATIONS",
      "BACKGROUND_FETCH",
      "CAMERA",
      "AUDIO_RECORDING",
      "WRITE_EXTERNAL_STORAGE",
      "READ_EXTERNAL_STORAGE"
    ]
  }
}
EOL

# Update App.tsx to use our navigation
cat > App.tsx << EOL
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}
EOL

# Install dev dependencies
npm install --save-dev @types/react-native @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-plugin-react eslint-plugin-react-hooks

echo "Setup complete! Run 'npx expo start' to launch the app."
