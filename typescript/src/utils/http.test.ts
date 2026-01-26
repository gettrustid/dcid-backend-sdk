import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import {
  AuthenticationError,
  NetworkError,
  ServerError,
  DCIDServerSDKError,
} from "../types";

// Mock axios at module level
vi.mock("axios", () => {
  const mockInstance = {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    request: vi.fn(),
  };
  return {
    default: { create: vi.fn(() => mockInstance) },
  };
});

import axios from "axios";
import { createHttpClient } from "./http";

/**
 * Helper to capture interceptor callbacks from a created HTTP client.
 */
function getInterceptors() {
  const client = (axios.create as any)();

  const requestUse = client.interceptors.request.use as ReturnType<typeof vi.fn>;
  const responseUse = client.interceptors.response.use as ReturnType<typeof vi.fn>;

  const [reqFulfilled, reqRejected] = requestUse.mock.calls[
    requestUse.mock.calls.length - 1
  ] || [undefined, undefined];

  const [resFulfilled, resRejected] = responseUse.mock.calls[
    responseUse.mock.calls.length - 1
  ] || [undefined, undefined];

  return { reqFulfilled, reqRejected, resFulfilled, resRejected, client };
}

function makeAxiosError(opts: {
  status?: number;
  data?: any;
  headers?: Record<string, string>;
  code?: string;
  message?: string;
  hasResponse?: boolean;
  hasRequest?: boolean;
  configUrl?: string;
}): AxiosError {
  const error: any = new Error(opts.message || "Request failed");
  error.isAxiosError = true;
  error.code = opts.code;
  error.config = {
    url: opts.configUrl || "/test",
    method: "post",
    headers: { "Content-Type": "application/json" },
    _retry: false,
  } as any;

  if (opts.hasResponse !== false && opts.status !== undefined) {
    error.response = {
      status: opts.status,
      statusText: opts.status === 401 ? "Unauthorized" : "Error",
      data: opts.data || {},
      headers: opts.headers || {},
      config: error.config,
    };
  } else if (opts.hasResponse === false && opts.hasRequest !== false) {
    error.response = undefined;
    error.request = {};
  } else {
    error.response = undefined;
    error.request = undefined;
  }

  return error as AxiosError;
}

describe("createHttpClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call axios.create with correct config", () => {
    createHttpClient("https://api.test.com", 5000, { "X-API-Key": "key123" });

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: "https://api.test.com",
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Key": "key123",
      },
    });
  });

  it("should use default timeout of 30000", () => {
    createHttpClient("https://api.test.com");

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({ timeout: 30000 })
    );
  });

  it("should register request and response interceptors", () => {
    createHttpClient("https://api.test.com");
    const client = (axios.create as any)();

    expect(client.interceptors.request.use).toHaveBeenCalled();
    expect(client.interceptors.response.use).toHaveBeenCalled();
  });
});

describe("request interceptor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should add Bearer token when getAuthToken returns a token", () => {
    const getAuthToken = () => "my-token";
    createHttpClient(
      "https://api.test.com",
      30000,
      undefined,
      getAuthToken
    );

    const { reqFulfilled } = getInterceptors();
    const config = {
      headers: {} as any,
      method: "get",
      url: "/test",
    } as InternalAxiosRequestConfig;

    const result = reqFulfilled(config);
    expect(result.headers.Authorization).toBe("Bearer my-token");
  });

  it("should not add Authorization header when getAuthToken is undefined", () => {
    createHttpClient("https://api.test.com");

    const { reqFulfilled } = getInterceptors();
    const config = {
      headers: {} as any,
      method: "get",
      url: "/test",
    } as InternalAxiosRequestConfig;

    const result = reqFulfilled(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it("should not add Authorization header when token is undefined", () => {
    const getAuthToken = () => undefined;
    createHttpClient(
      "https://api.test.com",
      30000,
      undefined,
      getAuthToken
    );

    const { reqFulfilled } = getInterceptors();
    const config = {
      headers: {} as any,
    } as InternalAxiosRequestConfig;

    const result = reqFulfilled(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it("should reject on request setup error", async () => {
    createHttpClient("https://api.test.com");

    const { reqRejected } = getInterceptors();
    const error = new Error("setup fail") as AxiosError;

    await expect(reqRejected(error)).rejects.toEqual(error);
  });
});

describe("response interceptor — error classification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw AuthenticationError for API-KEY error (KrakenD 401 with api key message)", async () => {
    createHttpClient("https://api.test.com");
    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      status: 401,
      data: { error: "Invalid API Key" },
      headers: { "x-krakend": "true" },
    });

    await expect(resRejected(error)).rejects.toThrow(AuthenticationError);
    await expect(resRejected(error)).rejects.toThrow(
      "Invalid API-KEY. Please check your X-API-Key header."
    );
  });

  it("should set isApiKeyError=true for API-KEY errors", async () => {
    createHttpClient("https://api.test.com");
    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      status: 401,
      data: { error: "Invalid API Key" },
      headers: { "x-krakend": "true" },
    });

    try {
      await resRejected(error);
    } catch (e: any) {
      expect(e).toBeInstanceOf(AuthenticationError);
      expect(e.isApiKeyError).toBe(true);
    }
  });

  it("should throw AuthenticationError for 401 JWT token error", async () => {
    createHttpClient("https://api.test.com");
    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      status: 401,
      data: { message: "invalid token" },
    });

    await expect(resRejected(error)).rejects.toThrow(AuthenticationError);
    try {
      await resRejected(error);
    } catch (e: any) {
      expect(e.isApiKeyError).toBe(false);
    }
  });

  it("should throw ServerError for backend connectivity error", async () => {
    createHttpClient("https://api.test.com");
    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      status: 502,
      data: { error: "backend connection refused" },
      headers: { "x-krakend": "true" },
    });

    await expect(resRejected(error)).rejects.toThrow(ServerError);
    try {
      await resRejected(error);
    } catch (e: any) {
      expect(e.isBackendConnectivityError).toBe(true);
    }
  });

  it("should throw ServerError for KrakenD 500 errors", async () => {
    createHttpClient("https://api.test.com");
    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      status: 500,
      data: { message: "Internal error" },
      headers: { "x-krakend": "true" },
    });

    await expect(resRejected(error)).rejects.toThrow(ServerError);
  });

  it("should throw ServerError for non-KrakenD 500 errors", async () => {
    createHttpClient("https://api.test.com");
    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      status: 500,
      data: { message: "Internal server error" },
    });

    await expect(resRejected(error)).rejects.toThrow(ServerError);
  });

  it("should throw DCIDServerSDKError for generic 4xx errors", async () => {
    createHttpClient("https://api.test.com");
    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      status: 400,
      data: { message: "Bad request" },
    });

    await expect(resRejected(error)).rejects.toThrow(DCIDServerSDKError);
  });

  it("should throw NetworkError for ECONNREFUSED", async () => {
    createHttpClient("https://api.test.com");
    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      code: "ECONNREFUSED",
      message: "connect ECONNREFUSED",
      hasResponse: false,
    });

    await expect(resRejected(error)).rejects.toThrow(NetworkError);
    await expect(resRejected(error)).rejects.toThrow(
      "Connection refused"
    );
  });

  it("should throw NetworkError for ETIMEDOUT", async () => {
    createHttpClient("https://api.test.com");
    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      code: "ETIMEDOUT",
      message: "timeout",
      hasResponse: false,
    });

    await expect(resRejected(error)).rejects.toThrow(NetworkError);
    await expect(resRejected(error)).rejects.toThrow("Request timeout");
  });

  it("should throw NetworkError for ENOTFOUND", async () => {
    createHttpClient("https://api.test.com");
    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      code: "ENOTFOUND",
      message: "getaddrinfo ENOTFOUND",
      hasResponse: false,
    });

    await expect(resRejected(error)).rejects.toThrow(NetworkError);
    await expect(resRejected(error)).rejects.toThrow("DNS lookup failed");
  });

  it("should throw NetworkError for SSL cert errors", async () => {
    createHttpClient("https://api.test.com");
    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      code: "CERT_HAS_EXPIRED",
      message: "certificate has expired",
      hasResponse: false,
    });

    await expect(resRejected(error)).rejects.toThrow(NetworkError);
    await expect(resRejected(error)).rejects.toThrow("SSL certificate error");
  });

  it("should throw DCIDServerSDKError for request setup errors (no request, no response)", async () => {
    createHttpClient("https://api.test.com");
    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      message: "Something broke",
      hasResponse: false,
      hasRequest: false,
    });

    await expect(resRejected(error)).rejects.toThrow(DCIDServerSDKError);
    await expect(resRejected(error)).rejects.toThrow("Something broke");
  });

  it("should pass response through on success", async () => {
    createHttpClient("https://api.test.com");
    const { resFulfilled } = getInterceptors();

    const response = { status: 200, data: { ok: true } } as AxiosResponse;
    const result = resFulfilled(response);
    expect(result).toEqual(response);
  });
});

describe("response interceptor — 401 auto-refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should attempt token refresh on 401 (non-API-KEY) when callbacks provided", async () => {
    const getAuthToken = () => "expired-token";
    const getRefreshToken = () => "refresh-token";
    const refreshCallback = vi.fn().mockResolvedValue({
      access_token: "new-token",
      refresh_token: "new-refresh",
    });
    const onTokenRefreshed = vi.fn();

    createHttpClient(
      "https://api.test.com",
      30000,
      undefined,
      getAuthToken,
      getRefreshToken,
      refreshCallback,
      onTokenRefreshed
    );

    const { resRejected, client } = getInterceptors();
    (client.request as any).mockResolvedValue({ data: { success: true } });

    const error = makeAxiosError({
      status: 401,
      data: { message: "token expired" },
    });

    const result = await resRejected(error);

    expect(refreshCallback).toHaveBeenCalledWith("refresh-token");
    expect(onTokenRefreshed).toHaveBeenCalledWith({
      access_token: "new-token",
      refresh_token: "new-refresh",
    });
    expect(client.request).toHaveBeenCalled();
    expect(result).toEqual({ data: { success: true } });
  });

  it("should not retry if already retried (_retry=true)", async () => {
    const getAuthToken = () => "token";
    const getRefreshToken = () => "refresh";
    const refreshCallback = vi.fn();
    const onTokenRefreshed = vi.fn();

    createHttpClient(
      "https://api.test.com",
      30000,
      undefined,
      getAuthToken,
      getRefreshToken,
      refreshCallback,
      onTokenRefreshed
    );

    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      status: 401,
      data: { message: "unauthorized" },
    });
    (error.config as any)._retry = true;

    await expect(resRejected(error)).rejects.toThrow(AuthenticationError);
    expect(refreshCallback).not.toHaveBeenCalled();
  });

  it("should not retry for API-KEY errors even on 401", async () => {
    const getAuthToken = () => "token";
    const getRefreshToken = () => "refresh";
    const refreshCallback = vi.fn();
    const onTokenRefreshed = vi.fn();

    createHttpClient(
      "https://api.test.com",
      30000,
      undefined,
      getAuthToken,
      getRefreshToken,
      refreshCallback,
      onTokenRefreshed
    );

    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      status: 401,
      data: { error: "invalid api key" },
      headers: { "x-krakend": "true" },
    });

    await expect(resRejected(error)).rejects.toThrow(AuthenticationError);
    expect(refreshCallback).not.toHaveBeenCalled();
  });

  it("should reject if refresh token is not available", async () => {
    const getAuthToken = () => "token";
    const getRefreshToken = () => undefined;
    const refreshCallback = vi.fn();
    const onTokenRefreshed = vi.fn();

    createHttpClient(
      "https://api.test.com",
      30000,
      undefined,
      getAuthToken,
      getRefreshToken,
      refreshCallback,
      onTokenRefreshed
    );

    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      status: 401,
      data: { message: "token expired" },
    });

    await expect(resRejected(error)).rejects.toThrow(
      "No refresh token available"
    );
  });

  it("should reject if refresh callback fails", async () => {
    const getAuthToken = () => "token";
    const getRefreshToken = () => "refresh";
    const refreshCallback = vi.fn().mockRejectedValue(new Error("Refresh failed"));
    const onTokenRefreshed = vi.fn();

    createHttpClient(
      "https://api.test.com",
      30000,
      undefined,
      getAuthToken,
      getRefreshToken,
      refreshCallback,
      onTokenRefreshed
    );

    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      status: 401,
      data: { message: "token expired" },
    });

    await expect(resRejected(error)).rejects.toThrow("Refresh failed");
  });

  it("should skip token refresh for /auth/refresh-token endpoint", async () => {
    const getAuthToken = () => "token";
    const getRefreshToken = () => "refresh";
    const refreshCallback = vi.fn();
    const onTokenRefreshed = vi.fn();

    createHttpClient(
      "https://api.test.com",
      30000,
      undefined,
      getAuthToken,
      getRefreshToken,
      refreshCallback,
      onTokenRefreshed
    );

    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      status: 401,
      data: { message: "unauthorized" },
      configUrl: "/auth/refresh-token",
    });

    await expect(resRejected(error)).rejects.toBeDefined();
    expect(refreshCallback).not.toHaveBeenCalled();
  });

  it("should throw AuthenticationError for API-KEY error on refresh-token endpoint", async () => {
    createHttpClient("https://api.test.com");

    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      status: 401,
      data: { error: "Invalid API Key" },
      headers: { "x-krakend": "true" },
      configUrl: "/auth/refresh-token",
    });

    await expect(resRejected(error)).rejects.toThrow(AuthenticationError);
    try {
      await resRejected(error);
    } catch (e: any) {
      expect(e.isApiKeyError).toBe(true);
    }
  });
});

describe("response interceptor — KrakenD detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should detect KrakenD via x-krakend header", async () => {
    createHttpClient("https://api.test.com");
    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      status: 401,
      data: {},
      headers: { "x-krakend": "true" },
    });

    try {
      await resRejected(error);
    } catch (e: any) {
      expect(e).toBeInstanceOf(AuthenticationError);
      expect(e.isApiKeyError).toBe(true);
    }
  });

  it("should detect KrakenD via error message containing 'api key'", async () => {
    createHttpClient("https://api.test.com");
    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      status: 401,
      data: { error: "Missing API Key" },
    });

    try {
      await resRejected(error);
    } catch (e: any) {
      expect(e).toBeInstanceOf(AuthenticationError);
      expect(e.isApiKeyError).toBe(true);
    }
  });

  it("should NOT treat JWT token errors as API-KEY errors even with KrakenD header", async () => {
    createHttpClient("https://api.test.com");
    const { resRejected } = getInterceptors();

    const error = makeAxiosError({
      status: 401,
      data: { message: "invalid token" },
      headers: { "x-krakend": "true" },
    });

    try {
      await resRejected(error);
    } catch (e: any) {
      expect(e).toBeInstanceOf(AuthenticationError);
      expect(e.isApiKeyError).toBe(false);
    }
  });
});
