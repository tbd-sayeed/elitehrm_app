/**
 * Auth Utilities
 * Helper functions for authentication state management
 */

import { tokenStorage, userStorage, dashboardStorage } from './storage';
import { useAuthStore } from '../store/authStore';
import type { DashboardData } from '../store/authStore';

/**
 * Restore authentication state from storage
 * This should be called on app startup to check if user is already logged in
 */
export const restoreAuthState = async (): Promise<boolean> => {
  try {
    const accessToken = await tokenStorage.getAccessToken();
    const refreshToken = await tokenStorage.getRefreshToken();
    const userData = await userStorage.getUserData();
    const dashboardData = await dashboardStorage.getDashboardData();

    // If we have all required data, restore auth state
    if (accessToken && refreshToken && userData) {
      const { setAuth } = useAuthStore.getState();
      setAuth({
        user: userData,
        accessToken: accessToken,
        refreshToken: refreshToken,
        dashboardData: (dashboardData as DashboardData) || null,
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error restoring auth state:', error);
    return false;
  }
};

/**
 * Clear authentication state
 * This is called on logout
 */
export const clearAuthState = async (): Promise<void> => {
  try {
    const { logout } = useAuthStore.getState();
    logout();
    
    // Clear storage is handled by the logout function in storage utils
    // But we ensure the store is cleared here too
  } catch (error) {
    console.error('Error clearing auth state:', error);
  }
};

