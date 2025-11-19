/**
 * Configuration options for the TrustID SDK
 */
export interface TrustIdSDKConfig {
  environment: "dev" | "prod";
  /** API key for authentication (required for API access) */
  apiKey: string;
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
 * Options for issuing a credential
 */
export interface IssueCredentialOptions {
  /** The DID of the user to issue the credential for */
  did: string;
  /** The name of the credential to issue (e.g., 'KYCAgeCredential') */
  credentialName: string;
  /** The values required for the credential */
  values: Record<string, any>;
}

/**
 * Response from issuing a credential
 * For SIG credentials: returns qrCodeLink and schemaType
 * For MTP credentials: returns txId and claimId (use getCredentialOffer to get qrCodeLink)
 */
export type IssueCredentialResponse =
  | {
      /** QR code link for SIG credentials */
      qrCodeLink: string;
      /** The type of the issued schema */
      schemaType: string;
    }
  | {
      /** Blockchain transaction ID for MTP credentials */
      txId: string;
      /** Credential claim ID for MTP credentials */
      claimId: string;
    };

/**
 * Options for getting credential offer
 */
export interface GetCredentialOfferOptions {
  /** The credential claim ID */
  claimId: string;
  /** The blockchain transaction ID */
  txId: string;
}

/**
 * Options for waiting for credential offer via WebSocket
 */
export interface WaitForCredentialOfferOptions {
  /** The credential claim ID */
  claimId: string;
  /** The blockchain transaction ID */
  txId: string;
  /** Optional WebSocket URL (overrides SDK config) */
  wsUrl?: string;
  /** Optional timeout in milliseconds (default: 120000 = 2 minutes) */
  timeout?: number;
}

/**
 * Response from getting credential offer
 */
export interface GetCredentialOfferResponse {
  /** Status of the credential offer ('published' or 'pending') */
  status: "published" | "pending";
  /** The blockchain transaction ID */
  txId: string;
  /** The credential claim ID */
  claimId: string;
  /** Whether the offer is available */
  offerAvailable: boolean;
  /** QR code link (only present if status is 'published') */
  qrCodeLink?: string;
  /** Full offer data (only present if status is 'published') */
  offer?: any;
  /** Message explaining the status (only present if status is 'pending') */
  message?: string;
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
    this.name = "TrustIdSDKError";
    Object.setPrototypeOf(this, TrustIdSDKError.prototype);
  }
}
