/**
 * Configuration options for the TrustID SDK
 */
export interface TrustIdSDKConfig {
  /** Base URL of the PortalAPI (e.g., 'https://api.trustid.com' or 'http://localhost:4000') */
  baseUrl: string;
  /** Optional timeout for requests in milliseconds (default: 30000) */
  timeout?: number;
  /** Optional default headers to include with all requests */
  defaultHeaders?: Record<string, string>;
}

/**
 * Response from OTP initiation
 */
export interface InitiateOTPResponse {
  /** OTP code (only returned in dev environment) */
  otp?: string;
}

/**
 * Response from OTP confirmation or token refresh
 */
export interface TokenResponse {
  /** JWT access token */
  access_token: string;
  /** JWT refresh token */
  refresh_token: string;
}

/**
 * Options for initiating OTP registration/sign-in
 */
export interface InitiateOTPOptions {
  /** User's email address */
  email?: string;
  /** User's phone number (with country code, e.g., +1234567890) */
  phone?: string;
  /** Optional anonymous ID for tracking */
  anonymous_id?: string;
  /** Optional brand ID */
  brand_id?: string;
  /** Optional brand name */
  brand_name?: string;
  /** Optional session ID */
  session_id?: string;
}

/**
 * Options for confirming OTP
 */
export interface ConfirmOTPOptions {
  /** User's email address */
  email?: string;
  /** User's phone number */
  phone?: string;
  /** The OTP code received by the user */
  otp: string;
}

/**
 * Options for refreshing token
 */
export interface RefreshTokenOptions {
  /** The refresh token */
  refreshToken: string;
}

/**
 * Options for generating encryption key
 */
export interface GenerateEncryptionKeyOptions {
  /** The DID for which to generate the encryption key */
  did: string;
  /** The email address of the DID owner */
  ownerEmail: string;
}

/**
 * Response from generating encryption key
 */
export interface GenerateEncryptionKeyResponse {
  /** The generated encryption key (MetaKeep encrypted - client decrypts with SDK) */
  encryptedKey: string;
  /** The DID for which the key was generated */
  did: string;
  /** The email address of the DID owner */
  ownerEmail: string;
  /** Informational message */
  message: string;
}

/**
 * Options for getting encrypted key
 */
export interface GetEncryptedKeyOptions {
  /** The DID for which to retrieve the encrypted key */
  did: string;
}

/**
 * Response from getting encrypted key
 */
export interface GetEncryptedKeyResponse {
  /** The encrypted key (MetaKeep encrypted - client decrypts with SDK) */
  encryptedKey: string;
  /** The DID for which the key was retrieved */
  did: string;
  /** Informational message */
  message: string;
}

/**
 * Custom error class for SDK errors
 */
export class TrustIdSDKError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'TrustIdSDKError';
    Object.setPrototypeOf(this, TrustIdSDKError.prototype);
  }
}

