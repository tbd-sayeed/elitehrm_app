/**
 * Storage Utilities
 * Helper functions for AsyncStorage operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  DASHBOARD_DATA: 'dashboard_data',
  DEVICE_NAME: 'device_name',
} as const;

/**
 * Token Storage
 */
export const tokenStorage = {
  /**
   * Store access token
   */
  setAccessToken: async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    } catch (error) {
      console.error('Error storing access token:', error);
      throw error;
    }
  },

  /**
   * Get access token
   */
  getAccessToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error retrieving access token:', error);
      return null;
    }
  },

  /**
   * Store refresh token
   */
  setRefreshToken: async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch (error) {
      console.error('Error storing refresh token:', error);
      throw error;
    }
  },

  /**
   * Get refresh token
   */
  getRefreshToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error retrieving refresh token:', error);
      return null;
    }
  },

  /**
   * Remove all tokens
   */
  clearTokens: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
      throw error;
    }
  },
};

/**
 * User Data Storage
 */
export const userStorage = {
  /**
   * Store user data
   */
  setUserData: async (userData: any): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing user data:', error);
      throw error;
    }
  },

  /**
   * Get user data
   */
  getUserData: async (): Promise<any | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  },

  /**
   * Clear user data
   */
  clearUserData: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw error;
    }
  },
};

/**
 * Dashboard Data Storage
 */
export const dashboardStorage = {
  setDashboardData: async (data: object): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DASHBOARD_DATA, JSON.stringify(data));
    } catch (error) {
      console.error('Error storing dashboard data:', error);
      throw error;
    }
  },

  getDashboardData: async (): Promise<object | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DASHBOARD_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving dashboard data:', error);
      return null;
    }
  },

  clearDashboardData: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.DASHBOARD_DATA);
    } catch (error) {
      console.error('Error clearing dashboard data:', error);
      throw error;
    }
  },
};

/**
 * Device Storage
 */
export const deviceStorage = {
  /**
   * Store device name
   */
  setDeviceName: async (deviceName: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_NAME, deviceName);
    } catch (error) {
      console.error('Error storing device name:', error);
      throw error;
    }
  },

  /**
   * Get device name
   */
  getDeviceName: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_NAME);
    } catch (error) {
      console.error('Error retrieving device name:', error);
      return null;
    }
  },
};

/**
 * Clear all app data (logout)
 */
export const clearAllStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.DASHBOARD_DATA,
      STORAGE_KEYS.DEVICE_NAME,
    ]);
  } catch (error) {
    console.error('Error clearing all storage:', error);
    throw error;
  }
};

