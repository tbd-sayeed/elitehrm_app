/**
 * App Navigator - Main navigation container
 * @format
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/auth/SplashScreen';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { navigationRef } from '../utils/navigationRef';
import { restoreAuthState } from '../utils/auth';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  useEffect(() => {
    // Restore auth state on app startup
    // This will populate the auth store if user was previously logged in
    const initializeAuth = async () => {
      try {
        await restoreAuthState();
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };

    initializeAuth();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Main" component={MainNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

