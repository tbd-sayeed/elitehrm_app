/**
 * Toast Utility
 * Helper functions for showing toast messages throughout the app
 */

import Toast from 'react-native-toast-message';

export const showToast = {
  /**
   * Show success toast
   */
  success: (message: string, subtitle?: string) => {
    Toast.show({
      type: 'success',
      text1: message,
      text2: subtitle,
      position: 'bottom',
      visibilityTime: 5000, // Increased from 3000
      text1Style: {
        color: '#1a1a1a', // Dark color for better readability
        fontWeight: '600',
      },
      text2Style: {
        color: '#424242', // Dark gray for subtitle
        fontWeight: '500',
      },
    });
  },

  /**
   * Show error toast
   */
  error: (message: string, subtitle?: string) => {
    Toast.show({
      type: 'error',
      text1: message,
      text2: subtitle,
      position: 'bottom',
      visibilityTime: 6000, // Increased from 4000
      text1Style: {
        color: '#1a1a1a', // Dark color for better readability
        fontWeight: '600',
      },
      text2Style: {
        color: '#424242', // Dark gray for subtitle
        fontWeight: '500',
      },
    });
  },

  /**
   * Show info toast
   */
  info: (message: string, subtitle?: string) => {
    Toast.show({
      type: 'info',
      text1: message,
      text2: subtitle,
      position: 'bottom',
      visibilityTime: 5000, // Increased from 3000
      text1Style: {
        color: '#1a1a1a', // Dark color for better readability
        fontWeight: '600',
      },
      text2Style: {
        color: '#424242', // Dark gray for subtitle
        fontWeight: '500',
      },
    });
  },

  /**
   * Show warning toast
   */
  warning: (message: string, subtitle?: string) => {
    Toast.show({
      type: 'info', // Toast library doesn't have warning type, using info
      text1: message,
      text2: subtitle,
      position: 'bottom',
      visibilityTime: 5000, // Increased from 3000
      text1Style: {
        color: '#1a1a1a', // Dark color for better readability
        fontWeight: '600',
      },
      text2Style: {
        color: '#424242', // Dark gray for subtitle
        fontWeight: '500',
      },
    });
  },
};

