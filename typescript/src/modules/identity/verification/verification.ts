import { AxiosInstance } from "axios";
import {
  VerifySignInOptions,
  VerifySignInResponse,
  PostLinkStoreOptions,
  PostLinkStoreResponse,
  GetLinkStoreOptions,
  GetLinkStoreResponse,
  VerifyCallbackOptions,
  VerifyCallbackResponse,
} from "../../../types";

/**
 * Verification module for credential verification operations
 *
 * This module handles the complete verification flow:
 * 1. Initiate verification request (sign-in) - automatically stores proof request
 * 2. Fetch proof request from Redis (link-store GET)
 * 3. Submit and verify proof (callback)
 */
export class Verification {
  constructor(private httpClient: AxiosInstance) {}

  /**
   * Initiate sign-in verification request
   *
   * This method covers the endpoint: POST /identity/verify/sign-in
   *
   * Creates a verification request for a specific credential type, stores it in Redis
   * (the server handles storage internally), and returns URLs for the frontend to use.
   *
   * @param options - Credential name to verify
   * @returns Promise with proof request URL, iden3comm URL, and session ID
   *
   * @example
   * ```typescript
   * const result = await sdk.identity.verification.verifySignIn({
   *   credentialName: 'ProofOfAgeCredential'
   * });
   * // result.proofRequestUrl - URL to fetch the proof request
   * // result.iden3commUrl - Deep link for wallet apps
   * // result.sessionId - Use this in subsequent steps
   * ```
   */
  async verifySignIn(
    options: VerifySignInOptions
  ): Promise<VerifySignInResponse> {
    if (!options.credentialName || typeof options.credentialName !== "string") {
      throw new Error("Valid credential name is required");
    }

    const response = await this.httpClient.post<VerifySignInResponse>(
      "/identity/verify/sign-in",
      {
        credentialName: options.credentialName,
      },
      { headers: { "X-TrustID-Service": "identity:verification_sign_in" } }
    );

    return response.data;
  }

  /**
   * Get proof request from Redis link store
   *
   * This method covers the endpoint: GET /identity/verify/link-store
   *
   * Retrieves the stored proof request from Redis using the session ID.
   * The frontend uses this to get the proof request after receiving the iden3comm URL.
   *
   * @param options - Session ID to retrieve
   * @returns Promise with the full proof request JSON
   *
   * @example
   * ```typescript
   * const proofRequest = await sdk.identity.verification.getLinkStore({
   *   id: '3297636436'
   * });
   * // proofRequest - Full iden3comm authorization request
   * // Use this to generate a proof with the wallet SDK
   * ```
   */
  async getLinkStore(
    options: GetLinkStoreOptions
  ): Promise<GetLinkStoreResponse> {
    if (!options.id || typeof options.id !== "string") {
      throw new Error("Valid id is required");
    }

    const response = await this.httpClient.get<GetLinkStoreResponse>(
      "/identity/verify/link-store",
      {
        params: {
          id: options.id,
        },
        headers: { "X-TrustID-Service": "identity:verification_link_store_get" },
      }
    );

    return response.data;
  }
  /**
   * Store proof request in Redis link store
   *
   * This method covers the endpoint: POST /identity/verify/link-store
   *
   * Stores the proof request JSON in Redis with a 1-hour TTL. This is typically called
   * internally by the server during verifySignIn, but can be called directly if needed.
   *
   * @param options - Full proof request object (iden3comm authorization request)
   * @returns Promise with proof request URL and iden3comm URL
   *
   * @example
   * ```typescript
   * const result = await sdk.identity.verification.postLinkStore({
   *   id: '3297636436',
   *   thid: '3297636436',
   *   type: 'https://iden3-communication.io/authorization/1.0/request',
   *   from: 'did:iden3:trust-id:main:...',
   *   typ: 'application/iden3comm-plain-json',
   *   body: {
   *     reason: 'DCID Verification',
   *     message: '',
   *     callbackUrl: 'https://.../api/identity/verify/callback?sessionId=3297636436',
   *     scope: [...]
   *   }
   * });
   * ```
   */
  async postLinkStore(
    options: PostLinkStoreOptions
  ): Promise<PostLinkStoreResponse> {
    if (!options.id || typeof options.id !== "string") {
      throw new Error("Valid id is required");
    }

    if (!options.body || typeof options.body !== "object") {
      throw new Error("Valid body object is required");
    }

    if (
      !options.body.callbackUrl ||
      typeof options.body.callbackUrl !== "string"
    ) {
      throw new Error("Valid callbackUrl in body is required");
    }

    if (!Array.isArray(options.body.scope)) {
      throw new Error("Valid scope array in body is required");
    }

    const response = await this.httpClient.post<PostLinkStoreResponse>(
      "/identity/verify/link-store",
      {
        id: options.id,
        thid: options.thid,
        type: options.type,
        from: options.from,
        typ: options.typ,
        body: options.body,
      },
      { headers: { "X-TrustID-Service": "identity:verification_link_store_post" } }
    );

    return response.data;
  }

  /**
   * Submit and verify proof response
   *
   * This method covers the endpoint: POST /identity/verify/callback
   *
   * Submits the proof response (JWZ token) generated by the wallet for verification.
   * The server retrieves the original request from Redis, verifies the proof using iden3
   * libraries, and returns the verification result.
   *
   * @param options - Session ID and JWZ token (proof response)
   * @returns Promise with verified authorization response
   *
   * @example
   * ```typescript
   * const result = await sdk.identity.verification.verifyCallback({
   *   sessionId: '3297636436',
   *   token: 'eyJhbGciOiJncm90aDE2IiwiY2lyY3VpdElkIjoiYXV0aFYyIiwiY3JpdCI6WyJjaXJjdWl0SWQiXSwidHlwIjoiYXBwbGljYXRpb24vaWRlbjMtemtwLWpzb24ifQ...'
   * });
   * // result.body.scope - Array of verified proofs
   * // result.from - User's DID
   * // result.to - Verifier's DID
   * ```
   */
  async verifyCallback(
    options: VerifyCallbackOptions
  ): Promise<VerifyCallbackResponse> {
    if (!options.sessionId || typeof options.sessionId !== "string") {
      throw new Error("Valid session ID is required");
    }

    if (!options.token || typeof options.token !== "string") {
      throw new Error("Valid token (JWZ) is required");
    }

    const response = await this.httpClient.post<VerifyCallbackResponse>(
      "/identity/verify/callback",
      {
        token: options.token,
      },
      {
        params: {
          sessionId: options.sessionId,
        },
        headers: { "X-TrustID-Service": "identity:verification_callback" },
      }
    );

    return response.data;
  }
}
