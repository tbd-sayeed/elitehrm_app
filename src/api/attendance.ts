/**
 * Attendance API Service
 * API calls for attendance/timesheet endpoints
 */

import apiClient from './client';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

export interface AttendanceTimesheetSummary {
  id: number;
  period_code: string;
  status: string;
  start_date?: string;
  end_date?: string;
  total_hours?: string;
  contract_hours?: string;
  overtime_hours?: string;
  download_pdf_url?: string | null;
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

export interface TimesheetListItem {
  id: number;
  period_code: string; // e.g. M08-2026
  month_key: string; // YYYY-MM
  start_date: string; // Y-m-d
  end_date: string; // Y-m-d
  total_hours: string; // e.g. 107h:00m (HR web format)
  contract_hours: string; // e.g. 107h:00m
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | string;
  attendance_month: string; // YYYY-MM
  attendance_url?: string;
  can_view_attendance?: boolean;
  download_pdf_url?: string | null;
  can_download_pdf?: boolean;
}

export interface TimesheetsListResponse {
  success: boolean;
  data?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    items?: TimesheetListItem[];
  };
  message?: string;
}

export interface GetTimesheetsParams {
  year?: number | string;
  status?: string; // draft|submitted|approved|rejected
  page?: number;
  per_page?: number;
}

export const getTimesheets = async (
  params?: GetTimesheetsParams
): Promise<TimesheetsListResponse> => {
  const response = await apiClient.get<TimesheetsListResponse>(
    API_ENDPOINTS.ATTENDANCE.TIMESHEETS,
    { params }
  );
  return response.data;
};

export const getTimesheetDownloadPdfUrl = (id: number | string): string => {
  return `${API_BASE_URL}${API_ENDPOINTS.ATTENDANCE.TIMESHEET_DOWNLOAD_PDF(Number(id))}`;
};

