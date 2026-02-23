/**
 * Profile API Service
 * API calls for profile endpoints
 */

import apiClient from './client';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { tokenStorage } from '../utils/storage';

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  home_phone?: string;
  mobile_phone?: string;
  emergency_contact_full_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  nationality?: string;
}

export interface ProfileResponse {
  success: boolean;
  data?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    home_phone?: string;
    mobile_phone?: string;
    emergency_contact?: {
      full_name: string;
      phone: string;
      relation: string;
    };
    photo_url?: string | null;
    date_of_birth?: string;
    gender?: string;
    marital_status?: string;
    address?: string;
    city?: string;
    postcode?: string;
    country?: string;
    nationality?: string;
    company?: { id: number; name: string };
  };
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data?: ProfileResponse['data'];
}

/**
 * Get employee profile
 */
export const getProfile = async (): Promise<ProfileResponse> => {
  const response = await apiClient.get<ProfileResponse>(API_ENDPOINTS.PROFILE.GET);
  return response.data;
};

/**
 * Update employee profile
 * API expects: gender (male|female|other|prefer_not_to_say), marital_status (single|married|divorced|widowed|separated)
 */
export const updateProfile = async (
  data: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
  const payload = { ...data };

  // Convert gender/marital_status to lowercase for API
  if (payload.gender) {
    payload.gender = payload.gender.toLowerCase();
  }
  if (payload.marital_status) {
    payload.marital_status = payload.marital_status.toLowerCase();
  }

  const response = await apiClient.put<UpdateProfileResponse>(
    API_ENDPOINTS.PROFILE.UPDATE,
    payload
  );
  return response.data;
};

export interface UpdateProfilePhotoRequest {
  uri: string;
  type?: string;
  fileName?: string;
}

/**
 * Update profile photo
 * Sends multipart/form-data with photo file (max 5MB)
 * Uses fetch instead of axios for better FormData support on React Native
 */
export const updateProfilePhoto = async (
  file: UpdateProfilePhotoRequest
): Promise<UpdateProfileResponse> => {
  const formData = new FormData();
  formData.append('photo', {
    uri: file.uri,
    type: file.type || 'image/jpeg',
    name: file.fileName || 'photo.jpg',
  } as any);

  const token = await tokenStorage.getAccessToken();
  const url = `${API_BASE_URL}${API_ENDPOINTS.PROFILE.UPDATE}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: formData,
  });

  let data: UpdateProfileResponse;
  try {
    data = await response.json();
  } catch {
    data = {
      success: false,
      message: response.statusText || 'Failed to update photo',
    };
  }

  if (!response.ok) {
    const err = new Error(data.message || 'Failed to update photo');
    (err as any).response = { data };
    throw err;
  }

  return data;
};
