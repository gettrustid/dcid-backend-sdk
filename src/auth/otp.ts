import { AxiosInstance } from "axios";
import {
  InitiateOTPOptions,
  InitiateOTPResponse,
  ConfirmOTPOptions,
  TokenResponse,
  RefreshTokenOptions,
} from "../types";

/**
 * Authentication module for OTP-based registration and sign-in
 */
export class AuthOTP {
  constructor(private httpClient: AxiosInstance) {}

  /**
   * Register-OTP: Initiates OTP registration/sign-in process
   *
   * This method covers the endpoint: POST /auth/sign-in/initiate
   *
   * It can be used for both:
   * - New user registration (creates user if doesn't exist)
   * - Existing user sign-in (sends OTP to existing user)
   *
   * @param options - Email or phone, plus optional tracking parameters
   * @returns Promise with OTP code (only in dev environment)
   *
   * @example
   * ```typescript
   * const result = await sdk.auth.registerOTP({ email: 'user@example.com' });
   * // In dev: result.otp contains the code
   * // In prod: OTP is sent via email/SMS
   * ```
   */
  async registerOTP(options: InitiateOTPOptions): Promise<InitiateOTPResponse> {
    if (!options.email && !options.phone) {
      throw new Error("Either email or phone must be provided");
    }

    const response = await this.httpClient.post<InitiateOTPResponse>(
      "/auth/sign-in/initiate",
      {
        email: options.email,
        phone: options.phone,
      }
    );

    return response.data;
  }

  /**
   * Register-OTP (Confirm): Confirms OTP and completes registration/sign-in
   *
   * This method covers the endpoint: POST /auth/sign-in/confirm
   *
   * After user receives OTP, call this method to verify and get access tokens.
   *
   * @param options - Email/phone and the OTP code
   * @returns Promise with access_token and refresh_token
   *
   * @example
   * ```typescript
   * const tokens = await sdk.auth.confirmOTP({
   *   email: 'user@example.com',
   *   otp: '123456'
   * });
   * // tokens.access_token - use for authenticated requests
   * // tokens.refresh_token - use to refresh access token
   * ```
   */
  async confirmOTP(options: ConfirmOTPOptions): Promise<TokenResponse> {
    if (!options.email && !options.phone) {
      throw new Error("Either email or phone must be provided");
    }
    if (!options.otp) {
      throw new Error("OTP code is required");
    }

    const response = await this.httpClient.post<TokenResponse>(
      "/auth/sign-in/confirm",
      {
        email: options.email,
        phone: options.phone,
        otp: options.otp,
      }
    );

    return response.data;
  }

  /**
   * Sign In-OTP: Admin OTP registration/sign-in initiation
   *
   * This method covers the endpoint: POST /auth/sign-in/initiate?type=admin
   *
   * Used for admin users to initiate OTP sign-in. Similar to registerOTP()
   * but includes the ?type=admin query parameter.
   *
   * After calling this, use confirmOTP() to complete the authentication.
   *
   * @param options - Email or phone, plus optional tracking parameters
   * @returns Promise with OTP code (only in dev environment)
   *
   * @example
   * ```typescript
   * // Step 1: Initiate admin OTP
   * const result = await sdk.auth.adminLogin({ email: 'admin@example.com' });
   * // In dev: result.otp contains the code
   *
   * // Step 2: Confirm OTP to get tokens
   * const tokens = await sdk.auth.confirmOTP({
   *   email: 'admin@example.com',
   *   otp: result.otp || '123456'
   * });
   * ```
   */
  async adminLogin(options: InitiateOTPOptions): Promise<InitiateOTPResponse> {
    if (!options.email && !options.phone) {
      throw new Error("Either email or phone must be provided");
    }

    const response = await this.httpClient.post<InitiateOTPResponse>(
      "/auth/sign-in/initiate?type=admin",
      {
        email: options.email,
        phone: options.phone,
      }
    );

    return response.data;
  }

  /**
   * Sign In-OTP (Refresh): Refreshes the access token using refresh token
   *
   * This method covers the endpoint: POST /auth/refresh-token
   *
   * Use this to get a new access token when the current one expires.
   *
   * @param options - Refresh token
   * @returns Promise with new access_token and refresh_token
   *
   * @example
   * ```typescript
   * const newTokens = await sdk.auth.refreshToken({
   *   refreshToken: 'your-refresh-token'
   * });
   * ```
   */
  async refreshToken(options: RefreshTokenOptions): Promise<TokenResponse> {
    if (!options.refreshToken) {
      throw new Error("Refresh token is required");
    }

    const response = await this.httpClient.post<TokenResponse>(
      "/auth/refresh-token",
      {
        refreshToken: options.refreshToken,
      }
    );

    return response.data;
  }
}
