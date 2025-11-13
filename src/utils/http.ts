import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { TrustIdSDKError, TokenResponse } from "../types";

// Extend Axios config to include _retry flag
declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

/**
 * Callback function type for token refresh
 * This callback should use the SDK's refreshToken method
 */
export type TokenRefreshCallback = (
  refreshToken: string
) => Promise<TokenResponse>;

/**
 * Creates and configures an Axios instance for API requests
 *
 * @param baseUrl - Base URL for API requests
 * @param timeout - Request timeout in milliseconds
 * @param defaultHeaders - Optional default headers
 * @param getAuthToken - Optional function to get auth token for authenticated requests
 * @param getRefreshToken - Optional function to get refresh token for token refresh
 * @param refreshTokenCallback - Optional callback to refresh token (should use SDK's refreshToken method)
 * @param onTokenRefreshed - Optional callback to handle token refresh result
 */
export function createHttpClient(
  baseUrl: string,
  timeout: number = 30000,
  defaultHeaders?: Record<string, string>,
  getAuthToken?: () => string | undefined,
  getRefreshToken?: () => string | undefined,
  refreshTokenCallback?: TokenRefreshCallback,
  onTokenRefreshed?: (tokens: TokenResponse) => void
): AxiosInstance {
  const client = axios.create({
    baseURL: baseUrl,
    timeout,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...defaultHeaders,
    },
  });

  // Add request interceptor for authentication
  if (getAuthToken) {
    client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );
  }

  // Add response interceptor for error handling and token refresh
  client.interceptors.response.use(
    (response: AxiosResponse<unknown>) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig;

      // Skip token refresh for refresh-token endpoint itself
      if (originalRequest?.url?.includes("/auth/refresh-token")) {
        return Promise.reject(error);
      }

      // Handle 401 Unauthorized with automatic token refresh
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        getRefreshToken &&
        refreshTokenCallback &&
        onTokenRefreshed
      ) {
        originalRequest._retry = true;

        try {
          const refreshToken = getRefreshToken();

          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          // Use SDK's refreshToken method via callback
          const tokens = await refreshTokenCallback(refreshToken);

          // Update tokens via callback
          onTokenRefreshed(tokens);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
          const retryResponse = await client.request(originalRequest);
          return retryResponse;
        } catch (refreshError: any) {
          // If refresh fails, reject the error
          // The callback can handle token clearing if needed
          return Promise.reject(refreshError);
        }
      }

      // Transform Axios errors into SDK errors
      if (error.response) {
        // Server responded with error status
        const message =
          (error.response.data as any)?.message ||
          error.message ||
          "Request failed";
        throw new TrustIdSDKError(
          message,
          error.response.status,
          error.response.data
        );
      } else if (error.request) {
        // Request was made but no response received
        // This can happen due to network issues, SSL problems, or timeouts
        const errorMessage =
          error.code === "ECONNREFUSED"
            ? "Connection refused - server may be down or unreachable"
            : error.code === "ETIMEDOUT"
            ? "Request timeout - server took too long to respond"
            : error.code === "ENOTFOUND"
            ? "DNS lookup failed - hostname not found"
            : error.code === "CERT_HAS_EXPIRED" ||
              error.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
            ? `SSL certificate error: ${error.message}`
            : `No response received from server: ${
                error.message || error.code || "Unknown error"
              }`;
        throw new TrustIdSDKError(errorMessage, 0, {
          originalError: error.message,
          code: error.code,
          request: error.request,
        });
      } else {
        // Error setting up the request
        throw new TrustIdSDKError(error.message || "Request setup failed", 0);
      }
    }
  );

  return client;
}
