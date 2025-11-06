import { createHttpClient } from './utils/http';
import { AuthOTP } from './auth/otp';
import { TrustIdSDKConfig } from './types';

/**
 * Main TrustID PortalAPI SDK Client
 * 
 * This is the main entry point for using the SDK.
 * 
 * @example
 * ```typescript
 * import { TrustIdSDK } from '@trustid/portalapi-sdk';
 * 
 * const sdk = new TrustIdSDK({
 *   baseUrl: 'https://api.trustid.com'
 * });
 * 
 * // Register with OTP
 * await sdk.auth.registerOTP({ email: 'user@example.com' });
 * 
 * // Confirm OTP
 * const tokens = await sdk.auth.confirmOTP({
 *   email: 'user@example.com',
 *   otp: '123456'
 * });
 * ```
 */
export class TrustIdSDK {
  public readonly auth: AuthOTP;

  /**
   * Creates a new TrustID SDK instance
   * 
   * @param config - SDK configuration
   */
  constructor(config: TrustIdSDKConfig) {
    if (!config.baseUrl) {
      throw new Error('baseUrl is required in SDK configuration');
    }

    // Remove trailing slash from baseUrl
    const baseUrl = config.baseUrl.replace(/\/$/, '');

    // Create HTTP client
    const httpClient = createHttpClient(
      baseUrl,
      config.timeout,
      config.defaultHeaders
    );

    // Initialize modules
    this.auth = new AuthOTP(httpClient);
  }

  /**
   * Sets the authorization token for authenticated requests
   * 
   * @param token - JWT access token
   * 
   * @example
   * ```typescript
   * sdk.setAuthToken(tokens.access_token);
   * ```
   */
  setAuthToken(token: string): void {
    // This would be implemented if you add authenticated endpoints later
    // For now, the OTP endpoints don't require auth tokens
    // But you can store it for future use
    (this as any)._authToken = token;
  }

  /**
   * Gets the current authorization token
   */
  getAuthToken(): string | undefined {
    return (this as any)._authToken;
  }
}

