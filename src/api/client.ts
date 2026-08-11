/**
 * API Client
 * Axios instance with interceptors for authentication and error handling
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../config/api';
import { tokenStorage, clearAllStorage } from '../utils/storage';
import { navigationRef } from '../utils/navigationRef';
import { useAuthStore } from '../store/authStore';
import { showToast } from '../utils/toast';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor - Add auth token, handle FormData, log requests
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // For FormData (e.g. photo upload), remove Content-Type so axios sets multipart boundary
      if (config.data instanceof FormData && config.headers) {
        delete config.headers['Content-Type'];
      }

      // Log request details (only in development, skip FormData body)
      if (__DEV__) {
        const logData =
          config.data instanceof FormData
            ? '[FormData]'
            : config.data;
        console.log('📤 API Request:', {
          method: config.method?.toUpperCase(),
          url: `${config.baseURL}${config.url}`,
          hasAuth: !!token,
          data: logData,
        });
      }
    } catch (error) {
      console.error('Error getting access token:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses (only in development)
    if (__DEV__) {
      console.log('✅ API Response:', {
        status: response.status,
        url: `${response.config.baseURL}${response.config.url}`,
        data: response.data,
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Log error responses (only in development)
    if (__DEV__) {
      console.error('❌ API Error Response:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: `${error.config?.baseURL}${error.config?.url}`,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      });
    }

    // Handle 401 Unauthorized - Try to refresh token
    // Only for authenticated endpoints (skip for auth endpoints like verify-email, login, etc.)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');

    // Handle 403 Forbidden - employment inactive / access revoked
    if (error.response?.status === 403 && !isAuthEndpoint) {
      const data: any = error.response?.data;
      const message: string =
        String(data?.message || data?.error || error.message || '').trim();
      const lower = message.toLowerCase();
      const looksLikeInactive =
        lower.includes('inactive') ||
        lower.includes('employment') ||
        lower.includes('not active') ||
        lower.includes('deactivated') ||
        lower.includes('disabled');

      if (looksLikeInactive) {
        try {
          useAuthStore.getState().setAuthNotice({
            title: 'Account inactive',
            message:
              message ||
              'Your account has been marked as inactive in the HR system, so you cannot use the app right now. Please contact your HR/admin team.',
          });
        } catch {
          // ignore
        }
        showToast.error(
          'Access blocked',
          message || 'Your account is inactive. Please contact HR.'
        );
        await handleLogout();
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        
        if (!refreshToken) {
          // No refresh token available - logout
          await handleLogout();
          return Promise.reject(error);
        }

        // Attempt to refresh the token
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refresh_token: refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          }
        );

        const { access_token, refresh_token: newRefreshToken } = response.data.data;

        // Store new tokens
        await tokenStorage.setAccessToken(access_token);
        if (newRefreshToken) {
          await tokenStorage.setRefreshToken(newRefreshToken);
        }

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        console.error('Token refresh failed:', refreshError);
        await handleLogout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Handle logout - Clear storage and navigate to login
 */
const handleLogout = async (): Promise<void> => {
  try {
    await clearAllStorage();
    try {
      useAuthStore.getState().logout();
    } catch {
      // ignore
    }
    
    // Navigate to login screen
    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    }
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

export default apiClient;

