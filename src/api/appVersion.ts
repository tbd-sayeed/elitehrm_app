/**
 * App Version Policy API
 * Public endpoint: GET /api/v1/app-version
 */

import publicApiClient from './publicClient';
import { API_ENDPOINTS } from '../config/api';

export interface AppVersionPolicy {
  min_build_ios: number;
  latest_build_ios: number;
  min_build_android: number;
  latest_build_android: number;
  app_store_url: string;
  play_store_url: string;
}

export interface AppVersionResponse {
  success: boolean;
  data?: AppVersionPolicy;
  message?: string;
}

export const getAppVersionPolicy = async (): Promise<AppVersionResponse> => {
  const response = await publicApiClient.get<AppVersionResponse>(
    API_ENDPOINTS.PUBLIC.APP_VERSION
  );
  return response.data;
};

