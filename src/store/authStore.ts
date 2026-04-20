/**
 * Auth Store
 * Zustand store for managing authentication state
 */

import { create } from 'zustand';
import { userStorage } from '../utils/storage';

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

export interface EmployeeDocument {
  id: number;
  name: string;
  description?: string | null;
  category: { id: number; name: string };
  start_date: string | null;
  end_date: string | null;
  validity_date: string | null;
  expires_on: string | null;
  expires_in_days: number | null;
  is_expired: boolean;
  expiry_source?: string;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  file_url?: string | null;
  download_url?: string | null;
  permission?: any;
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
  bank_details?: BankDetails | null;
  gp_information?: GpInformation | null;
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
    leave_year?: {
      home_card_period_line?: string | null;
      home_card_period_detail?: string | null;
      balances_screen_title?: string | null;
      label?: string | null;
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
  photoCacheKey: number;

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
  photoCacheKey: 0,

  // Set authentication data
  setAuth: (data) =>
    set(() => {
      // Persist user for auto-login restore
      void userStorage.setUserData(data.user);
      return {
      isAuthenticated: true,
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      dashboardData: data.dashboardData || null,
      isLoading: false,
      // Bust avatar cache on app start/login so updated images show after relaunch.
      photoCacheKey: data.user?.photo_url ? Date.now() : 0,
      };
    }),

  // Update user data
  updateUser: (userData) =>
    set((state) => {
      const nextUser = state.user ? { ...state.user, ...userData } : null;
      if (nextUser) {
        // Keep storage in sync so auto-login restores latest user (e.g., updated photo_url).
        void userStorage.setUserData(nextUser);
      }
      const shouldBumpPhotoCache =
        state.user &&
        Object.prototype.hasOwnProperty.call(userData, 'photo_url') &&
        typeof (userData as any).photo_url === 'string' &&
        (userData as any).photo_url.length > 0;

      return {
        user: nextUser,
        photoCacheKey: shouldBumpPhotoCache ? Date.now() : state.photoCacheKey,
      };
    }),

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
      photoCacheKey: 0,
    }),
}));

