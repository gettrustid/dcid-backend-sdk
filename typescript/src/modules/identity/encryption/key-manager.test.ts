import { describe, it, expect, beforeEach } from "vitest";
import { KeyManager } from "./key-manager";
import { createMockAxios } from "../../../__test-utils__/mock-axios";
import type { AxiosInstance } from "axios";

describe("KeyManager", () => {
  let mockAxios: AxiosInstance;
  let keyManager: KeyManager;

  beforeEach(() => {
    mockAxios = createMockAxios();
    keyManager = new KeyManager(mockAxios);
  });

  describe("generateKey", () => {
    const validOptions = {
      did: "did:iden3:trustid:main:abc123",
      ownerEmail: "user@test.com",
    };

    it("should POST to /identity/generate-encryption-key", async () => {
      const mockResponse = {
        encryptedKey: "enc-key-123",
        did: validOptions.did,
        ownerEmail: validOptions.ownerEmail,
        message: "Key generated",
      };
      (mockAxios.post as any).mockResolvedValue({ data: mockResponse });

      const result = await keyManager.generateKey(validOptions);

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/identity/generate-encryption-key",
        { did: validOptions.did, ownerEmail: validOptions.ownerEmail }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw if DID is missing", async () => {
      await expect(
        keyManager.generateKey({ did: "", ownerEmail: "user@test.com" })
      ).rejects.toThrow('Valid DID is required (must start with "did:")');
    });

    it("should throw if DID does not start with 'did:'", async () => {
      await expect(
        keyManager.generateKey({
          did: "invalid-did",
          ownerEmail: "user@test.com",
        })
      ).rejects.toThrow('Valid DID is required (must start with "did:")');
    });

    it("should throw if ownerEmail is missing", async () => {
      await expect(
        keyManager.generateKey({
          did: "did:iden3:test",
          ownerEmail: "",
        })
      ).rejects.toThrow("Valid owner email is required");
    });

    it("should throw if ownerEmail is invalid (no @)", async () => {
      await expect(
        keyManager.generateKey({
          did: "did:iden3:test",
          ownerEmail: "invalid-email",
        })
      ).rejects.toThrow("Valid owner email is required");
    });
  });

  describe("getKey", () => {
    it("should POST to /identity/get-encrypted-key", async () => {
      const mockResponse = {
        encryptedKey: "enc-key-456",
        did: "did:iden3:test",
        message: "Key retrieved",
      };
      (mockAxios.post as any).mockResolvedValue({ data: mockResponse });

      const result = await keyManager.getKey({ did: "did:iden3:test" });

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/identity/get-encrypted-key",
        { did: "did:iden3:test" }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw if DID is missing", async () => {
      await expect(keyManager.getKey({ did: "" })).rejects.toThrow(
        'Valid DID is required (must start with "did:")'
      );
    });

    it("should throw if DID does not start with 'did:'", async () => {
      await expect(
        keyManager.getKey({ did: "not-a-did" })
      ).rejects.toThrow('Valid DID is required (must start with "did:")');
    });
  });
});
