/**
 * Splash Screen - First screen shown when app launches
 * @format
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuthStore } from '../../store/authStore';

const { width, height } = Dimensions.get('window');

type SplashNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SplashNavigationProp>();
  const { isAuthenticated } = useAuthStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate based on auth state after 2.5 seconds
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigation.replace('Main');
      } else {
        navigation.replace('Auth');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation, isAuthenticated]);

  const logoRotation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a237e" />
      
      {/* Background Gradient Effect */}
      <View style={styles.backgroundGradient}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
      </View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}>
        {/* Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ rotate: logoRotation }],
            },
          ]}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>E</Text>
          </View>
        </Animated.View>

        {/* App Name */}
        <Text style={styles.appName}>EliteHR</Text>
        <Text style={styles.tagline}>Employee Management System</Text>
      </Animated.View>

      {/* Loading Indicator */}
      <Animated.View
        style={[
          styles.loadingContainer,
          {
            opacity: fadeAnim,
          },
        ]}>
        <View style={styles.loadingDot} />
        <View style={[styles.loadingDot, styles.loadingDotDelay1]} />
        <View style={[styles.loadingDot, styles.loadingDotDelay2]} />
      </Animated.View>

      {/* Footer */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
            paddingBottom: insets.bottom + 20,
          },
        ]}>
        <Text style={styles.footerText}>© 2026 EliteHR. All rights reserved.</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -width * 0.5,
    left: -width * 0.25,
  },
  circle2: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    bottom: -width * 0.3,
    right: -width * 0.2,
  },
  circle3: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    top: height * 0.3,
    right: -width * 0.1,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '300',
    letterSpacing: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    marginTop: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    marginHorizontal: 5,
  },
  loadingDotDelay1: {
    opacity: 0.6,
  },
  loadingDotDelay2: {
    opacity: 0.3,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default SplashScreen;

