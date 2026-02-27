import { AxiosInstance } from "axios";
import {
  StoreCredentialOptions,
  StoreCredentialResponse,
  RetrieveUserCredentialOptions,
  RetrieveUserCredentialResponse,
  GetAllUserCredentialsOptions,
  GetAllUserCredentialsResponse,
} from "../../../types";

/**
 * IPFS module for credential storage and retrieval operations
 *
 * This module handles storing credentials to IPFS, retrieving credentials from IPFS,
 * and getting all user credentials.
 */
export class IPFS {
  constructor(private httpClient: AxiosInstance) {}

  /**
   * Store credential data to IPFS and PostgreSQL
   *
   * This method covers the endpoint: POST /identity/ipfs/store-credential
   *
   * Stores credential data to IPFS and saves the CID to PostgreSQL.
   * Supports both encrypted and unencrypted credentials.
   *
   * @param options - DID, credential type, credential data, and encryption flag
   * @returns Promise with CID and credential information
   *
   * @example
   * ```typescript
   * // Store an encrypted credential
   * const result = await sdk.identity.ipfs.storeCredential({
   *   did: 'did:iden3:trust-id:main:...',
   *   credentialType: 'KYCAgeCredential',
   *   credential: 'U2FsdGVkX1+vupppZksvRf...', // encrypted string
   *   encrypted: true
   * });
   * // result.cid - IPFS Content Identifier
   *
   * // Store an unencrypted credential
   * const result = await sdk.identity.ipfs.storeCredential({
   *   did: 'did:iden3:trust-id:main:...',
   *   credentialType: 'UPHEM',
   *   credential: { type: 'UPHEM', data: {...} }, // object
   *   encrypted: false
   * });
   * ```
   */
  async storeCredential(
    options: StoreCredentialOptions
  ): Promise<StoreCredentialResponse> {
    if (!options.did || typeof options.did !== "string") {
      throw new Error("Valid DID is required");
    }

    if (!options.credentialType || typeof options.credentialType !== "string") {
      throw new Error("Valid credential type is required");
    }

    if (!options.credential) {
      throw new Error("Credential data is required");
    }

    const encrypted = options.encrypted !== undefined ? options.encrypted : true;

    if (encrypted && typeof options.credential !== "string") {
      throw new Error("Encrypted credentials must be provided as string");
    }

    if (!encrypted && typeof options.credential !== "object") {
      throw new Error("Unencrypted credentials must be provided as object");
    }

    const response = await this.httpClient.post<StoreCredentialResponse>(
      "/identity/ipfs/store-credential",
      {
        did: options.did,
        credentialType: options.credentialType,
        credential: options.credential,
        encrypted: encrypted,
      },
      { headers: { "X-TrustID-Service": "identity:ipfs_store_credential" } }
    );

    return response.data;
  }

  /**
   * Retrieve user credential from PostgreSQL and IPFS
   *
   * This method covers the endpoint: POST /identity/retrieve-user-credential
   *
   * Retrieves user credential by looking up CID in PostgreSQL and optionally
   * downloading data from IPFS. Can return just CID or full credential data.
   *
   * @param options - DID, credential type, and optional includeCidOnly flag
   * @returns Promise with credential data and metadata
   *
   * @example
   * ```typescript
   * // Retrieve full credential data
   * const result = await sdk.identity.ipfs.retrieveUserCredential({
   *   did: 'did:iden3:trust-id:main:...',
   *   credentialType: 'KYCAgeCredential',
   *   includeCidOnly: false
   * });
   * // result.credential - credential data (string if encrypted, object if not)
   * // result.cid - IPFS Content Identifier
   *
   * // Retrieve only CID (faster)
   * const result = await sdk.identity.ipfs.retrieveUserCredential({
   *   did: 'did:iden3:trust-id:main:...',
   *   credentialType: 'KYCAgeCredential',
   *   includeCidOnly: true
   * });
   * // result.cid - IPFS Content Identifier only
   * ```
   */
  async retrieveUserCredential(
    options: RetrieveUserCredentialOptions
  ): Promise<RetrieveUserCredentialResponse> {
    if (!options.did || typeof options.did !== "string") {
      throw new Error("Valid DID is required");
    }

    if (!options.credentialType || typeof options.credentialType !== "string") {
      throw new Error("Valid credential type is required");
    }

    const includeCidOnly =
      options.includeCidOnly !== undefined ? options.includeCidOnly : false;

    const response = await this.httpClient.post<RetrieveUserCredentialResponse>(
      "/identity/retrieve-user-credential",
      {
        did: options.did,
        credentialType: options.credentialType,
        includeCidOnly: includeCidOnly,
      },
      { headers: { "X-TrustID-Service": "identity:ipfs_retrieve_credential" } }
    );

    return response.data;
  }

  /**
   * Get all user credentials from PostgreSQL and optionally IPFS
   *
   * This method covers the endpoint: POST /identity/get-all-user-credentials
   *
   * Retrieves all credential CIDs for a user from PostgreSQL and optionally
   * downloads the credential data from IPFS.
   *
   * @param options - DID and optional includeCredentialData flag
   * @returns Promise with all user credentials
   *
   * @example
   * ```typescript
   * // Get only CIDs (faster)
   * const result = await sdk.identity.ipfs.getAllUserCredentials({
   *   did: 'did:iden3:trust-id:main:...',
   *   includeCredentialData: false
   * });
   * // result.credentials - object with credentialType: CID mapping
   * // result.count - number of credentials
   *
   * // Get full credential data (slower but complete)
   * const result = await sdk.identity.ipfs.getAllUserCredentials({
   *   did: 'did:iden3:trust-id:main:...',
   *   includeCredentialData: true
   * });
   * // result.credentials - object with credentialType: { cid, credential, encrypted }
   * ```
   */
  async getAllUserCredentials(
    options: GetAllUserCredentialsOptions
  ): Promise<GetAllUserCredentialsResponse> {
    if (!options.did || typeof options.did !== "string") {
      throw new Error("Valid DID is required");
    }

    const includeCredentialData =
      options.includeCredentialData !== undefined
        ? options.includeCredentialData
        : false;

    const response = await this.httpClient.post<GetAllUserCredentialsResponse>(
      "/identity/get-all-user-credentials",
      {
        did: options.did,
        includeCredentialData: includeCredentialData,
      },
      { headers: { "X-TrustID-Service": "identity:ipfs_get_all_credentials" } }
    );

    return response.data;
  }
}

