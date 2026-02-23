/**
 * Documents API Service
 * List, upload and download employee documents
 */

import apiClient from './client';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { tokenStorage } from '../utils/storage';

export interface DocumentCategory {
  id: number;
  name: string;
  description?: string | null;
  has_document: boolean;
  documents_count: number;
  soonest_expires_on: string | null;
  soonest_expires_in_days: number | null;
}

export interface DocumentItem {
  id: number;
  name: string;
  category: { id: number; name: string };
  start_date: string | null;
  end_date: string | null;
  validity_date: string | null;
  expires_on: string | null;
  expires_in_days: number | null;
  is_expired: boolean;
  expiry_source?: string;
}

export interface DocumentsListResponse {
  success: boolean;
  data?: {
    items: DocumentItem[];
    count: number;
    expired_count?: number;
    expiring_within_30_days_count?: number;
  };
}

export interface DocumentUploadResponse {
  success: boolean;
  message: string;
  data?: DocumentItem;
}

/** Max file size 5MB */
export const DOCUMENT_MAX_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * List my documents
 */
export const listDocuments = async (): Promise<DocumentsListResponse> => {
  const response = await apiClient.get<DocumentsListResponse>(API_ENDPOINTS.DOCUMENTS.LIST);
  return response.data;
};

/**
 * Upload a document (multipart/form-data)
 * Fields: category_id (required), file (required), name, description, validity_date, start_date, end_date
 * Uses fetch instead of axios for better FormData support on React Native (same approach as profile photo upload).
 */
export const uploadDocument = async (
  formData: FormData,
  _onUploadProgress?: (progress: number) => void
): Promise<DocumentUploadResponse> => {
  const token = await tokenStorage.getAccessToken();
  const url = `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.UPLOAD}`;

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

  let data: DocumentUploadResponse;
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
 * Get download URL for a document (returns blob/redirect; use with token in header for direct download)
 */
export const getDocumentDownloadUrl = (documentId: number): string => {
  return `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.DOWNLOAD(documentId)}`;
};
