/**
 * Payslips API Service
 * Keeps last 3 months payslips for HMRC requirement
 */

import apiClient from './client';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { tokenStorage } from '../utils/storage';

export interface PayslipItem {
  id: number;
  payslip_month: string; // Y-m
  notes?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  created_at?: string | null;
  [key: string]: any;
}

export interface PayslipsListResponse {
  success: boolean;
  retention_note?: string;
  message?: string;
  data?: {
    items?: PayslipItem[];
    payslips?: PayslipItem[];
    retention_note?: string;
  } | PayslipItem[];
}

export interface PayslipUploadResponse {
  success: boolean;
  message?: string;
  data?: PayslipItem;
}

/**
 * List my payslips (last 3 months)
 */
export const listPayslips = async (): Promise<PayslipsListResponse> => {
  const response = await apiClient.get<PayslipsListResponse>(API_ENDPOINTS.PAYSLIPS.LIST);
  return response.data;
};

/**
 * Upload a payslip (multipart/form-data)
 * Fields: payslip_month (Y-m), file, optional notes
 * Uses fetch instead of axios for better FormData support on React Native.
 */
export const uploadPayslip = async (formData: FormData): Promise<PayslipUploadResponse> => {
  const token = await tokenStorage.getAccessToken();
  const url = `${API_BASE_URL}${API_ENDPOINTS.PAYSLIPS.UPLOAD}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  let data: PayslipUploadResponse;
  try {
    data = await response.json();
  } catch {
    data = {
      success: false,
      message: response.statusText || 'Upload failed',
    };
  }

  if (!response.ok) {
    const err = new Error(data.message || 'Upload failed');
    (err as any).response = { data };
    throw err;
  }

  return data;
};

/**
 * Delete a payslip
 */
export const deletePayslip = async (id: number): Promise<{ success: boolean; message?: string }> => {
  const response = await apiClient.delete<{ success: boolean; message?: string }>(
    API_ENDPOINTS.PAYSLIPS.DELETE(id)
  );
  return response.data;
};

export const getPayslipDownloadUrl = (id: number): string => {
  return `${API_BASE_URL}${API_ENDPOINTS.PAYSLIPS.DOWNLOAD(id)}`;
};

