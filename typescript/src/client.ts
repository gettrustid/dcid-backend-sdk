import { createHttpClient } from "./utils/http";
import { AuthOTP } from "./modules/auth/otp";
import { KeyManager } from "./modules/identity/encryption";
import { Issuer } from "./modules/identity/issuer";
import { IPFS } from "./modules/identity/ipfs";
import { Verification } from "./modules/identity/verification";
import { Analytics } from "./modules/analytics";
import { DCIDServerSDKConfig, TokenResponse } from "./types";
import { getEnvironmentConfig } from "./config/environments";
import { ConsoleLogger, NoOpLogger } from "./utils/logger";

/**
 * Main DCID Server SDK Client
 *
 * This is the main entry point for using the SDK.
 *
 */
export class DCIDServerSDK {
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
   * Creates a new DCID Server SDK instance
   *
   * @param config - SDK configuration
   */
  constructor(config: DCIDServerSDKConfig) {

    if (!config.apiKey) {
      throw new Error("apiKey is required in SDK configuration");
    }

    // Get environment configuration (hard-coded URLs)
    const envConfig = getEnvironmentConfig(config.environment || "prod");

    // Remove trailing slash from baseUrl
    this._baseUrl = envConfig.baseUrl.replace(/\/$/, "");

    // Setup logger (use provided logger or default based on environment)
    const environment = config.environment || "prod";
    const logger =
      config.logger ||
      (environment === "dev"
        ? new ConsoleLogger(true)
        : new NoOpLogger());

    // Determine if request logging should be enabled
    const enableRequestLogging =
      config.enableRequestLogging !== undefined
        ? config.enableRequestLogging
        : environment === "dev";

    // Create default headers with API key (shared base)
    const baseHeaders: Record<string, string> = {
      "X-API-Key": config.apiKey,
      ...config.defaultHeaders,
    };

    // Create getter functions for tokens
    const getAuthToken = () => this._authToken;
    const getRefreshToken = () => this._refreshToken;

    // Create HTTP client for unauthenticated requests (auth module - OTP)
    const httpClient = createHttpClient(
      this._baseUrl,
      config.timeout,
      { ...baseHeaders, "X-TrustID-Service": "otp" },
      undefined,
      undefined,
      undefined,
      undefined,
      logger,
      enableRequestLogging
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

    // Create HTTP client for authenticated requests (identity module)
    // This client will automatically refresh tokens on 401 errors using SDK's refreshToken method
    const authenticatedHttpClient = createHttpClient(
      this._baseUrl,
      config.timeout,
      { ...baseHeaders, "X-TrustID-Service": "identity" },
      getAuthToken,
      getRefreshToken,
      refreshTokenCallback,
      onTokenRefreshed,
      logger,
      enableRequestLogging
    );

    // Initialize identity modules
    this.identity = {
      encryption: new KeyManager(authenticatedHttpClient),
      issuer: new Issuer(authenticatedHttpClient),
      ipfs: new IPFS(authenticatedHttpClient),
      verification: new Verification(authenticatedHttpClient),
    };

    // Analytics uses unauthenticated HTTP client (public endpoint)
    const analyticsHttpClient = createHttpClient(
      "", // Base URL is empty since we use full URL in analytics methods
      config.timeout,
      { ...baseHeaders, "X-TrustID-Service": "analytics" },
      undefined,
      undefined,
      undefined,
      undefined,
      logger,
      enableRequestLogging
    );
    this.analytics = new Analytics(
      analyticsHttpClient,
      this._baseUrl
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
