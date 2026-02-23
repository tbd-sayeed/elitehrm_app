/**
 * Leave API Service
 * API calls for leave endpoints
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../config/api';

export interface LeaveBalanceItem {
  time_off_policy: {
    id: number;
    name: string;
  };
  total_days: number;
  used_days: number;
  remaining_days: number;
}

export interface LeaveBalancesResponse {
  success: boolean;
  data?: LeaveBalanceItem[];
}

/**
 * Get leave balances by policy
 */
export const getLeaveBalances = async (): Promise<LeaveBalancesResponse> => {
  const response = await apiClient.get<LeaveBalancesResponse>(
    API_ENDPOINTS.LEAVE.BALANCES
  );
  return response.data;
};

export interface LeaveListItem {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  time_off_policy?: {
    id: number;
    name: string;
  };
  approved_by?: { name: string };
  comments?: string;
  created_at?: string;
}

export interface LeaveListResponse {
  success: boolean;
  data?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    leaves?: LeaveListItem[];
  };
}

export interface GetLeaveListParams {
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
}

/**
 * Get leave requests list
 */
export const getLeaveList = async (
  params?: GetLeaveListParams
): Promise<LeaveListResponse> => {
  const response = await apiClient.get<LeaveListResponse>(
    API_ENDPOINTS.LEAVE.LIST,
    { params }
  );
  return response.data;
};

export interface CreateLeaveRequest {
  time_off_policy_id: number;
  leave_type?: string;
  start_date: string;
  end_date: string;
  comments?: string;
}

export interface CreateLeaveResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    leave_type: string;
    start_date: string;
    end_date: string;
    status: string;
    created_at?: string;
  };
}

export interface LeaveDetailItem {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  time_off_policy?: {
    id: number;
    name: string;
  };
  comments?: string;
  status_change_note?: string;
  approved_by?: { name: string };
  created_at?: string;
  updated_at?: string;
}

export interface LeaveDetailResponse {
  success: boolean;
  data?: LeaveDetailItem;
}

/**
 * Get leave request details
 */
export const getLeaveDetail = async (
  id: number | string
): Promise<LeaveDetailResponse> => {
  const response = await apiClient.get<LeaveDetailResponse>(
    API_ENDPOINTS.LEAVE.DETAIL(Number(id))
  );
  return response.data;
};

/**
 * Create leave request
 */
export const createLeaveRequest = async (
  data: CreateLeaveRequest
): Promise<CreateLeaveResponse> => {
  const response = await apiClient.post<CreateLeaveResponse>(
    API_ENDPOINTS.LEAVE.CREATE,
    {
      time_off_policy_id: data.time_off_policy_id,
      leave_type: data.leave_type ?? 'regular',
      start_date: data.start_date,
      end_date: data.end_date,
      comments: data.comments ?? undefined,
    }
  );
  return response.data;
};
