/**
 * Authentication API Service
 * API calls for authentication endpoints
 */

import apiClient from './client';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';

export interface VerifyEmailRequest {
  email: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    expires_in: number;
  };
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    verified: boolean;
    requires_password_setup: boolean;
  };
}

export interface SetPasswordRequest {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
}

export interface SetPasswordResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  device_name?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_at: string;
    refresh_expires_at: string;
    employee: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      photo_url?: string | null;
      company?: {
        id: number;
        name: string;
      };
      positions?: Array<{ id: number; name: string; description?: string | null }>;
      employment_type?: { id: number; name: string };
      places_of_work?: Array<{
        id: number;
        name: string;
        address?: string | null;
        city?: string | null;
        postcode?: string | null;
        country?: string | null;
        is_active: boolean;
      }>;
      emergency_contact?: {
        full_name: string;
        phone: string;
        relation: string;
      } | null;
    };
    working_patterns?: {
      current: {
        id: number;
        name: string;
        total_hours: number;
        pattern_length: number;
        days: Array<{
          day: string;
          is_working_day: boolean;
          work_start_time: string | null;
          work_end_time: string | null;
          break_start_time: string | null;
          break_end_time: string | null;
        }>;
      };
      items?: unknown[];
      count?: number;
    };
    leave_statistics?: unknown;
    latest_timesheet?: unknown;
    last_attendance?: unknown;
    public_holidays?: unknown;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    expires_in: number;
  };
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_at: string;
    refresh_expires_at: string;
  };
}

/**
 * Send email verification code
 */
export const verifyEmail = async (
  data: VerifyEmailRequest
): Promise<VerifyEmailResponse> => {
  const fullURL = `${API_BASE_URL}${API_ENDPOINTS.AUTH.VERIFY_EMAIL}`;
  console.log('🔐 verifyEmail API call:', {
    endpoint: API_ENDPOINTS.AUTH.VERIFY_EMAIL,
    baseURL: API_BASE_URL,
    fullURL: fullURL,
    data: data,
  });
  
  try {
    const response = await apiClient.post<VerifyEmailResponse>(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      data
    );
    console.log('✅ verifyEmail success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ verifyEmail error:', error);
    throw error;
  }
};

/**
 * Verify email code
 */
export const verifyCode = async (
  data: VerifyCodeRequest
): Promise<VerifyCodeResponse> => {
  const response = await apiClient.post<VerifyCodeResponse>(
    API_ENDPOINTS.AUTH.VERIFY_CODE,
    data
  );
  return response.data;
};

/**
 * Set password (first time)
 */
export const setPassword = async (
  data: SetPasswordRequest
): Promise<SetPasswordResponse> => {
  const response = await apiClient.post<SetPasswordResponse>(
    API_ENDPOINTS.AUTH.SET_PASSWORD,
    data
  );
  return response.data;
};

/**
 * Login
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>(
    API_ENDPOINTS.AUTH.LOGIN,
    data
  );
  return response.data;
};

/**
 * Logout
 */
export const logout = async (): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    API_ENDPOINTS.AUTH.LOGOUT
  );
  return response.data;
};

/**
 * Logout from all devices
 */
export const logoutAll = async (): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    API_ENDPOINTS.AUTH.LOGOUT_ALL
  );
  return response.data;
};

/**
 * Forgot password
 */
export const forgotPassword = async (
  data: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> => {
  const response = await apiClient.post<ForgotPasswordResponse>(
    API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
    data
  );
  return response.data;
};

/**
 * Reset password
 */
export const resetPassword = async (
  data: ResetPasswordRequest
): Promise<ResetPasswordResponse> => {
  const response = await apiClient.post<ResetPasswordResponse>(
    API_ENDPOINTS.AUTH.RESET_PASSWORD,
    data
  );
  return response.data;
};

/**
 * Refresh access token
 */
export const refreshToken = async (
  data: RefreshTokenRequest
): Promise<RefreshTokenResponse> => {
  const response = await apiClient.post<RefreshTokenResponse>(
    API_ENDPOINTS.AUTH.REFRESH_TOKEN,
    data
  );
  return response.data;
};

