import { createHttpClient } from "./utils/http";
import { AuthOTP } from "./modules/auth/otp";
import { KeyManager } from "./modules/identity/encryption";
import { Issuer } from "./modules/identity/issuer";
import { IPFS } from "./modules/identity/ipfs";
import { Verification } from "./modules/identity/verification";
import { Analytics } from "./modules/analytics";
import { TrustIdSDKConfig, TokenResponse } from "./types";
import { getEnvironmentConfig } from "./config/environments";

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
 *   environment: 'prod', // or 'dev'
 *   apiKey: 'your-api-key-here'
 * });
 *
 * // Register with OTP
 * await sdk.auth.registerOTP({ email: 'user@example.com' });
 *
 * // Confirm OTP (tokens are automatically set in SDK context)
 * const tokens = await sdk.auth.confirmOTP({
 *   email: 'user@example.com',
 *   otp: '123456'
 * });
 * // No need to call sdk.setTokens() - tokens are set automatically, unless you want to set them manually
 *
 * // Generate encryption key (will auto-refresh token if expired)
 * await sdk.identity.encryption.generateKey({
 *   did: 'did:iden3:trustid:main:...',
 *   ownerEmail: 'user@example.com'
 * });
 *
 * // Track analytics events (analytics is automatically enabled)
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
  public readonly analytics?: Analytics;

  public readonly identity: {
    encryption: KeyManager;
    issuer: Issuer;
    ipfs: IPFS;
    verification: Verification;
  };

  private _authToken?: string;
  private _refreshToken?: string;
  private _baseUrl: string;

  /**
   * Creates a new TrustID SDK instance
   *
   * @param config - SDK configuration
   */
  constructor(config: TrustIdSDKConfig) {
    if (!config.environment) {
      throw new Error("environment is required in SDK configuration");
    }

    if (!config.apiKey) {
      throw new Error("apiKey is required in SDK configuration");
    }

    // Get environment configuration (hard-coded URLs)
    const envConfig = getEnvironmentConfig(config.environment);

    // Remove trailing slash from baseUrl
    this._baseUrl = envConfig.baseUrl.replace(/\/$/, "");

    // Create default headers with API key
    const defaultHeaders: Record<string, string> = {
      "X-API-Key": config.apiKey,
      ...config.defaultHeaders,
    };

    // Create getter functions for tokens
    const getAuthToken = () => this._authToken;
    const getRefreshToken = () => this._refreshToken;

    // Create HTTP client for unauthenticated requests (auth module)
    const httpClient = createHttpClient(
      this._baseUrl,
      config.timeout,
      defaultHeaders
    );

    // Callback to automatically set tokens after successful OTP confirmation
    const onTokensReceived = (tokens: TokenResponse) => {
      this._authToken = tokens.access_token;
      this._refreshToken = tokens.refresh_token;
    };

    // Initialize auth module first (needed for refresh callback)
    this.auth = new AuthOTP(httpClient, onTokensReceived);

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
      defaultHeaders,
      getAuthToken,
      getRefreshToken,
      refreshTokenCallback,
      onTokenRefreshed
    );

    // Initialize identity modules
    this.identity = {
      encryption: new KeyManager(authenticatedHttpClient),
      issuer: new Issuer(authenticatedHttpClient),
      ipfs: new IPFS(authenticatedHttpClient),
      verification: new Verification(authenticatedHttpClient),
    };

    // Initialize analytics module (sgtmProxyBaseUrl from environment config)
    // Analytics uses unauthenticated HTTP client (public endpoint)
    const analyticsHttpClient = createHttpClient(
      "", // Base URL is empty since we use full URL in analytics methods
      config.timeout,
      defaultHeaders
    );
    this.analytics = new Analytics(
      analyticsHttpClient,
      envConfig.sgtmProxyBaseUrl
    );
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
