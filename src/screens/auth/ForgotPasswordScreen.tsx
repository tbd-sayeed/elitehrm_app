/**
 * Forgot Password Screen - First step in password reset flow
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { forgotPassword } from '../../api/auth';
import { showToast } from '../../utils/toast';
import { getCenteredTextMaxWidth, getScreenHorizontalPadding } from '../../utils/layout';

type ForgotPasswordNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;

const ForgotPasswordScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const { width } = useWindowDimensions();
  const horizontalPad = getScreenHorizontalPadding(width);
  const subtitleMaxWidth = getCenteredTextMaxWidth(width, horizontalPad);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!email.trim() || !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 Sending forgot password request for:', email.trim());
      const response = await forgotPassword({ email: email.trim() });
      console.log('✅ Forgot password response:', JSON.stringify(response, null, 2));

      if (response.success) {
        showToast.success(
          'Code Sent',
          `Password reset code has been sent to ${email.trim()}`
        );
        // Navigate to code verification screen for password reset
        navigation.navigate('CodeVerification', {
          email: email.trim(),
          isPasswordReset: true,
        });
      } else {
        const errorMessage = response.message || 'Failed to send reset code';
        showToast.error('Failed to Send Code', errorMessage);
        setError(errorMessage);
      }
    } catch (err: any) {
      // Enhanced error logging
      console.error('❌ Forgot password error:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
        } : 'No response',
        request: err.request ? {
          url: err.config?.url,
          method: err.config?.method,
          baseURL: err.config?.baseURL,
        } : 'No request',
      });

      // Handle API errors with detailed messages
      let errorMessage = 'Failed to send reset code. Please try again.';

      if (err.response) {
        // Server responded with error
        errorMessage =
          err.response.data?.message ||
          err.response.data?.errors?.email?.[0] ||
          err.response.data?.error ||
          `Server error: ${err.response.status} ${err.response.statusText}`;
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'Network error: Unable to reach server. Please check your internet connection.';
      } else {
        // Something else happened
        errorMessage = err.message || 'An unexpected error occurred';
      }

      showToast.error('Failed to Send Code', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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
            <Text style={styles.logoText}>🔒</Text>
          </View>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={[styles.subtitle, { maxWidth: subtitleMaxWidth }]}>
            Enter your email address and we'll send you a code to reset your password
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[
                styles.input,
                email && !isValidEmail(email) && styles.inputError,
              ]}
              placeholder="Enter your email"
              placeholderTextColor="#9e9e9e"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
            {email && !isValidEmail(email) && (
              <Text style={styles.errorText}>Please enter a valid email</Text>
            )}
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!email.trim() || !isValidEmail(email) || isLoading) &&
                styles.primaryButtonDisabled,
            ]}
            onPress={handleSendCode}
            disabled={!email.trim() || !isValidEmail(email) || isLoading}
            activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Sending...' : 'Send Reset Code'}
            </Text>
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              We'll send a 6-digit verification code to your email address to reset your password.
            </Text>
          </View>

          {/* Back to Login */}
          <View style={styles.backToLoginContainer}>
            <Text style={styles.backToLoginText}>Remember your password? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}>
              <Text style={styles.backToLoginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
  input: {
    height: 56,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#f44336',
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 6,
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
  infoContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center',
    lineHeight: 20,
  },
  backToLoginContainer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToLoginText: {
    fontSize: 14,
    color: '#757575',
  },
  backToLoginLink: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
