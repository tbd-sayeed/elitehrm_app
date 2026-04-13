/**
 * Public API Client (no auth)
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_PUBLIC_BASE_URL, API_TIMEOUT } from '../config/api';

const publicApiClient: AxiosInstance = axios.create({
  baseURL: API_PUBLIC_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

publicApiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log('✅ Public API Response:', {
        status: response.status,
        url: `${response.config.baseURL}${response.config.url}`,
        data: response.data,
      });
    }
    return response;
  },
  (error: AxiosError) => {
    if (__DEV__) {
      console.error('❌ Public API Error Response:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: `${error.config?.baseURL}${error.config?.url}`,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      });
    }
    return Promise.reject(error);
  }
);

export default publicApiClient;

