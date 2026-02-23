/**
 * Attendance API Service
 * API calls for attendance/timesheet endpoints
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../config/api';

export interface AttendanceTimesheetSummary {
  id: number;
  period_code: string;
  status: string;
  start_date?: string;
  end_date?: string;
  total_hours?: string;
  contract_hours?: string;
  overtime_hours?: string;
}

export interface AttendanceEntryApi {
  id: number;
  date: string; // Y-m-d
  day?: string; // e.g. Tue
  start_time?: string | null;
  finish_time?: string | null;
  break_duration?: string | null; // decimal hours string, e.g. "0.50"
  total_hours?: string | null; // decimal hours string, e.g. "3.50"
  contract_hours?: string | null;
  difference?: string | null; // decimal hours string, may include sign
  is_leave?: boolean;
  is_public_holiday?: boolean;
  leave_type?: string | null;
  public_holiday_name?: string | null;
  timesheet?: AttendanceTimesheetSummary;
  [key: string]: any;
}

export interface GetAttendanceParams {
  start_date?: string; // Y-m-d
  end_date?: string; // Y-m-d
  month?: string; // Y-m
  page?: number;
  per_page?: number;
}

export interface AttendanceListResponse {
  success: boolean;
  data?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    entries?: AttendanceEntryApi[];
  };
  message?: string;
}

export const getAttendance = async (
  params?: GetAttendanceParams
): Promise<AttendanceListResponse> => {
  const response = await apiClient.get<AttendanceListResponse>(
    API_ENDPOINTS.ATTENDANCE.LIST,
    { params }
  );
  return response.data;
};

export interface CurrentTimesheetResponse {
  success: boolean;
  data?: {
    timesheet?: AttendanceTimesheetSummary;
    entries?: AttendanceEntryApi[];
  };
  message?: string;
}

export const getCurrentTimesheet = async (): Promise<CurrentTimesheetResponse> => {
  const response = await apiClient.get<CurrentTimesheetResponse>(
    API_ENDPOINTS.ATTENDANCE.CURRENT_TIMESHEET
  );
  return response.data;
};

