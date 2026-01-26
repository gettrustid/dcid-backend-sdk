import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AxiosInstance } from "axios";
import {
  MOCK_ACCESS_TOKEN,
  MOCK_REFRESH_TOKEN,
  MOCK_TOKEN_RESPONSE,
} from "./__test-utils__/mock-tokens";

// Mock createHttpClient so SDK construction doesn't make real HTTP clients
vi.mock("./utils/http", () => {
  const createMock = (): AxiosInstance =>
    ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      request: vi.fn(),
      defaults: { headers: { common: {} } },
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
      },
    } as unknown as AxiosInstance);

  return {
    createHttpClient: vi.fn(() => createMock()),
  };
});

import { DCIDServerSDK } from "./client";
import { createHttpClient } from "./utils/http";

describe("DCIDServerSDK", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create SDK with valid apiKey", () => {
      const sdk = new DCIDServerSDK({ apiKey: "test-key" });
      expect(sdk).toBeDefined();
      expect(sdk.auth).toBeDefined();
      expect(sdk.identity).toBeDefined();
      expect(sdk.analytics).toBeDefined();
    });

    it("should throw if apiKey is missing", () => {
      expect(() => new DCIDServerSDK({ apiKey: "" })).toThrow(
        "apiKey is required in SDK configuration"
      );
    });

    it("should throw if apiKey is not provided", () => {
      expect(() => new DCIDServerSDK({} as any)).toThrow(
        "apiKey is required in SDK configuration"
      );
    });

    it("should default to prod environment", () => {
      new DCIDServerSDK({ apiKey: "test-key" });

      // First call is the unauthenticated client (auth module)
      const firstCall = (createHttpClient as any).mock.calls[0];
      expect(firstCall[0]).toBe("https://gateway.trustid.life/api");
      expect(firstCall[2]).toEqual(
        expect.objectContaining({ "X-API-Key": "test-key" })
      );
    });

    it("should use dev environment when specified", () => {
      new DCIDServerSDK({ apiKey: "test-key", environment: "dev" });

      const firstCall = (createHttpClient as any).mock.calls[0];
      expect(firstCall[0]).toBe(
        "http://krakend.dev-external.trustid.life/api"
      );
    });

    it("should use custom timeout", () => {
      new DCIDServerSDK({ apiKey: "test-key", timeout: 5000 });

      const firstCall = (createHttpClient as any).mock.calls[0];
      expect(firstCall[1]).toBe(5000);
    });

    it("should merge custom headers with X-API-Key", () => {
      new DCIDServerSDK({
        apiKey: "test-key",
        defaultHeaders: { "X-Custom": "value" },
      });

      const firstCall = (createHttpClient as any).mock.calls[0];
      expect(firstCall[2]).toEqual(
        expect.objectContaining({
          "X-API-Key": "test-key",
          "X-Custom": "value",
        })
      );
    });

    it("should create unauthenticated client for auth module (no token getters)", () => {
      new DCIDServerSDK({ apiKey: "test-key" });

      // First call — unauthenticated (auth module)
      const firstCall = (createHttpClient as any).mock.calls[0];
      expect(firstCall[3]).toBeUndefined(); // getAuthToken
      expect(firstCall[4]).toBeUndefined(); // getRefreshToken
      expect(firstCall[5]).toBeUndefined(); // refreshTokenCallback
      expect(firstCall[6]).toBeUndefined(); // onTokenRefreshed
    });

    it("should create authenticated client for identity modules (with token getters)", () => {
      new DCIDServerSDK({ apiKey: "test-key" });

      // Second call — authenticated (identity modules)
      const secondCall = (createHttpClient as any).mock.calls[1];
      expect(typeof secondCall[3]).toBe("function"); // getAuthToken
      expect(typeof secondCall[4]).toBe("function"); // getRefreshToken
      expect(typeof secondCall[5]).toBe("function"); // refreshTokenCallback
      expect(typeof secondCall[6]).toBe("function"); // onTokenRefreshed
    });

    it("should create analytics client with empty baseUrl", () => {
      new DCIDServerSDK({ apiKey: "test-key" });

      // Third call — analytics client
      const thirdCall = (createHttpClient as any).mock.calls[2];
      expect(thirdCall[0]).toBe(""); // empty baseUrl
    });

    it("should initialize all identity submodules", () => {
      const sdk = new DCIDServerSDK({ apiKey: "test-key" });

      expect(sdk.identity.encryption).toBeDefined();
      expect(sdk.identity.issuer).toBeDefined();
      expect(sdk.identity.ipfs).toBeDefined();
      expect(sdk.identity.verification).toBeDefined();
    });
  });

  describe("token management", () => {
    let sdk: DCIDServerSDK;

    beforeEach(() => {
      sdk = new DCIDServerSDK({ apiKey: "test-key" });
    });

    it("should start with no tokens", () => {
      expect(sdk.getAuthToken()).toBeUndefined();
      expect(sdk.getRefreshToken()).toBeUndefined();
    });

    it("should set and get auth token", () => {
      sdk.setAuthToken(MOCK_ACCESS_TOKEN);
      expect(sdk.getAuthToken()).toBe(MOCK_ACCESS_TOKEN);
    });

    it("should set and get refresh token", () => {
      sdk.setRefreshToken(MOCK_REFRESH_TOKEN);
      expect(sdk.getRefreshToken()).toBe(MOCK_REFRESH_TOKEN);
    });

    it("should set both tokens via setTokens", () => {
      sdk.setTokens(MOCK_TOKEN_RESPONSE);
      expect(sdk.getAuthToken()).toBe(MOCK_ACCESS_TOKEN);
      expect(sdk.getRefreshToken()).toBe(MOCK_REFRESH_TOKEN);
    });

    it("should overwrite existing tokens", () => {
      sdk.setTokens(MOCK_TOKEN_RESPONSE);
      sdk.setAuthToken("new-auth-token");
      expect(sdk.getAuthToken()).toBe("new-auth-token");
      expect(sdk.getRefreshToken()).toBe(MOCK_REFRESH_TOKEN);
    });
  });

  describe("confirmOTP auto-sets tokens", () => {
    it("should auto-set tokens after confirmOTP via onTokensReceived callback", async () => {
      const sdk = new DCIDServerSDK({ apiKey: "test-key" });

      // The first createHttpClient call returns the auth module's HTTP client.
      // We need to get the mock instance used by AuthOTP.
      // Since createHttpClient is mocked, the AuthOTP got a mock http client.
      // Let's invoke confirmOTP and verify tokens are set.
      const mockHttpClient = (createHttpClient as any).mock.results[0].value;
      (mockHttpClient.post as any).mockResolvedValue({
        data: MOCK_TOKEN_RESPONSE,
      });

      await sdk.auth.confirmOTP({
        email: "user@test.com",
        otp: "123456",
      });

      expect(sdk.getAuthToken()).toBe(MOCK_ACCESS_TOKEN);
      expect(sdk.getRefreshToken()).toBe(MOCK_REFRESH_TOKEN);
    });
  });

  describe("enableRequestLogging", () => {
    it("should enable logging by default in dev", () => {
      new DCIDServerSDK({ apiKey: "test-key", environment: "dev" });

      const firstCall = (createHttpClient as any).mock.calls[0];
      // Last arg is enableRequestLogging
      expect(firstCall[8]).toBe(true);
    });

    it("should disable logging by default in prod", () => {
      new DCIDServerSDK({ apiKey: "test-key", environment: "prod" });

      const firstCall = (createHttpClient as any).mock.calls[0];
      expect(firstCall[8]).toBe(false);
    });

    it("should respect explicit enableRequestLogging override", () => {
      new DCIDServerSDK({
        apiKey: "test-key",
        environment: "prod",
        enableRequestLogging: true,
      });

      const firstCall = (createHttpClient as any).mock.calls[0];
      expect(firstCall[8]).toBe(true);
    });
  });
});
