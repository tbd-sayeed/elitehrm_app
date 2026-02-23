/**
 * Set Password Screen - Third step in registration flow
 * @format
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { setPassword as setPasswordAPI } from '../../api/auth';
import { showToast } from '../../utils/toast';
import { getCenteredTextMaxWidth, getScreenHorizontalPadding } from '../../utils/layout';

type SetPasswordNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'SetPassword'
>;
type SetPasswordRouteProp = RouteProp<AuthStackParamList, 'SetPassword'>;

const SetPasswordScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SetPasswordNavigationProp>();
  const route = useRoute<SetPasswordRouteProp>();
  const { width } = useWindowDimensions();
  const horizontalPad = getScreenHorizontalPadding(width);
  const subtitleMaxWidth = getCenteredTextMaxWidth(width, horizontalPad);
  const email = route.params?.email || '';
  const code = route.params?.code || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetPassword = async () => {
    if (!isValidPassword()) {
      return;
    }

    if (!code) {
      setError('Verification code is missing. Please go back and verify your email again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await setPasswordAPI({
        email: email,
        code: code,
        password: password,
        password_confirmation: confirmPassword,
      });

      if (response.success) {
        // Show success message
        showToast.success(
          'Password Set Successfully',
          response.message || 'Your password has been set. Please login with your new password.'
        );
        // Navigate to login after a short delay
        setTimeout(() => {
          navigation.navigate('Login');
        }, 1500);
      } else {
        const errorMessage = response.message || 'Failed to set password';
        showToast.error('Failed to Set Password', errorMessage);
        setError(errorMessage);
      }
    } catch (err: any) {
      // Handle API errors
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.password?.[0] ||
        err.response?.data?.errors?.code?.[0] ||
        'Failed to set password. Please try again.';
      showToast.error('Failed to Set Password', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const isValidPassword = () => {
    if (password.length < 8) return false;
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (password !== confirmPassword) return false;
    return true;
  };

  const getPasswordStrength = () => {
    if (password.length === 0) return { text: '', color: '#757575' };
    if (password.length < 8) return { text: 'Too short', color: '#f44336' };
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password))
      return { text: 'Need mixed case', color: '#ff9800' };
    if (!/[0-9]/.test(password))
      return { text: 'Need a number', color: '#ff9800' };
    return { text: 'Strong password', color: '#4caf50' };
  };

  const passwordStrength = getPasswordStrength();
  const passwordsMatch = confirmPassword
    ? password === confirmPassword
    : null;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>E</Text>
          </View>
          <Text style={styles.title}>Set Your Password</Text>
          <Text style={[styles.subtitle, { maxWidth: subtitleMaxWidth }]}>
            Create a strong password to secure your account
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={[
                  styles.passwordInput,
                  password && !isValidPassword() && styles.inputError,
                ]}
                placeholder="Enter your password"
                placeholderTextColor="#9e9e9e"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}>
                <Text style={styles.eyeButtonText}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
            {password && (
              <Text
                style={[
                  styles.strengthText,
                  { color: passwordStrength.color },
                ]}>
                {passwordStrength.text}
              </Text>
            )}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={[
                  styles.passwordInput,
                  confirmPassword &&
                    passwordsMatch === false &&
                    styles.inputError,
                ]}
                placeholder="Confirm your password"
                placeholderTextColor="#9e9e9e"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                activeOpacity={0.7}>
                <Text style={styles.eyeButtonText}>
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
            {confirmPassword && passwordsMatch === false && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}
            {confirmPassword && passwordsMatch === true && (
              <Text style={styles.successText}>Passwords match ✓</Text>
            )}
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <View style={styles.requirementItem}>
              <Text
                style={[
                  styles.requirementText,
                  password.length >= 8 && styles.requirementMet,
                ]}>
                {password.length >= 8 ? '✓' : '○'} At least 8 characters
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Text
                style={[
                  styles.requirementText,
                  /[a-z]/.test(password) &&
                    /[A-Z]/.test(password) &&
                    styles.requirementMet,
                ]}>
                {/[a-z]/.test(password) && /[A-Z]/.test(password)
                  ? '✓'
                  : '○'}{' '}
                Mixed case letters
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Text
                style={[
                  styles.requirementText,
                  /[0-9]/.test(password) && styles.requirementMet,
                ]}>
                {/[0-9]/.test(password) ? '✓' : '○'} At least one number
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!isValidPassword() || isLoading) && styles.primaryButtonDisabled,
            ]}
            onPress={handleSetPassword}
            disabled={!isValidPassword() || isLoading}
            activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Setting Password...' : 'Set Password'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1a237e',
    fontWeight: '500',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#1a237e',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formSection: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#212121',
  },
  eyeButton: {
    padding: 8,
  },
  eyeButtonText: {
    fontSize: 20,
  },
  inputError: {
    borderColor: '#f44336',
  },
  strengthText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 6,
  },
  successText: {
    fontSize: 12,
    color: '#4caf50',
    marginTop: 6,
  },
  errorContainer: {
    marginTop: 8,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  requirementsContainer: {
    marginTop: 8,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 12,
  },
  requirementItem: {
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#757575',
  },
  requirementMet: {
    color: '#4caf50',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#1a237e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#1a237e',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#b0bec5',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});

export default SetPasswordScreen;

