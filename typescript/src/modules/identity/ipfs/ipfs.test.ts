import { describe, it, expect, beforeEach } from "vitest";
import { IPFS } from "./ipfs";
import { createMockAxios } from "../../../__test-utils__/mock-axios";
import type { AxiosInstance } from "axios";

describe("IPFS", () => {
  let mockAxios: AxiosInstance;
  let ipfs: IPFS;

  beforeEach(() => {
    mockAxios = createMockAxios();
    ipfs = new IPFS(mockAxios);
  });

  describe("storeCredential", () => {
    it("should POST encrypted credential (string)", async () => {
      const mockResponse = {
        cid: "Qm123",
        did: "did:iden3:test",
        credentialType: "KYCAgeCredential",
        message: "Stored",
        encrypted: true,
      };
      (mockAxios.post as any).mockResolvedValue({ data: mockResponse });

      const result = await ipfs.storeCredential({
        did: "did:iden3:test",
        credentialType: "KYCAgeCredential",
        credential: "encrypted-string-data",
        encrypted: true,
      });

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/identity/ipfs/store-credential",
        {
          did: "did:iden3:test",
          credentialType: "KYCAgeCredential",
          credential: "encrypted-string-data",
          encrypted: true,
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should POST unencrypted credential (object)", async () => {
      const credObj = { type: "UPHEM", data: { key: "val" } };
      (mockAxios.post as any).mockResolvedValue({
        data: { cid: "Qm456", did: "did:iden3:test", credentialType: "UPHEM", message: "Stored", encrypted: false },
      });

      await ipfs.storeCredential({
        did: "did:iden3:test",
        credentialType: "UPHEM",
        credential: credObj,
        encrypted: false,
      });

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/identity/ipfs/store-credential",
        {
          did: "did:iden3:test",
          credentialType: "UPHEM",
          credential: credObj,
          encrypted: false,
        }
      );
    });

    it("should default encrypted to true", async () => {
      (mockAxios.post as any).mockResolvedValue({
        data: { cid: "Qm789", did: "d", credentialType: "t", message: "ok", encrypted: true },
      });

      await ipfs.storeCredential({
        did: "did:test",
        credentialType: "Test",
        credential: "some-encrypted-string",
      });

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/identity/ipfs/store-credential",
        expect.objectContaining({ encrypted: true })
      );
    });

    it("should throw if DID is missing", async () => {
      await expect(
        ipfs.storeCredential({
          did: "",
          credentialType: "Test",
          credential: "data",
        })
      ).rejects.toThrow("Valid DID is required");
    });

    it("should throw if credentialType is missing", async () => {
      await expect(
        ipfs.storeCredential({
          did: "did:test",
          credentialType: "",
          credential: "data",
        })
      ).rejects.toThrow("Valid credential type is required");
    });

    it("should throw if credential is missing", async () => {
      await expect(
        ipfs.storeCredential({
          did: "did:test",
          credentialType: "Test",
          credential: "" as any,
        })
      ).rejects.toThrow("Credential data is required");
    });

    it("should throw if encrypted=true but credential is not a string", async () => {
      await expect(
        ipfs.storeCredential({
          did: "did:test",
          credentialType: "Test",
          credential: { foo: "bar" },
          encrypted: true,
        })
      ).rejects.toThrow("Encrypted credentials must be provided as string");
    });

    it("should throw if encrypted=false but credential is not an object", async () => {
      await expect(
        ipfs.storeCredential({
          did: "did:test",
          credentialType: "Test",
          credential: "string-data",
          encrypted: false,
        })
      ).rejects.toThrow("Unencrypted credentials must be provided as object");
    });
  });

  describe("retrieveUserCredential", () => {
    it("should POST to /identity/retrieve-user-credential", async () => {
      const mockResponse = {
        credential: "encrypted-data",
        cid: "Qm123",
        did: "did:iden3:test",
        credentialType: "KYC",
        encrypted: true,
        message: "Retrieved",
      };
      (mockAxios.post as any).mockResolvedValue({ data: mockResponse });

      const result = await ipfs.retrieveUserCredential({
        did: "did:iden3:test",
        credentialType: "KYC",
      });

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/identity/retrieve-user-credential",
        {
          did: "did:iden3:test",
          credentialType: "KYC",
          includeCidOnly: false,
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should pass includeCidOnly=true when specified", async () => {
      (mockAxios.post as any).mockResolvedValue({
        data: { cid: "Qm123", did: "d", credentialType: "t", message: "ok" },
      });

      await ipfs.retrieveUserCredential({
        did: "did:test",
        credentialType: "KYC",
        includeCidOnly: true,
      });

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/identity/retrieve-user-credential",
        expect.objectContaining({ includeCidOnly: true })
      );
    });

    it("should throw if DID is missing", async () => {
      await expect(
        ipfs.retrieveUserCredential({ did: "", credentialType: "KYC" })
      ).rejects.toThrow("Valid DID is required");
    });

    it("should throw if credentialType is missing", async () => {
      await expect(
        ipfs.retrieveUserCredential({ did: "did:test", credentialType: "" })
      ).rejects.toThrow("Valid credential type is required");
    });
  });

  describe("getAllUserCredentials", () => {
    it("should POST to /identity/get-all-user-credentials", async () => {
      const mockResponse = {
        credentials: { KYC: "Qm123" },
        did: "did:iden3:test",
        count: 1,
        message: "OK",
      };
      (mockAxios.post as any).mockResolvedValue({ data: mockResponse });

      const result = await ipfs.getAllUserCredentials({
        did: "did:iden3:test",
      });

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/identity/get-all-user-credentials",
        { did: "did:iden3:test", includeCredentialData: false }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should pass includeCredentialData=true when specified", async () => {
      (mockAxios.post as any).mockResolvedValue({
        data: { credentials: {}, did: "d", count: 0, message: "ok" },
      });

      await ipfs.getAllUserCredentials({
        did: "did:test",
        includeCredentialData: true,
      });

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/identity/get-all-user-credentials",
        expect.objectContaining({ includeCredentialData: true })
      );
    });

    it("should throw if DID is missing", async () => {
      await expect(
        ipfs.getAllUserCredentials({ did: "" })
      ).rejects.toThrow("Valid DID is required");
    });
  });
});
