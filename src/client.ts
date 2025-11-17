import { createHttpClient } from "./utils/http";
import { AuthOTP } from "./auth/otp";
import { KeyManager } from "./modules/encryption";
import { Analytics } from "./modules/analytics";
import { TrustIdSDKConfig, TokenResponse } from "./types";

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
 *
 * // Set tokens for authenticated requests (includes automatic refresh)
 * sdk.setTokens(tokens);
 *
 * // Generate encryption key (will auto-refresh token if expired)
 * await sdk.encryption.generateKey({
 *   did: 'did:iden3:trustid:main:...',
 *   ownerEmail: 'user@example.com'
 * });
 * 
 * // Track analytics events (if sgtmProxyBaseUrl is configured)
 * if (sdk.analytics) {
 *   // Start a session
 *   const session = await sdk.analytics.startSession({
 *     user_id?: string;
 *     anonymous_id?: string;
 *     page_location?: string;
 *     page_title?: string;
 *     timestamp?: number;
 *     engagement_time_msec?: number;
 *     device_type?: string;
 *   });
 * }
 * ```
 */
export class TrustIdSDK {
  public readonly auth: AuthOTP;
  public readonly encryption: KeyManager;
  public readonly analytics?: Analytics;

  private _authToken?: string;
  private _refreshToken?: string;
  private _baseUrl: string;

  /**
   * Creates a new TrustID SDK instance
   *
   * @param config - SDK configuration
   */
  constructor(config: TrustIdSDKConfig) {
    if (!config.baseUrl) {
      throw new Error("baseUrl is required in SDK configuration");
    }

    // Remove trailing slash from baseUrl
    this._baseUrl = config.baseUrl.replace(/\/$/, "");

    // Create getter functions for tokens
    const getAuthToken = () => this._authToken;
    const getRefreshToken = () => this._refreshToken;

    // Create HTTP client for unauthenticated requests (auth module)
    const httpClient = createHttpClient(
      this._baseUrl,
      config.timeout,
      config.defaultHeaders
    );

    // Initialize auth module first (needed for refresh callback)
    this.auth = new AuthOTP(httpClient);

    // Callback to refresh token using SDK's refreshToken method
    const refreshTokenCallback = async (
      refreshToken: string
    ): Promise<TokenResponse> => {
      return await this.auth.refreshToken({ refreshToken });
    };

    // Callback to handle token refresh result
    const onTokenRefreshed = (tokens: TokenResponse) => {
      this._authToken = tokens.access_token;
      this._refreshToken = tokens.refresh_token;
    };

    // Create HTTP client for authenticated requests (encryption module)
    // This client will automatically refresh tokens on 401 errors using SDK's refreshToken method
    const authenticatedHttpClient = createHttpClient(
      this._baseUrl,
      config.timeout,
      config.defaultHeaders,
      getAuthToken,
      getRefreshToken,
      refreshTokenCallback,
      onTokenRefreshed
    );

    // Initialize encryption module
    this.encryption = new KeyManager(authenticatedHttpClient);

    // Initialize analytics module if sgtmProxyBaseUrl is provided
    if (config.sgtmProxyBaseUrl) {
      // Analytics uses unauthenticated HTTP client (public endpoint)
      const analyticsHttpClient = createHttpClient(
        '', // Base URL is empty since we use full URL in analytics methods
        config.timeout,
        config.defaultHeaders
      );
      this.analytics = new Analytics(analyticsHttpClient, config.sgtmProxyBaseUrl);
    }
  }

  /**
   * Sets the authorization and refresh tokens for authenticated requests
   *
   * @param tokens - Token response containing access_token and refresh_token
   *
   * @example
   * ```typescript
   * const tokens = await sdk.auth.confirmOTP({ email: 'user@example.com', otp: '123456' });
   * sdk.setTokens(tokens);
   * ```
   */
  setTokens(tokens: TokenResponse): void {
    this._authToken = tokens.access_token;
    this._refreshToken = tokens.refresh_token;
  }

  /**
   * Sets the authorization token for authenticated requests
   *
   * @param token - JWT access token
   *
   * @example
   * ```typescript
   * const tokens = await sdk.auth.confirmOTP({ email: 'user@example.com', otp: '123456' });
   * sdk.setAuthToken(tokens.access_token);
   * ```
   */
  setAuthToken(token: string): void {
    this._authToken = token;
  }

  /**
   * Sets the refresh token
   *
   * @param token - JWT refresh token
   */
  setRefreshToken(token: string): void {
    this._refreshToken = token;
  }

  /**
   * Gets the current authorization token
   */
  getAuthToken(): string | undefined {
    return this._authToken;
  }

  /**
   * Gets the current refresh token
   */
  getRefreshToken(): string | undefined {
    return this._refreshToken;
  }
}
