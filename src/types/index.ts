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
  /** The email address of the credential owner */
  ownerEmail: string;
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
 * Options for storing a credential to IPFS
 */
export interface StoreCredentialOptions {
  /** The DID of the user */
  did: string;
  /** The type of credential being stored */
  credentialType: string;
  /** The credential data (string if encrypted, object if unencrypted) */
  credential: string | object;
  /** Whether the credential is encrypted (defaults to true) */
  encrypted?: boolean;
}

/**
 * Response from storing a credential to IPFS
 */
export interface StoreCredentialResponse {
  /** IPFS Content Identifier for the stored credential */
  cid: string;
  /** The DID of the user */
  did: string;
  /** The type of credential */
  credentialType: string;
  /** Informational message */
  message: string;
  /** Whether the credential is encrypted */
  encrypted: boolean;
}

/**
 * Options for retrieving a user credential from IPFS
 */
export interface RetrieveUserCredentialOptions {
  /** The DID of the user */
  did: string;
  /** The type of credential being retrieved */
  credentialType: string;
  /** If true, returns only the CID without downloading credential data (faster) */
  includeCidOnly?: boolean;
}

/**
 * Response from retrieving a user credential from IPFS
 */
export interface RetrieveUserCredentialResponse {
  /** Credential data (string if encrypted, object if unencrypted, only when includeCidOnly=false) */
  credential?: string | object;
  /** The CID for the credential */
  cid: string;
  /** The DID of the user */
  did: string;
  /** The type of credential */
  credentialType: string;
  /** Whether the credential is encrypted (only when includeCidOnly=false) */
  encrypted?: boolean;
  /** Informational message */
  message: string;
}

/**
 * Options for getting all user credentials from IPFS
 */
export interface GetAllUserCredentialsOptions {
  /** The DID of the user */
  did: string;
  /** If true, downloads and includes credential data from IPFS (slower but complete) */
  includeCredentialData?: boolean;
}

/**
 * Response from getting all user credentials from IPFS
 */
export interface GetAllUserCredentialsResponse {
  /** Credentials object - either CIDs only or full credential data */
  credentials: Record<
    string,
    | string
    | {
        cid: string;
        credential: string | object;
        encrypted: boolean;
      }
  >;
  /** The DID of the user */
  did: string;
  /** Number of credentials */
  count: number;
  /** Informational message */
  message: string;
}

/**
 * Options for initiating sign-in verification
 */
export interface VerifySignInOptions {
  /** The type of credential to verify (e.g., 'ProofOfAgeCredential', 'KYCAgeCredential') */
  credentialName: string;
}

/**
 * Response from initiating sign-in verification
 */
export interface VerifySignInResponse {
  /** URL to fetch the proof request */
  proofRequestUrl: string;
  /** iden3comm deep link URL for wallet apps */
  iden3commUrl: string;
  /** Session ID for this verification request */
  sessionId: string;
}

/**
 * Options for storing proof request in link store
 */
export interface PostLinkStoreOptions {
  /** Session ID (same as id and thid) */
  id: string;
  /** Thread ID (same as id) */
  thid: string;
  /** Request type */
  type: string;
  /** Verifier DID */
  from: string;
  /** Content type */
  typ: string;
  /** Request body with callback URL, reason, message, and scope */
  body: {
    reason: string;
    message: string;
    callbackUrl: string;
    scope: Array<{
      id: number | string;
      circuitId: string;
      query: {
        allowedIssuers?: string[];
        type?: string;
        context?: string;
        [key: string]: any;
      };
    }>;
  };
}

/**
 * Response from storing proof request in link store
 */
export interface PostLinkStoreResponse {
  /** URL to fetch the proof request */
  proofRequestUrl: string;
  /** iden3comm deep link URL for wallet apps */
  iden3commUrl: string;
}

/**
 * Options for getting proof request from link store
 */
export interface GetLinkStoreOptions {
  /** Session ID to retrieve */
  id: string;
}

/**
 * Response from getting proof request from link store
 * This is the full iden3comm authorization request JSON
 */
export interface GetLinkStoreResponse {
  /** Session ID */
  id: string;
  /** Thread ID */
  thid: string;
  /** Request type */
  type: string;
  /** Verifier DID */
  from: string;
  /** Content type */
  typ: string;
  /** Request body */
  body: {
    reason: string;
    message: string;
    callbackUrl: string;
    scope: Array<{
      id: number | string;
      circuitId: string;
      query: {
        allowedIssuers?: string[];
        type?: string;
        context?: string;
        [key: string]: any;
      };
    }>;
  };
}

/**
 * Options for verification callback
 */
export interface VerifyCallbackOptions {
  /** Session ID from the sign-in step */
  sessionId: string;
  /** JWZ token (proof response) generated by the wallet */
  token: string;
}

/**
 * Response from verification callback
 * This is the verified authorization response from iden3
 */
export interface VerifyCallbackResponse {
  /** Response ID */
  id: string;
  /** Content type */
  typ: string;
  /** Response type */
  type: string;
  /** Thread ID (matches sessionId) */
  thid: string;
  /** Response body with proofs */
  body: {
    message: string;
    scope: Array<{
      id: number | string;
      circuitId: string;
      proof: {
        pi_a: string[];
        pi_b: string[][];
        pi_c: string[];
        protocol: string;
        curve: string;
      };
      pub_signals: string[];
    }>;
  };
  /** User's DID (from) */
  from: string;
  /** Verifier's DID (to) */
  to: string;
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
