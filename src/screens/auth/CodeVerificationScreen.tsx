/**
 * Code Verification Screen - Second step in registration flow
 * @format
 */

import React, { useState, useRef, useEffect } from 'react';
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
import { verifyCode, verifyEmail, forgotPassword } from '../../api/auth';
import { showToast } from '../../utils/toast';
import { getCenteredTextMaxWidth, getScreenHorizontalPadding } from '../../utils/layout';

type CodeVerificationNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'CodeVerification'
>;
type CodeVerificationRouteProp = RouteProp<
  AuthStackParamList,
  'CodeVerification'
>;

const CodeVerificationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CodeVerificationNavigationProp>();
  const route = useRoute<CodeVerificationRouteProp>();
  const { width } = useWindowDimensions();
  const horizontalPad = getScreenHorizontalPadding(width);
  const subtitleMaxWidth = getCenteredTextMaxWidth(width, horizontalPad);
  const email = route.params?.email || '';
  const isPasswordReset = route.params?.isPasswordReset || false;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Start resend timer (60 seconds)
    setResendTimer(60);
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCodeChange = (text: string, index: number) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length > 1) return;

    const newCode = [...code];
    newCode[index] = numericText;
    setCode(newCode);

    // Auto-focus next input
    if (numericText && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (numericText && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerify();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the same verifyCode API for both registration and password reset
      const response = await verifyCode({
        email: email,
        code: fullCode,
      });

      if (response.success) {
        // Show success message
        showToast.success('Code verified successfully!');
        
        // Navigate based on flow type
        if (isPasswordReset) {
          // Password reset flow - go to ResetPassword
          navigation.navigate('ResetPassword', {
            email: email,
            code: fullCode,
          });
        } else {
          // Registration flow - go to SetPassword
          navigation.navigate('SetPassword', {
            email: email,
            code: fullCode,
          });
        }
      } else {
        const errorMessage = response.message || 'Invalid verification code';
        showToast.error('Verification Failed', errorMessage);
        setError(errorMessage);
        // Clear code on error
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      // Handle API errors
      console.error('❌ Code verification error:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
        } : 'No response',
      });

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.code?.[0] ||
        'Invalid verification code. Please try again.';
      
      showToast.error('Verification Failed', errorMessage);
      setError(errorMessage);
      // Clear code on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || isResending) {
      return;
    }

    setIsResending(true);
    setError(null);

    try {
      let response;
      
      if (isPasswordReset) {
        // For password reset, use forgotPassword API
        response = await forgotPassword({ email: email });
      } else {
        // For registration, use verifyEmail API
        response = await verifyEmail({ email: email });
      }
      
      if (response.success) {
        // Show success message
        showToast.success(
          'Code Sent',
          `A new verification code has been sent to ${email}`
        );
        
        // Reset timer
        setResendTimer(60);
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Clear code inputs
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        const errorMessage = response.message || 'Failed to resend code';
        showToast.error('Resend Failed', errorMessage);
        setError(errorMessage);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        'Failed to resend verification code. Please try again.';
      
      showToast.error('Resend Failed', errorMessage);
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const isCodeComplete = code.every((digit) => digit !== '');

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
          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={[styles.subtitle, { maxWidth: subtitleMaxWidth }]}>
            {isPasswordReset
              ? `We've sent a 6-digit code to reset your password to\n`
              : `We've sent a 6-digit code to\n`}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
        </View>

        {/* Code Input Section */}
        <View style={styles.codeSection}>
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.codeInput,
                  digit && styles.codeInputFilled,
                  index === code.findIndex((d) => d === '') &&
                    styles.codeInputActive,
                ]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, index)
                }
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.verifyButton,
              (!isCodeComplete || isLoading) && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={!isCodeComplete || isLoading}
            activeOpacity={0.8}>
            <Text style={styles.verifyButtonText}>
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Resend Section */}
        <View style={styles.resendSection}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={resendTimer > 0}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.resendButtonText,
                resendTimer > 0 && styles.resendButtonDisabled,
              ]}>
              {resendTimer > 0
                ? `Resend code in ${resendTimer}s`
                : 'Resend Code'}
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
  emailText: {
    fontWeight: '600',
    color: '#1a237e',
  },
  codeSection: {
    width: '100%',
    marginTop: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#212121',
    backgroundColor: '#fafafa',
  },
  codeInputFilled: {
    borderColor: '#1a237e',
    backgroundColor: '#ffffff',
  },
  codeInputActive: {
    borderColor: '#1a237e',
    backgroundColor: '#ffffff',
  },
  verifyButton: {
    backgroundColor: '#1a237e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1a237e',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonDisabled: {
    backgroundColor: '#b0bec5',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  resendSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
  },
  resendButtonDisabled: {
    color: '#b0bec5',
  },
});

export default CodeVerificationScreen;

