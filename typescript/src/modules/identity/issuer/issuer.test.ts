import { describe, it, expect, beforeEach } from "vitest";
import { Issuer } from "./issuer";
import { createMockAxios } from "../../../__test-utils__/mock-axios";
import type { AxiosInstance } from "axios";

describe("Issuer", () => {
  let mockAxios: AxiosInstance;
  let issuer: Issuer;

  beforeEach(() => {
    mockAxios = createMockAxios();
    issuer = new Issuer(mockAxios);
  });

  describe("issueCredential", () => {
    const validOptions = {
      did: "did:iden3:trustid:main:abc123",
      credentialName: "KYCAgeCredential",
      values: { birthday: 25, documentType: 2 },
      ownerEmail: "user@test.com",
    };

    it("should POST to /identity/issuer/issue-credential (SIG response)", async () => {
      const sigResponse = {
        qrCodeLink: "https://example.com/qr",
        schemaType: "KYCAgeCredential",
      };
      (mockAxios.post as any).mockResolvedValue({ data: sigResponse });

      const result = await issuer.issueCredential(validOptions);

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/identity/issuer/issue-credential",
        {
          did: validOptions.did,
          credentialName: validOptions.credentialName,
          values: validOptions.values,
          ownerEmail: validOptions.ownerEmail,
        },
        { headers: { "X-TrustID-Service": "identity:issuer_issue_credential" } }
      );
      expect(result).toEqual(sigResponse);
    });

    it("should handle MTP response", async () => {
      const mtpResponse = {
        txId: "0xabc123",
        claimId: "claim-456",
      };
      (mockAxios.post as any).mockResolvedValue({ data: mtpResponse });

      const result = await issuer.issueCredential(validOptions);
      expect(result).toEqual(mtpResponse);
    });

    it("should throw if DID is missing", async () => {
      await expect(
        issuer.issueCredential({ ...validOptions, did: "" })
      ).rejects.toThrow('Valid DID is required (must start with "did:")');
    });

    it("should throw if DID does not start with 'did:'", async () => {
      await expect(
        issuer.issueCredential({ ...validOptions, did: "bad-did" })
      ).rejects.toThrow('Valid DID is required (must start with "did:")');
    });

    it("should throw if credentialName is missing", async () => {
      await expect(
        issuer.issueCredential({ ...validOptions, credentialName: "" })
      ).rejects.toThrow("Valid credential name is required");
    });

    it("should throw if values is not an object", async () => {
      await expect(
        issuer.issueCredential({
          ...validOptions,
          values: null as any,
        })
      ).rejects.toThrow("Valid values object is required");
    });

    it("should throw if ownerEmail is missing", async () => {
      await expect(
        issuer.issueCredential({ ...validOptions, ownerEmail: "" })
      ).rejects.toThrow("Valid owner email is required");
    });

    it("should throw if ownerEmail has no @", async () => {
      await expect(
        issuer.issueCredential({
          ...validOptions,
          ownerEmail: "nope",
        })
      ).rejects.toThrow("Valid owner email is required");
    });
  });

  describe("getCredentialOffer", () => {
    const validOptions = {
      claimId: "claim-123",
      txId: "0xdef456",
    };

    it("should GET /identity/issuer/get-credential-offer with params", async () => {
      const publishedResponse = {
        status: "published",
        txId: validOptions.txId,
        claimId: validOptions.claimId,
        offerAvailable: true,
        qrCodeLink: "https://example.com/offer-qr",
      };
      (mockAxios.get as any).mockResolvedValue({ data: publishedResponse });

      const result = await issuer.getCredentialOffer(validOptions);

      expect(mockAxios.get).toHaveBeenCalledWith(
        "/identity/issuer/get-credential-offer",
        {
          params: { claimId: "claim-123", txId: "0xdef456" },
          headers: { "X-TrustID-Service": "identity:issuer_get_credential_offer" },
        }
      );
      expect(result).toEqual(publishedResponse);
    });

    it("should handle pending status response", async () => {
      const pendingResponse = {
        status: "pending",
        txId: "0xdef456",
        claimId: "claim-123",
        offerAvailable: false,
        message: "State not yet published",
      };
      (mockAxios.get as any).mockResolvedValue({ data: pendingResponse });

      const result = await issuer.getCredentialOffer(validOptions);
      expect(result.status).toBe("pending");
      expect(result.offerAvailable).toBe(false);
    });

    it("should throw if claimId is missing", async () => {
      await expect(
        issuer.getCredentialOffer({ claimId: "", txId: "0x123" })
      ).rejects.toThrow("Valid claim ID is required");
    });

    it("should throw if txId is missing", async () => {
      await expect(
        issuer.getCredentialOffer({ claimId: "claim-1", txId: "" })
      ).rejects.toThrow("Valid transaction ID is required");
    });
  });
});
