import { AxiosInstance } from "axios";
import {
  GenerateEncryptionKeyOptions,
  GenerateEncryptionKeyResponse,
  GetEncryptedKeyOptions,
  GetEncryptedKeyResponse,
} from "../../types";

/**
 * KeyManager module for encryption key operations
 *
 * This module handles encryption key generation and retrieval for DIDs.
 * Keys are encrypted with MetaKeep and require user consent for decryption.
 */
export class KeyManager {
  constructor(private httpClient: AxiosInstance) {}

  /**
   * Generate encryption key for a DID
   *
   * This method covers the endpoint: POST /identity/generate-encryption-key
   *
   * Generates an AES-256 encryption key for encrypting credentials associated with a specific DID.
   * The key is encrypted with MetaKeep and stored in Vault. The encrypted key is returned
   * and can be decrypted using the MetaKeep SDK with user consent.
   *
   * @param options - DID and owner email
   * @returns Promise with encrypted key, DID, owner email, and message
   *
   * @example
   * ```typescript
   * const result = await sdk.encryption.generateKey({
   *   did: 'did:iden3:trustid:main:2qadKcedyt3zCeTg7AqSvqsnBmwPvnSaX5qnGohLMT',
   *   ownerEmail: 'user@example.com'
   * });
   * // result.encryptedKey - MetaKeep encrypted key (decrypt with MetaKeep SDK)
   * ```
   */
  async generateKey(
    options: GenerateEncryptionKeyOptions
  ): Promise<GenerateEncryptionKeyResponse> {
    if (!options.did || !options.did.startsWith("did:")) {
      throw new Error('Valid DID is required (must start with "did:")');
    }

    if (!options.ownerEmail || !options.ownerEmail.includes("@")) {
      throw new Error("Valid owner email is required");
    }

    const response = await this.httpClient.post<GenerateEncryptionKeyResponse>(
      "/identity/generate-encryption-key",
      {
        did: options.did,
        ownerEmail: options.ownerEmail,
      }
    );

    return response.data;
  }

  /**
   * Get encrypted key for a DID
   *
   * This method covers the endpoint: POST /identity/get-encrypted-key
   *
   * Retrieves the encrypted decryption key for a specific DID from Vault.
   * The key is MetaKeep encrypted and requires the MetaKeep SDK with user consent to decrypt.
   *
   * @param options - DID
   * @returns Promise with encrypted key, DID, and message
   *
   * @example
   * ```typescript
   * const result = await sdk.encryption.getKey({
   *   did: 'did:iden3:trustid:main:2qadKcedyt3zCeTg7AqSvqsnBmwPvnSaX5qnGohLMT'
   * });
   * // result.encryptedKey - MetaKeep encrypted key (decrypt with MetaKeep SDK)
   * ```
   */
  async getKey(
    options: GetEncryptedKeyOptions
  ): Promise<GetEncryptedKeyResponse> {
    if (!options.did || !options.did.startsWith("did:")) {
      throw new Error('Valid DID is required (must start with "did:")');
    }

    const response = await this.httpClient.post<GetEncryptedKeyResponse>(
      "/identity/get-encrypted-key",
      {
        did: options.did,
      }
    );

    return response.data;
  }
}
