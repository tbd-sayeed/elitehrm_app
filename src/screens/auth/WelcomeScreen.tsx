/**
 * Welcome Screen - Shown after splash screen
 * @format
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import DeviceInfo from 'react-native-device-info';

type WelcomeScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Welcome'>;

interface WelcomeScreenProps {
  navigation?: WelcomeScreenNavigationProp;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const { height, width } = useWindowDimensions();

  // Start with a safe estimate so the first render is already compact enough;
  // then refine via onLayout once buttons are measured.
  const [actionsHeight, setActionsHeight] = React.useState(220);

  // Available vertical space for the "content" block (everything above buttons).
  // This is what actually matters for "all 4 points must be visible".
  const availableContentHeight = height - insets.top - actionsHeight;

  // Device-wise horizontal spacing: give more side breathing room on wide screens
  const horizontalPad = width >= 420 ? 48 : width >= 390 ? 38 : 30;
  const subtitleMaxWidth = Math.min(width - horizontalPad * 2, 420);

  // These thresholds are intentionally a bit conservative to handle
  // devices with larger font scaling / display scaling.
  const isCompact = availableContentHeight < 820;
  const isVeryCompact = availableContentHeight < 760;
  const isUltraCompact = availableContentHeight < 710;

  const logoSize = isUltraCompact ? 56 : isVeryCompact ? 60 : isCompact ? 68 : 80;
  const appNameSize = isUltraCompact ? 24 : isVeryCompact ? 26 : isCompact ? 28 : 32;
  const welcomeSize = isUltraCompact ? 18 : isVeryCompact ? 19 : isCompact ? 21 : 24;
  const subtitleSize = isUltraCompact ? 12 : isVeryCompact ? 13 : isCompact ? 14 : 16;
  const subtitleLineHeight = isUltraCompact ? 16 : isVeryCompact ? 18 : isCompact ? 20 : 24;

  const illustrationSize = isUltraCompact ? 108 : isVeryCompact ? 125 : isCompact ? 150 : 200;
  const illustrationInnerSize = Math.round(illustrationSize * 0.74);
  const illustrationIconSize = isUltraCompact ? 48 : isVeryCompact ? 56 : isCompact ? 64 : 80;

  const featureRowGap = isUltraCompact ? 6 : isVeryCompact ? 8 : isCompact ? 10 : 16;
  const featureTextSize = isUltraCompact ? 13 : isVeryCompact ? 14 : 15;
  const featureIconSize = isUltraCompact ? 24 : isVeryCompact ? 26 : 28;
  const featureIconTextSize = isUltraCompact ? 14 : isVeryCompact ? 15 : 16;

  const headerPaddingTop = Platform.OS === 'ios'
    ? isUltraCompact
      ? 8
      : isVeryCompact
        ? 12
        : 20
    : isUltraCompact
      ? 12
      : isVeryCompact
        ? 16
        : isCompact
          ? 24
          : 40;
  const headerPaddingBottom = isUltraCompact ? 6 : isVeryCompact ? 8 : isCompact ? 10 : 20;
  const logoMarginBottom = isUltraCompact ? 8 : isVeryCompact ? 10 : isCompact ? 12 : 20;

  const illustrationPaddingVertical = Platform.OS === 'ios'
    ? isUltraCompact
      ? 6
      : isVeryCompact
        ? 8
        : 20
    : isUltraCompact
      ? 8
      : isVeryCompact
        ? 10
        : isCompact
          ? 12
          : 40;

  const featuresPaddingVertical = isUltraCompact ? 4 : isVeryCompact ? 6 : isCompact ? 10 : 20;
  const featuresPaddingBottom = isUltraCompact ? 0 : isVeryCompact ? 4 : 12;

  const actionsPaddingTop = isUltraCompact ? 8 : isVeryCompact ? 10 : 20;
  const buttonPaddingVertical = isUltraCompact ? 12 : isVeryCompact ? 13 : 16;
  const buttonTextSize = isUltraCompact ? 16 : 18;

  const versionLabel = `${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`;

  const handleGetStarted = () => {
    // Navigate to Email Verification Screen (for new user registration)
    navigation.navigate('EmailVerification');
  };

  const handleSignIn = () => {
    // Navigate to Login Screen (for existing users)
    navigation.navigate('Login');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.content}>
        {/* Header Section */}
        <View
          style={[
            styles.header,
            {
              paddingTop: headerPaddingTop,
              paddingBottom: headerPaddingBottom,
              paddingHorizontal: horizontalPad,
            },
          ]}>
          <View
            style={[
              styles.logoContainer,
              {
                width: logoSize,
                height: logoSize,
                borderRadius: logoSize / 2,
                marginBottom: logoMarginBottom,
              },
            ]}>
            <Text style={[styles.logoText, { fontSize: Math.round(logoSize * 0.5) }]}>E</Text>
          </View>
          <Text style={[styles.appName, { fontSize: appNameSize }]}>EliteHR</Text>
          <Text style={[styles.welcomeText, { fontSize: welcomeSize }]}>Welcome Back!</Text>
          <Text
            style={[
              styles.subtitle,
              {
                fontSize: subtitleSize,
                lineHeight: subtitleLineHeight,
                maxWidth: subtitleMaxWidth,
              },
            ]}
            numberOfLines={isUltraCompact ? 2 : 3}>
            Manage your work, track attendance, and request leaves all in one place
          </Text>
        </View>

        {/* Illustration Section */}
        <View
          style={[
            styles.illustrationContainer,
            { paddingVertical: illustrationPaddingVertical },
          ]}>
          <View
            style={[
              styles.illustrationCircle,
              {
                width: illustrationSize,
                height: illustrationSize,
                borderRadius: illustrationSize / 2,
              },
            ]}>
            <View
              style={[
                styles.illustrationInner,
                {
                  width: illustrationInnerSize,
                  height: illustrationInnerSize,
                  borderRadius: illustrationInnerSize / 2,
                },
              ]}>
              <Text style={[styles.illustrationIcon, { fontSize: illustrationIconSize }]}>👥</Text>
            </View>
          </View>
        </View>

        {/* Features List */}
        <View
          style={[
            styles.featuresContainer,
            {
              paddingHorizontal: horizontalPad,
              paddingVertical: featuresPaddingVertical,
              paddingBottom: featuresPaddingBottom,
            },
          ]}>
          <View style={[styles.featureItem, { marginBottom: featureRowGap }]}>
            <View
              style={[
                styles.featureIcon,
                {
                  width: featureIconSize,
                  height: featureIconSize,
                  borderRadius: featureIconSize / 2,
                  marginRight: isVeryCompact ? 12 : 16,
                },
              ]}>
              <Text style={[styles.featureIconText, { fontSize: featureIconTextSize }]}>✓</Text>
            </View>
            <Text style={[styles.featureText, { fontSize: featureTextSize }]}>
              Track your attendance
            </Text>
          </View>
          <View style={[styles.featureItem, { marginBottom: featureRowGap }]}>
            <View
              style={[
                styles.featureIcon,
                {
                  width: featureIconSize,
                  height: featureIconSize,
                  borderRadius: featureIconSize / 2,
                  marginRight: isVeryCompact ? 12 : 16,
                },
              ]}>
              <Text style={[styles.featureIconText, { fontSize: featureIconTextSize }]}>✓</Text>
            </View>
            <Text style={[styles.featureText, { fontSize: featureTextSize }]}>
              Request and manage leaves
            </Text>
          </View>
          <View style={[styles.featureItem, { marginBottom: featureRowGap }]}>
            <View
              style={[
                styles.featureIcon,
                {
                  width: featureIconSize,
                  height: featureIconSize,
                  borderRadius: featureIconSize / 2,
                  marginRight: isVeryCompact ? 12 : 16,
                },
              ]}>
              <Text style={[styles.featureIconText, { fontSize: featureIconTextSize }]}>✓</Text>
            </View>
            <Text style={[styles.featureText, { fontSize: featureTextSize }]}>
              View your profile and timesheets
            </Text>
          </View>
          <View style={[styles.featureItem, { marginBottom: 0 }]}>
            <View
              style={[
                styles.featureIcon,
                {
                  width: featureIconSize,
                  height: featureIconSize,
                  borderRadius: featureIconSize / 2,
                  marginRight: isVeryCompact ? 12 : 16,
                },
              ]}>
              <Text style={[styles.featureIconText, { fontSize: featureIconTextSize }]}>✓</Text>
            </View>
            <Text style={[styles.featureText, { fontSize: featureTextSize }]}>
              Manage your documents
            </Text>
          </View>
        </View>

        {/* Version (always under the options) */}
        <Text style={[styles.versionText, isUltraCompact && styles.versionTextUltraCompact]}>
          Version {versionLabel}
        </Text>
      </View>

      {/* Action Buttons - Fixed at bottom */}
      <View
        collapsable={false}
        onLayout={(e) => {
          const next = Math.ceil(e.nativeEvent.layout.height);
          setActionsHeight(next);
        }}
        style={[
          styles.actionsContainer,
          {
            paddingHorizontal: horizontalPad,
            paddingTop: actionsPaddingTop,
            paddingBottom: Math.max(insets.bottom, isUltraCompact ? 12 : 20),
          },
        ]}>
        <TouchableOpacity
          style={[styles.primaryButton, { paddingVertical: buttonPaddingVertical }]}
          onPress={handleGetStarted}
          activeOpacity={0.8}>
          <Text style={[styles.primaryButtonText, { fontSize: buttonTextSize }]}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { paddingVertical: buttonPaddingVertical }]}
          onPress={handleSignIn}
          activeOpacity={0.8}>
          <Text style={[styles.secondaryButtonText, { fontSize: buttonTextSize }]}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 10,
    letterSpacing: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    alignSelf: 'center',
    lineHeight: 24,
    marginTop: 8,
  },
  illustrationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 20 : 40,
  },
  illustrationCircle: {
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationCollapsed: {
    height: 6,
  },
  illustrationInner: {
    backgroundColor: '#bbdefb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationIcon: {
    fontSize: 80,
  },
  featuresContainer: {
    paddingVertical: 20,
    paddingBottom: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureIconText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 16,
    color: '#424242',
    flex: 1,
  },
  actionsContainer: {
    paddingTop: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: Platform.OS === 'ios' ? 0 : 1,
    borderTopColor: '#e0e0e0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9e9e9e',
    fontWeight: '600',
    marginBottom: 12,
  },
  versionTextUltraCompact: {
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#1a237e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#1a237e',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1a237e',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a237e',
    letterSpacing: 0.5,
  },
});

export default WelcomeScreen;

