/**
 * Auth Store
 * Zustand store for managing authentication state
 */

import { create } from 'zustand';

export interface PlaceOfWork {
  id: number;
  name: string;
  address?: string | null;
  city?: string | null;
  postcode?: string | null;
  country?: string | null;
  is_active: boolean;
}

export interface EmergencyContact {
  full_name: string;
  phone: string;
  relation: string;
}

export interface EmployeeDocument {
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

export interface EmployeeDocumentCategory {
  id: number;
  name: string;
  description?: string | null;
  has_document: boolean;
  documents_count: number;
  soonest_expires_on: string | null;
  soonest_expires_in_days: number | null;
}

export interface EmployeeDocumentsData {
  items: EmployeeDocument[];
  count: number;
  expired_count: number;
  expiring_within_30_days_count: number;
}

export interface EmployeeDocumentCategoriesData {
  items: EmployeeDocumentCategory[];
  count: number;
  missing_count: number;
  missing_items: EmployeeDocumentCategory[];
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  photo_url?: string | null;
  company?: {
    id: number;
    name: string;
  };
  positions?: Array<{
    id: number;
    name: string;
    description?: string | null;
  }>;
  places_of_work?: PlaceOfWork[];
  emergency_contact?: EmergencyContact | null;
  documents?: EmployeeDocumentsData;
  document_categories?: EmployeeDocumentCategoriesData;
  [key: string]: any; // Allow additional fields
}

export interface WorkingPatternDay {
  day: string;
  is_working_day: boolean;
  work_start_time: string | null;
  work_end_time: string | null;
  break_start_time: string | null;
  break_end_time: string | null;
}

export interface WorkingPattern {
  id: number;
  name: string;
  total_hours: number;
  pattern_length: number;
  days: WorkingPatternDay[];
}

export interface WorkingPatternsData {
  current: WorkingPattern | null;
  items?: WorkingPattern[];
  count?: number;
}

export interface DashboardData {
  workingPatterns?: WorkingPatternsData;
  leaveStatistics?: {
    summary: {
      total_allowed: number;
      total_taken: number;
      total_remaining: number;
      year: string;
    };
    by_policy: Array<{
      time_off_policy_id: number;
      policy_name: string;
      total_allowed: number;
      days_taken: number;
      days_remaining: number;
    }>;
  };
  latestTimesheet?: {
    id: number;
    period_code: string;
    start_date: string;
    end_date: string;
    status: string;
    total_hours: string;
    contract_hours: string;
    overtime_hours: string;
  };
  lastAttendance?: {
    date: string;
    day: string;
    checkin: string | null;
    checkout: string | null;
    break: string | null;
    total_hours: string;
    status: string;
    public_holiday_name: string | null;
  };
  publicHolidays?: {
    year: string;
    holidays: Array<{
      id: number;
      name: string;
      date: string;
      day: string;
      repeat_yearly: boolean;
    }>;
    count: number;
  };
}

interface AuthState {
  // State
  isAuthenticated: boolean;
  user: Employee | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  dashboardData: DashboardData | null;

  // Actions
  setAuth: (data: {
    user: Employee;
    accessToken: string;
    refreshToken: string;
    dashboardData?: DashboardData;
  }) => void;
  updateUser: (user: Partial<Employee>) => void;
  setDashboardData: (data: DashboardData) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  dashboardData: null,

  // Set authentication data
  setAuth: (data) =>
    set({
      isAuthenticated: true,
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      dashboardData: data.dashboardData || null,
      isLoading: false,
    }),

  // Update user data
  updateUser: (userData) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    })),

  // Set dashboard data
  setDashboardData: (data) =>
    set({
      dashboardData: data,
    }),

  // Set loading state
  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),

  // Logout - Clear all auth state
  logout: () =>
    set({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      dashboardData: null,
    }),
}));

