/**
 * Login Screen - Final step in registration flow or direct login
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
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { reset as navigationReset } from '../../utils/navigationRef';
import { login as loginAPI } from '../../api/auth';
import { useAuthStore, type DashboardData } from '../../store/authStore';
import { tokenStorage, userStorage, dashboardStorage, deviceStorage } from '../../utils/storage';
import { showToast } from '../../utils/toast';
import { getCenteredTextMaxWidth, getScreenHorizontalPadding } from '../../utils/layout';
import DeviceInfo from 'react-native-device-info';

type LoginNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LoginNavigationProp>();
  const { setAuth } = useAuthStore();
  const { width } = useWindowDimensions();
  const horizontalPad = getScreenHorizontalPadding(width);
  const subtitleMaxWidth = getCenteredTextMaxWidth(width, horizontalPad);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const versionLabel = `Version ${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`;

  const handleLogin = async () => {
    if (!canLogin) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get device name for multi-device tracking
      const deviceName = await deviceStorage.getDeviceName() || 
        `${Platform.OS} ${Platform.Version}`;

      const response = await loginAPI({
        email: email.trim(),
        password: password,
        device_name: deviceName,
      });

      if (response.success && response.data) {
        const {
          access_token,
          refresh_token,
          employee,
          working_patterns,
          leave_statistics,
          latest_timesheet,
          last_attendance,
          public_holidays,
        } = response.data;

        // Prepare dashboard data (cast from API response shape)
        const dashboardData = {
          workingPatterns: working_patterns,
          leaveStatistics: leave_statistics,
          latestTimesheet: latest_timesheet,
          lastAttendance: last_attendance,
          publicHolidays: public_holidays,
        } as DashboardData;

        // Store tokens
        await tokenStorage.setAccessToken(access_token);
        await tokenStorage.setRefreshToken(refresh_token);
        
        // Store user data
        await userStorage.setUserData(employee);

        // Store dashboard data for auto-login restore
        await dashboardStorage.setDashboardData(dashboardData);

        // Store device name if not already stored
        if (!(await deviceStorage.getDeviceName())) {
          await deviceStorage.setDeviceName(deviceName);
        }

        // Update auth store with all data
        setAuth({
          user: employee,
          accessToken: access_token,
          refreshToken: refresh_token,
          dashboardData: dashboardData,
        });

        // Show success message
        showToast.success('Login Successful', 'Welcome back!');

        // Navigate to Main navigator (Dashboard)
        navigationReset([{ name: 'Main' }]);
      } else {
        const errorMessage = response.message || 'Login failed. Please try again.';
        showToast.error('Login Failed', errorMessage);
        setError(errorMessage);
      }
    } catch (err: any) {
      // Handle API errors
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.errors?.password?.[0] ||
        'Login failed. Please check your credentials and try again.';
      
      showToast.error('Login Failed', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const canLogin = email.trim() && password.trim() && isValidEmail(email);

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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={[styles.subtitle, { maxWidth: subtitleMaxWidth }]}>
            Sign in to access your account
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Email Input */}
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
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={styles.passwordInput}
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
          </View>

          {/* Remember Me & Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}>
              <View
                style={[
                  styles.checkbox,
                  rememberMe && styles.checkboxChecked,
                ]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberMeText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleForgotPassword}
              activeOpacity={0.7}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!canLogin || isLoading) && styles.primaryButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={!canLogin || isLoading}
            activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>{versionLabel}</Text>
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
  errorContainer: {
    marginTop: 8,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#b0bec5',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#424242',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#1a237e',
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
  versionText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 12,
    color: '#9e9e9e',
    fontWeight: '600',
  },
});

export default LoginScreen;

