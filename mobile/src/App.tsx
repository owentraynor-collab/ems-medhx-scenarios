import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';

// Import screens here
// import LoginScreen from './screens/LoginScreen';
// import DashboardScreen from './screens/DashboardScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {/* Screens will be added here */}
          {/* <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} /> */}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;

