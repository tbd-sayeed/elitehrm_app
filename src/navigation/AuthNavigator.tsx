/**
 * Auth Navigator - Handles authentication flow screens
 * @format
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import CodeVerificationScreen from '../screens/auth/CodeVerificationScreen';
import SetPasswordScreen from '../screens/auth/SetPasswordScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

export type AuthStackParamList = {
  Welcome: undefined;
  EmailVerification: undefined;
  CodeVerification: { email: string; isPasswordReset?: boolean };
  SetPassword: { email: string; code: string };
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string; code: string };
};

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#ffffff' },
        animationEnabled: true,
        gestureEnabled: true,
      }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen
        name="EmailVerification"
        component={EmailVerificationScreen}
      />
      <Stack.Screen
        name="CodeVerification"
        component={CodeVerificationScreen}
      />
      <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;

