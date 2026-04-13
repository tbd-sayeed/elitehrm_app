/**
 * Bank & GP Details API Service
 * Authenticated: /api/v1/employee/bank-gp-details
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../config/api';

export interface BankDetails {
  account_holder_name: string | null;
  sort_code: string | null;
  account_number: string | null;
  bank_name: string | null;
}

export interface GpInformation {
  gp_name: string | null;
  address: string | null;
  telephone: string | null;
  medical_information: string | null;
}

export interface BankGpDetailsResponse {
  success: boolean;
  data?: {
    bank_details: BankDetails | null;
    gp_information: GpInformation | null;
  };
  message?: string;
}

export interface UpdateBankGpDetailsRequest {
  bank_details?: Partial<BankDetails> | Record<string, never>;
  gp_information?: Partial<GpInformation> | Record<string, never>;
}

export const getBankGpDetails = async (): Promise<BankGpDetailsResponse> => {
  const response = await apiClient.get<BankGpDetailsResponse>(
    API_ENDPOINTS.BANK_GP.DETAILS
  );
  return response.data;
};

export const updateBankGpDetails = async (
  payload: UpdateBankGpDetailsRequest
): Promise<BankGpDetailsResponse> => {
  const response = await apiClient.put<BankGpDetailsResponse>(
    API_ENDPOINTS.BANK_GP.DETAILS,
    payload
  );
  return response.data;
};

