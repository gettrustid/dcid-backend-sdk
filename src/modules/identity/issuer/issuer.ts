import { AxiosInstance } from "axios";
import { Centrifuge, Subscription } from "centrifuge";
import {
  IssueCredentialOptions,
  IssueCredentialResponse,
  GetCredentialOfferOptions,
  GetCredentialOfferResponse,
  WaitForCredentialOfferOptions,
} from "../../../types";

/**
 * Issuer module for credential issuance operations
 *
 * This module handles credential issuance (SIG and MTP) and fetching credential offers.
 */
export class Issuer {
  private centrifuge: Centrifuge | null = null;
  private subscription: Subscription | null = null;
  private waitingCredentials = new Map<
    string,
    {
      resolve: (value: GetCredentialOfferResponse) => void;
      reject: (reason: Error) => void;
      timeout: NodeJS.Timeout;
    }
  >();

  constructor(
    private httpClient: AxiosInstance,
    private wsUrl?: string,
    private getAuthToken?: () => string | undefined
  ) {}

  /**
   * Issue a credential (SIG or MTP)
   *
   * This method covers the endpoint: POST /identity/issuer/issue-credential
   *
   * Issues a new SIG or MTP credential for a user based on the provided DID, credential name, and values.
   * For SIG credentials, returns a QR code link immediately.
   * For MTP credentials, returns txId and claimId (use getCredentialOffer to fetch the QR code link after state is published).
   *
   * @param options - DID, credential name, and values
   * @returns Promise with credential response (either QR code link for SIG or txId/claimId for MTP)
   *
   * @example
   * ```typescript
   * // Issue a SIG credential
   * const result = await sdk.issuer.issueCredential({
   *   did: 'did:iden3:trust-id:main:...',
   *   credentialName: 'KYCAgeCredential',
   *   values: { birthday: 25, documentType: 2 }
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

    const response = await this.httpClient.post<IssueCredentialResponse>(
      "/identity/issuer/issue-credential",
      {
        did: options.did,
        credentialName: options.credentialName,
        values: options.values,
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
   * const result = await sdk.issuer.getCredentialOffer({
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

  /**
   * Wait for credential offer to be published via WebSocket
   *
   * This method uses WebSocket to wait for MTP credential state to be published on the blockchain.
   * It blocks until the credential is ready (status='published') or times out.
   *
   * @param options - Claim ID, transaction ID, optional WebSocket URL, and timeout
   * @returns Promise that resolves when credential is published with QR code link
   *
   * @example
   * ```typescript
   * // Wait for credential to be published (blocks until ready)
   * const result = await sdk.issuer.waitForCredentialOffer({
   *   claimId: 'abc123...',
   *   txId: '0x1234567890abcdef...'
   * });
   * // result.status - 'published'
   * // result.qrCodeLink - QR code link for the credential
   * ```
   */
  async waitForCredentialOffer(
    options: WaitForCredentialOfferOptions
  ): Promise<GetCredentialOfferResponse> {
    if (!options.claimId || typeof options.claimId !== "string") {
      throw new Error("Valid claim ID is required");
    }

    if (!options.txId || typeof options.txId !== "string") {
      throw new Error("Valid transaction ID is required");
    }

    const wsUrl = options.wsUrl || this.wsUrl;
    if (!wsUrl) {
      throw new Error(
        "WebSocket URL is required. Provide it in SDK config (wsUrl) or in options."
      );
    }

    const timeout = options.timeout || 120000; // Default 2 minutes

    return new Promise<GetCredentialOfferResponse>((resolve, reject) => {
      // Check if already waiting for this credential
      if (this.waitingCredentials.has(options.claimId)) {
        reject(
          new Error(
            `Already waiting for credential with claimId: ${options.claimId}`
          )
        );
        return;
      }

      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.waitingCredentials.delete(options.claimId);
        reject(
          new Error(
            `Credential not ready within ${timeout}ms (${timeout / 1000}s)`
          )
        );

        // Auto-disconnect if no more waiting credentials
        if (this.waitingCredentials.size === 0) {
          this.disconnect();
        }
      }, timeout);

      // Store the promise handlers
      this.waitingCredentials.set(options.claimId, {
        resolve,
        reject,
        timeout: timeoutId,
      });

      // Connect and subscribe if not already connected
      if (!this.centrifuge || this.centrifuge.state !== "connected") {
        this.connect(wsUrl, options.claimId, options.txId);
      } else {
        // Already connected, just subscribe to updates
        this.subscribeToUpdates();
      }
    });
  }

  private getWebSocketUrl(wsUrl: string, claimId: string, txId: string): string {
    // Handle both ws:// and wss:// URLs
    const separator = wsUrl.includes("?") ? "&" : "?";
    return `${wsUrl}${separator}claimId=${encodeURIComponent(claimId)}&txId=${encodeURIComponent(txId)}`;
  }

  private connect(wsUrl: string, claimId: string, txId: string) {
    if (this.centrifuge?.state === "connected") {
      return;
    }

    const fullWsUrl = this.getWebSocketUrl(wsUrl, claimId, txId);
    const token = this.getAuthToken?.();

    if (!token) {
      // Reject all waiting credentials
      this.waitingCredentials.forEach(({ reject, timeout }) => {
        clearTimeout(timeout);
        reject(new Error("Authentication token is required for WebSocket connection"));
      });
      this.waitingCredentials.clear();
      return;
    }

    this.centrifuge = new Centrifuge(fullWsUrl, {
      token: token,
    });

    this.makeListeners();
    this.centrifuge.connect();
  }

  private makeListeners() {
    if (!this.centrifuge) return;

    this.centrifuge.on("connected", () => {
      this.subscribeToUpdates();
    });

    this.centrifuge.on("disconnected", () => {
      // Reject all waiting credentials on disconnect
      this.waitingCredentials.forEach(({ reject, timeout }) => {
        clearTimeout(timeout);
        reject(new Error("WebSocket disconnected"));
      });
      this.waitingCredentials.clear();
    });

    this.centrifuge.on("error", (error: any) => {
      // Reject all waiting credentials on error
      this.waitingCredentials.forEach(({ reject, timeout }) => {
        clearTimeout(timeout);
        reject(
          new Error(
            `WebSocket error: ${error.message || "Unknown error"}`
          )
        );
      });
      this.waitingCredentials.clear();
    });
  }

  private subscribeToUpdates() {
    if (!this.centrifuge) return;

    this.subscription = this.centrifuge.newSubscription("credential_updates");

    this.subscription.on("publication", (ctx: any) => {
      const data = ctx.data as GetCredentialOfferResponse;

      if (data.status === "published" && data.offerAvailable) {
        const waiting = this.waitingCredentials.get(data.claimId);
        if (waiting) {
          clearTimeout(waiting.timeout);
          waiting.resolve(data);
          this.waitingCredentials.delete(data.claimId);

          // Auto-disconnect when credential is published (if no more waiting)
          if (this.waitingCredentials.size === 0) {
            setTimeout(() => this.disconnect(), 1000);
          }
        }
      }
    });

    this.subscription.subscribe();
  }

  private disconnect() {
    // Clear all timeouts and reject promises
    this.waitingCredentials.forEach(({ timeout, reject }) => {
      clearTimeout(timeout);
      reject(new Error("WebSocket disconnected"));
    });
    this.waitingCredentials.clear();

    this.subscription?.unsubscribe();
    this.subscription = null;

    this.centrifuge?.disconnect();
    this.centrifuge = null;
  }
}

