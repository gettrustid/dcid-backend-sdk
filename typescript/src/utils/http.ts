import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import {
  TrustIdSDKError,
  NetworkError,
  AuthenticationError,
  ServerError,
  TokenResponse,
  ErrorContext,
} from "../types";
import { Logger, NoOpLogger } from "./logger";

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
 * Sanitizes headers by removing sensitive information
 */
function sanitizeHeaders(headers: any): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const sensitive = ["authorization", "x-api-key", "cookie", "x-api-key"];

  Object.keys(headers || {}).forEach((key) => {
    if (sensitive.includes(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = headers[key];
    }
  });

  return sanitized;
}

/**
 * Creates error context for debugging
 */
function createErrorContext(
  error: AxiosError,
  originalRequest?: InternalAxiosRequestConfig
): ErrorContext {
  const config = originalRequest || error.config;
  const isKrakend = isKrakendError(error);
  const requestId =
    error.response?.headers?.["x-request-id"] ||
    error.response?.headers?.["X-Request-ID"];

  return {
    url: config?.url,
    method: config?.method?.toUpperCase(),
    statusCode: error.response?.status,
    statusText: error.response?.statusText,
    responseHeaders: error.response?.headers,
    requestHeaders: sanitizeHeaders(config?.headers),
    timestamp: new Date().toISOString(),
    requestId: requestId as string | undefined,
    isKrakendError: isKrakend,
    errorSource: isKrakend
      ? "krakend"
      : error.response
      ? "backend"
      : "network",
  };
}

/**
 * Checks if error is from KrakenD gateway
 */
function isKrakendError(error: AxiosError): boolean {
  const headers = error.response?.headers;
  const responseData = error.response?.data as any;

  return !!(
    headers?.["x-krakend"] ||
    headers?.["X-Krakend"] ||
    headers?.["X-KrakenD"] ||
    responseData?.error?.toLowerCase().includes("api key") ||
    responseData?.error?.toLowerCase().includes("api-key") ||
    responseData?.message?.toLowerCase().includes("api key")
  );
}

/**
 * Checks if error is an API-KEY authentication error (from KrakenD)
 * Note: When KrakenD acts as a proxy (no-op mode), it still adds X-Krakend header
 * to backend responses, so we need to check the error message content first.
 */
function isApiKeyError(error: AxiosError): boolean {
  if (error.response?.status !== 401) return false;

  const responseData = error.response.data as any;
  const errorMessage = (
    responseData?.error ||
    responseData?.message ||
    ""
  ).toLowerCase();

  // First, check if it's a JWT/token error (backend authentication)
  // These keywords indicate JWT token issues, not API-KEY issues
  const jwtTokenKeywords = [
    "invalid token",
    "invalid signature",
    "token expired",
    "expired token",
    "jwt",
    "bearer",
    "unauthorized",
    "access denied",
    "token invalid",
    "malformed token",
  ];

  const isJwtTokenError = jwtTokenKeywords.some((keyword) =>
    errorMessage.includes(keyword)
  );

  // If it's a JWT token error, it's NOT an API-KEY error
  // (even if it has X-Krakend header from proxy mode)
  if (isJwtTokenError) return false;

  // Check if error message explicitly mentions API-KEY
  const apiKeyKeywords = [
    "api key",
    "api-key",
    "invalid api key",
    "missing api key",
    "api key required",
    "unauthorized: missing api key",
    "unauthorized: invalid api key",
  ];

  const hasApiKeyMessage = apiKeyKeywords.some((keyword) =>
    errorMessage.includes(keyword)
  );

  // If error message mentions API-KEY, it's an API-KEY error
  if (hasApiKeyMessage) return true;

  // If no specific error message, check if it's from KrakenD
  // (but only if it doesn't look like a token error)
  const isKrakend = isKrakendError(error);
  if (isKrakend && !isJwtTokenError) {
    // When KrakenD is in proxy mode, it adds X-Krakend header to all responses
    // So we need to be more careful - only treat as API-KEY error if:
    // 1. It's from KrakenD AND
    // 2. Error message is empty/generic (likely API-KEY validation failed before reaching backend)
    // 3. OR error message explicitly mentions API key
    return !errorMessage || hasApiKeyMessage;
  }

  return false;
}

/**
 * Checks if error is a backend connectivity error (KrakenD can't reach backend)
 */
function isBackendConnectivityError(error: AxiosError): boolean {
  if (!error.response) return false;

  const status = error.response.status;
  const isKrakend = isKrakendError(error);
  const responseData = error.response.data as any;

  if (!isKrakend) return false;

  // KrakenD returns 500/502/503 when backend is unreachable
  if (status !== 500 && status !== 502 && status !== 503) return false;

  const errorMessage = (
    responseData?.error ||
    responseData?.message ||
    ""
  ).toLowerCase();

  return !!(
    errorMessage.includes("backend") ||
    errorMessage.includes("connection") ||
    errorMessage.includes("unreachable") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("no response")
  );
}

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
 * @param logger - Optional logger instance for logging
 * @param enableRequestLogging - Enable request/response logging (default: false)
 */
export function createHttpClient(
  baseUrl: string,
  timeout: number = 30000,
  defaultHeaders?: Record<string, string>,
  getAuthToken?: () => string | undefined,
  getRefreshToken?: () => string | undefined,
  refreshTokenCallback?: TokenRefreshCallback,
  onTokenRefreshed?: (tokens: TokenResponse) => void,
  logger?: Logger,
  enableRequestLogging: boolean = false
): AxiosInstance {
  const log = logger || new NoOpLogger();
  const shouldLog = enableRequestLogging;

  const client = axios.create({
    baseURL: baseUrl,
    timeout,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...defaultHeaders,
    },
  });

  // Add request interceptor for authentication and logging
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Add auth token if available
      if (getAuthToken) {
        const token = getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      // Log request if enabled
      if (shouldLog) {
        log.debug("Outgoing API request", {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          headers: sanitizeHeaders(config.headers),
          data: config.data,
        });
      }

      return config;
    },
    (error: AxiosError) => {
      log.error("Request setup failed", { error: error.message });
      return Promise.reject(error);
    }
  );

  // Add response interceptor for error handling, token refresh, and logging
  client.interceptors.response.use(
    (response: AxiosResponse<unknown>) => {
      // Log successful response if enabled
      if (shouldLog) {
        log.debug("API request successful", {
          status: response.status,
          url: response.config.url,
          method: response.config.method?.toUpperCase(),
        });
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig;
      const context = createErrorContext(error, originalRequest);

      // Skip token refresh for refresh-token endpoint itself
      if (originalRequest?.url?.includes("/auth/refresh-token")) {
        const apiKeyError = isApiKeyError(error);
        if (apiKeyError) {
          const enhancedError = new AuthenticationError(
            "Invalid API-KEY. Please check your X-API-Key header.",
            true,
            error.response?.status,
            error.response?.data,
            context
          );
          log.error("API-KEY authentication failed", {
            error: enhancedError.message,
            context,
          });
          return Promise.reject(enhancedError);
        }
        return Promise.reject(error);
      }

      // Handle 401 Unauthorized with automatic token refresh
      // BUT skip if it's an API-KEY error (from KrakenD)
      if (
        error.response?.status === 401 &&
        !isApiKeyError(error) && // NEW: Skip retry for API-KEY errors
        originalRequest &&
        !originalRequest._retry &&
        getRefreshToken &&
        refreshTokenCallback &&
        onTokenRefreshed
      ) {
        originalRequest._retry = true;

        log.debug("Token expired, attempting automatic refresh", {
          url: originalRequest.url,
        });

        try {
          const refreshToken = getRefreshToken();

          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          // Use SDK's refreshToken method via callback
          const tokens = await refreshTokenCallback(refreshToken);

          // Update tokens via callback
          onTokenRefreshed(tokens);

          log.debug("Token refreshed successfully, retrying request", {
            url: originalRequest.url,
          });

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
          const retryResponse = await client.request(originalRequest);
          return retryResponse;
        } catch (refreshError: any) {
          log.error("Token refresh failed", {
            error: refreshError.message,
            url: originalRequest.url,
          });
          // If refresh fails, reject the error
          // The callback can handle token clearing if needed
          return Promise.reject(refreshError);
        }
      }

      // Transform Axios errors into SDK errors with proper classification
      if (error.response) {
        // Server responded with error status
        const responseData = error.response.data as any;
        let message =
          responseData?.message || error.message || "Request failed";

        const apiKeyError = isApiKeyError(error);
        const backendConnectivityError = isBackendConnectivityError(error);
        const isKrakend = isKrakendError(error);

        // Enhance error message based on error type
        if (apiKeyError) {
          message = "Invalid API-KEY. Please check your X-API-Key header.";
        } else if (backendConnectivityError) {
          message =
            "Backend server is unreachable. Please try again later or contact support.";
        } else if (isKrakend && error.response.status >= 500) {
          message = `Gateway error: ${message}`;
        }

        // Create appropriate error type
        let enhancedError: TrustIdSDKError;

        if (apiKeyError) {
          enhancedError = new AuthenticationError(
            message,
            true,
            error.response.status,
            responseData,
            context
          );
        } else if (
          backendConnectivityError ||
          (isKrakend && error.response.status >= 500)
        ) {
          enhancedError = new ServerError(
            message,
            backendConnectivityError,
            error.response.status,
            responseData,
            context
          );
        } else if (error.response.status === 401) {
          enhancedError = new AuthenticationError(
            message,
            false,
            error.response.status,
            responseData,
            context
          );
        } else if (error.response.status >= 500) {
          enhancedError = new ServerError(
            message,
            false,
            error.response.status,
            responseData,
            context
          );
        } else {
          enhancedError = new TrustIdSDKError(
            message,
            error.response.status,
            responseData,
            context
          );
        }

        // Log error
        log.error("API request failed", {
          error: enhancedError.message,
          statusCode: error.response.status,
          errorType: enhancedError.constructor.name,
          context,
        });

        throw enhancedError;
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

        const networkError = new NetworkError(
          errorMessage,
          error.code,
          context
        );

        log.error("Network error", {
          error: networkError.message,
          code: error.code,
          context,
        });

        throw networkError;
      } else {
        // Error setting up the request
        const setupError = new TrustIdSDKError(
          error.message || "Request setup failed",
          0,
          undefined,
          context
        );

        log.error("Request setup failed", {
          error: setupError.message,
          context,
        });

        throw setupError;
      }
    }
  );

  return client;
}
