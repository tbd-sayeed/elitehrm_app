/**
 * API Configuration
 * Base URL and timeout settings for API requests
 *
 * Local development (fix "Network Error" / ERR_NETWORK):
 * 1. Start your Laravel API, e.g. from the project root:
 *    php artisan serve --host=0.0.0.0
 * 2. iOS Simulator: uses localhost:8000
 * 3. Android Emulator: uses 10.0.2.2:8000 (host machine's localhost)
 * 4. Physical device: set API_BASE_URL_OVERRIDE below to your computer's IP, e.g. http://192.168.1.100:8000/api/v1/employee
 *
 * Laravel must listen on 0.0.0.0 for the Android emulator to reach it.
 */

import { Platform } from 'react-native';

/** Override to use live backend. Set undefined to use localhost (10.0.2.2:8000 on Android). */
const API_BASE_URL_OVERRIDE: string | undefined = undefined;

const getBaseURL = (): string => {
  if (API_BASE_URL_OVERRIDE) {
    return API_BASE_URL_OVERRIDE;
  }
  if (__DEV__) {
    if (Platform.OS === 'android') {
      //return 'http://10.0.2.2:8000/api/v1/employee';
      return 'https://hrm.elitementors.org.uk/api/v1/employee';
    }
    return 'http://localhost:8000/api/v1/employee';
  }
  return 'https://hrm.elitementors.org.uk/api/v1/employee';
};

export const API_BASE_URL = getBaseURL();

export const API_TIMEOUT = 30000; // 30 seconds

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    VERIFY_EMAIL: '/auth/verify-email',
    VERIFY_CODE: '/auth/verify-code',
    SET_PASSWORD: '/auth/set-password',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    LOGOUT_ALL: '/auth/logout-all',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    REFRESH_TOKEN: '/auth/refresh-token',
  },
  // Profile
  PROFILE: {
    GET: '/profile',
    UPDATE: '/profile',
  },
  // Attendance
  ATTENDANCE: {
    LIST: '/attendance',
    CURRENT_TIMESHEET: '/attendance/current-timesheet',
  },
  // Leave
  LEAVE: {
    LIST: '/leaves',
    DETAIL: (id: number) => `/leaves/${id}`,
    CREATE: '/leaves',
    BALANCES: '/leaves/balances',
  },
  // Documents
  DOCUMENTS: {
    LIST: '/documents',
    UPLOAD: '/documents',
    DOWNLOAD: (id: number) => `/documents/${id}/download`,
  },
} as const;

