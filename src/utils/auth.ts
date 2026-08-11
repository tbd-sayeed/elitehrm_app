/**
 * Auth Utilities
 * Helper functions for authentication state management
 */

import { tokenStorage, userStorage, dashboardStorage } from './storage';
import { useAuthStore } from '../store/authStore';
import type { DashboardData } from '../store/authStore';
import { getProfile } from '../api/profile';
import { showToast } from './toast';
import { clearAllStorage } from './storage';
import { getInactiveReason } from './accountStatus';

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

      // Validate that the employee is still active on the server.
      // If employment is inactive, backend typically returns 403 via `employment.active` middleware.
      try {
        const profile = await getProfile();
        if (profile?.success && profile?.data) {
          const inactiveReason = getInactiveReason(profile.data as any);
          if (inactiveReason) {
            useAuthStore.getState().setAuthNotice({
              title: 'Account inactive',
              message:
                'Your account has been marked as inactive in the HR system, so you cannot use the app right now. Please contact your HR/admin team.',
            });
            showToast.error('Account inactive', 'Please contact HR.');
            await clearAllStorage();
            useAuthStore.getState().logout();
            return false;
          }
          // Keep local profile in sync with server (optional but useful).
          useAuthStore.getState().updateUser(profile.data as any);
        }
      } catch (e: any) {
        const status = e?.response?.status;
        const msg: string =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          'Session invalid';

        // 401/403 during restore means we should not keep the user logged in.
        if (status === 401 || status === 403) {
          if (status === 403) {
            showToast.error('Access blocked', msg || 'Your account is inactive. Please contact HR.');
          }
          await clearAllStorage();
          useAuthStore.getState().logout();
          return false;
        }
      }

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

