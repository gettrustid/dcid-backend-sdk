import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { TrustIdSDKError } from '../types';

/**
 * Creates and configures an Axios instance for API requests
 */
export function createHttpClient(
  baseUrl: string,
  timeout: number = 30000,
  defaultHeaders?: Record<string, string>
): AxiosInstance {
  const client = axios.create({
    baseURL: baseUrl,
    timeout,
    headers: {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    },
  });

  // Add response interceptor for error handling
  client.interceptors.response.use(
    (response: AxiosResponse<unknown>) => response,
    (error: AxiosError) => {
      // Transform Axios errors into SDK errors
      if (error.response) {
        // Server responded with error status
        const message =
          (error.response.data as any)?.message ||
          error.message ||
          'Request failed';
        throw new TrustIdSDKError(
          message,
          error.response.status,
          error.response.data
        );
      } else if (error.request) {
        // Request was made but no response received
        throw new TrustIdSDKError(
          'No response received from server',
          0,
          error.request
        );
      } else {
        // Error setting up the request
        throw new TrustIdSDKError(
          error.message || 'Request setup failed',
          0
        );
      }
    }
  );

  return client;
}

