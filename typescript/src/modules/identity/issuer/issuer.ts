import { AxiosInstance } from "axios";
import {
  IssueCredentialOptions,
  IssueCredentialResponse,
  GetCredentialOfferOptions,
  GetCredentialOfferResponse,
} from "../../../types";

/**
 * Issuer module for credential issuance operations
 *
 * This module handles credential issuance (SIG and MTP) and fetching credential offers.
 */
export class Issuer {
  constructor(private httpClient: AxiosInstance) {}

  /**
   * Issue a credential (SIG or MTP)
   *
   * This method covers the endpoint: POST /identity/issuer/issue-credential
   *
   * Issues a new SIG or MTP credential for a user based on the provided DID, credential name, values, and owner email.
   * For SIG credentials, returns a QR code link immediately.
   * For MTP credentials, returns txId and claimId (use getCredentialOffer to fetch the QR code link after state is published).
   *
   * @param options - DID, credential name, values, and owner email
   * @returns Promise with credential response (either QR code link for SIG or txId/claimId for MTP)
   *
   * @example
   * ```typescript
   * // Issue a SIG credential
   * const result = await sdk.identity.issuer.issueCredential({
   *   did: 'did:iden3:trust-id:main:...',
   *   credentialName: 'KYCAgeCredential',
   *   values: { birthday: 25, documentType: 2 },
   *   ownerEmail: 'user@example.com'
   * });
   * // For SIG: result.qrCodeLink - QR code link for the credential
   * // For MTP: result.txId and result.claimId - use getCredentialOffer to get QR code link
   * ```
   */
  async issueCredential(
    options: IssueCredentialOptions
  ): Promise<IssueCredentialResponse> {
    if (!options.did || !options.did.startsWith("did:")) {
      throw new Error('Valid DID is required (must start with "did:")');
    }

    if (!options.credentialName || typeof options.credentialName !== "string") {
      throw new Error("Valid credential name is required");
    }

    if (!options.values || typeof options.values !== "object") {
      throw new Error("Valid values object is required");
    }

    if (!options.ownerEmail || !options.ownerEmail.includes("@")) {
      throw new Error("Valid owner email is required");
    }

    const response = await this.httpClient.post<IssueCredentialResponse>(
      "/identity/issuer/issue-credential",
      {
        did: options.did,
        credentialName: options.credentialName,
        values: options.values,
        ownerEmail: options.ownerEmail,
      }
    );

    return response.data;
  }

  /**
   * Get credential offer link for MTP credentials
   *
   * This method covers the endpoint: GET /identity/issuer/get-credential-offer
   *
   * Checks if MTP credential state is published and returns the offer link if available.
   * For MTP credentials, the state must be published on the blockchain before the offer link can be retrieved.
   *
   * @param options - Claim ID and transaction ID
   * @returns Promise with credential offer status and QR code link (if available)
   *
   * @example
   * ```typescript
   * const result = await sdk.identity.issuer.getCredentialOffer({
   *   claimId: 'abc123...',
   *   txId: '0x1234567890abcdef...'
   * });
   * // result.status - 'published' or 'pending'
   * // result.qrCodeLink - QR code link (only if status is 'published')
   * // result.offerAvailable - boolean indicating if offer is ready
   * ```
   */
  async getCredentialOffer(
    options: GetCredentialOfferOptions
  ): Promise<GetCredentialOfferResponse> {
    if (!options.claimId || typeof options.claimId !== "string") {
      throw new Error("Valid claim ID is required");
    }

    if (!options.txId || typeof options.txId !== "string") {
      throw new Error("Valid transaction ID is required");
    }

    const response = await this.httpClient.get<GetCredentialOfferResponse>(
      "/identity/issuer/get-credential-offer",
      {
        params: {
          claimId: options.claimId,
          txId: options.txId,
        },
      }
    );

    return response.data;
  }
}

