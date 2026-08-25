/**
 * Team Working Today API
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../config/api';

export interface TeamWorkingTodayPlace {
  id: number;
  name: string;
}

export interface TeamWorkingTodayShift {
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  break_start_time?: string | null; // HH:mm
  break_end_time?: string | null; // HH:mm
}

export interface TeamWorkingTodayEmployee {
  employee_id: number;
  name: string;
  photo_url?: string | null;
  // Backend may return either a single place or multiple places for the employee
  place_of_work?: TeamWorkingTodayPlace | TeamWorkingTodayPlace[] | null;
  places_of_work?: TeamWorkingTodayPlace[] | null;
  shift: TeamWorkingTodayShift;
}

export interface TeamWorkingTodayResponse {
  success: boolean;
  data?: {
    date: string; // YYYY-MM-DD
    timezone: string;
    places: TeamWorkingTodayPlace[];
    on_shift_now: TeamWorkingTodayEmployee[];
    scheduled_later_today: TeamWorkingTodayEmployee[];
  };
  message?: string;
}

export interface GetTeamWorkingTodayParams {
  date?: string; // YYYY-MM-DD
  place_of_work_id?: number;
}

export const getTeamWorkingToday = async (
  params?: GetTeamWorkingTodayParams
): Promise<TeamWorkingTodayResponse> => {
  const response = await apiClient.get<TeamWorkingTodayResponse>(
    API_ENDPOINTS.ATTENDANCE.TEAM_WORKING_TODAY,
    { params }
  );
  return response.data;
};

