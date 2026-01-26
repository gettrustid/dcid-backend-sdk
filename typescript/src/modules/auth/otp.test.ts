import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthOTP } from "./otp";
import { createMockAxios } from "../../__test-utils__/mock-axios";
import { MOCK_TOKEN_RESPONSE } from "../../__test-utils__/mock-tokens";
import type { AxiosInstance } from "axios";

describe("AuthOTP", () => {
  let mockAxios: AxiosInstance;
  let auth: AuthOTP;
  let onTokensReceived: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockAxios = createMockAxios();
    onTokensReceived = vi.fn();
    auth = new AuthOTP(mockAxios, onTokensReceived);
  });

  describe("registerOTP", () => {
    it("should POST to /auth/sign-in/initiate with email", async () => {
      (mockAxios.post as any).mockResolvedValue({ data: { otp: "123456" } });

      const result = await auth.registerOTP({ email: "user@test.com" });

      expect(mockAxios.post).toHaveBeenCalledWith("/auth/sign-in/initiate", {
        email: "user@test.com",
        phone: undefined,
      });
      expect(result).toEqual({ otp: "123456" });
    });

    it("should POST with phone", async () => {
      (mockAxios.post as any).mockResolvedValue({ data: {} });

      await auth.registerOTP({ phone: "+1234567890" });

      expect(mockAxios.post).toHaveBeenCalledWith("/auth/sign-in/initiate", {
        email: undefined,
        phone: "+1234567890",
      });
    });

    it("should throw if neither email nor phone provided", async () => {
      await expect(auth.registerOTP({})).rejects.toThrow(
        "Either email or phone must be provided"
      );
    });

    it("should propagate HTTP errors", async () => {
      (mockAxios.post as any).mockRejectedValue(new Error("Network error"));

      await expect(
        auth.registerOTP({ email: "user@test.com" })
      ).rejects.toThrow("Network error");
    });
  });

  describe("confirmOTP", () => {
    it("should POST to /auth/sign-in/confirm and return tokens", async () => {
      (mockAxios.post as any).mockResolvedValue({
        data: MOCK_TOKEN_RESPONSE,
      });

      const result = await auth.confirmOTP({
        email: "user@test.com",
        otp: "123456",
      });

      expect(mockAxios.post).toHaveBeenCalledWith("/auth/sign-in/confirm", {
        email: "user@test.com",
        phone: undefined,
        otp: "123456",
      });
      expect(result).toEqual(MOCK_TOKEN_RESPONSE);
    });

    it("should call onTokensReceived callback after confirmation", async () => {
      (mockAxios.post as any).mockResolvedValue({
        data: MOCK_TOKEN_RESPONSE,
      });

      await auth.confirmOTP({ email: "user@test.com", otp: "123456" });

      expect(onTokensReceived).toHaveBeenCalledWith(MOCK_TOKEN_RESPONSE);
    });

    it("should work without onTokensReceived callback", async () => {
      const authNoCallback = new AuthOTP(mockAxios);
      (mockAxios.post as any).mockResolvedValue({
        data: MOCK_TOKEN_RESPONSE,
      });

      const result = await authNoCallback.confirmOTP({
        email: "user@test.com",
        otp: "123456",
      });

      expect(result).toEqual(MOCK_TOKEN_RESPONSE);
    });

    it("should throw if neither email nor phone provided", async () => {
      await expect(auth.confirmOTP({ otp: "123456" } as any)).rejects.toThrow(
        "Either email or phone must be provided"
      );
    });

    it("should throw if OTP is missing", async () => {
      await expect(
        auth.confirmOTP({ email: "user@test.com", otp: "" })
      ).rejects.toThrow("OTP code is required");
    });

    it("should support phone-based confirmation", async () => {
      (mockAxios.post as any).mockResolvedValue({
        data: MOCK_TOKEN_RESPONSE,
      });

      await auth.confirmOTP({ phone: "+1234567890", otp: "123456" });

      expect(mockAxios.post).toHaveBeenCalledWith("/auth/sign-in/confirm", {
        email: undefined,
        phone: "+1234567890",
        otp: "123456",
      });
    });
  });

  describe("adminLogin", () => {
    it("should POST to /auth/sign-in/initiate?type=admin", async () => {
      (mockAxios.post as any).mockResolvedValue({ data: { otp: "654321" } });

      const result = await auth.adminLogin({ email: "admin@test.com" });

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/auth/sign-in/initiate?type=admin",
        { email: "admin@test.com", phone: undefined }
      );
      expect(result).toEqual({ otp: "654321" });
    });

    it("should throw if neither email nor phone provided", async () => {
      await expect(auth.adminLogin({})).rejects.toThrow(
        "Either email or phone must be provided"
      );
    });
  });

  describe("refreshToken", () => {
    it("should POST to /auth/refresh-token", async () => {
      (mockAxios.post as any).mockResolvedValue({
        data: MOCK_TOKEN_RESPONSE,
      });

      const result = await auth.refreshToken({
        refreshToken: "some-refresh-token",
      });

      expect(mockAxios.post).toHaveBeenCalledWith("/auth/refresh-token", {
        refreshToken: "some-refresh-token",
      });
      expect(result).toEqual(MOCK_TOKEN_RESPONSE);
    });

    it("should throw if refreshToken is missing", async () => {
      await expect(
        auth.refreshToken({ refreshToken: "" })
      ).rejects.toThrow("Refresh token is required");
    });
  });
});
