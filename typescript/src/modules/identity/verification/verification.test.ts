import { describe, it, expect, beforeEach } from "vitest";
import { Verification } from "./verification";
import { createMockAxios } from "../../../__test-utils__/mock-axios";
import type { AxiosInstance } from "axios";

describe("Verification", () => {
  let mockAxios: AxiosInstance;
  let verification: Verification;

  beforeEach(() => {
    mockAxios = createMockAxios();
    verification = new Verification(mockAxios);
  });

  describe("verifySignIn", () => {
    it("should POST to /identity/verify/sign-in", async () => {
      const mockResponse = {
        proofRequestUrl: "https://example.com/proof",
        iden3commUrl: "iden3comm://...",
        sessionId: "sess-123",
      };
      (mockAxios.post as any).mockResolvedValue({ data: mockResponse });

      const result = await verification.verifySignIn({
        credentialName: "ProofOfAgeCredential",
      });

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/identity/verify/sign-in",
        { credentialName: "ProofOfAgeCredential" },
        { headers: { "X-TrustID-Service": "identity:verification_sign_in" } }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw if credentialName is missing", async () => {
      await expect(
        verification.verifySignIn({ credentialName: "" })
      ).rejects.toThrow("Valid credential name is required");
    });

    it("should throw if credentialName is not a string", async () => {
      await expect(
        verification.verifySignIn({ credentialName: 123 as any })
      ).rejects.toThrow("Valid credential name is required");
    });
  });

  describe("getLinkStore", () => {
    it("should GET /identity/verify/link-store with id param", async () => {
      const mockResponse = {
        id: "sess-123",
        thid: "sess-123",
        type: "https://iden3-communication.io/authorization/1.0/request",
        from: "did:iden3:verifier",
        typ: "application/iden3comm-plain-json",
        body: {
          reason: "Verification",
          message: "",
          callbackUrl: "https://example.com/callback",
          scope: [],
        },
      };
      (mockAxios.get as any).mockResolvedValue({ data: mockResponse });

      const result = await verification.getLinkStore({ id: "sess-123" });

      expect(mockAxios.get).toHaveBeenCalledWith(
        "/identity/verify/link-store",
        {
          params: { id: "sess-123" },
          headers: { "X-TrustID-Service": "identity:verification_link_store_get" },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw if id is missing", async () => {
      await expect(
        verification.getLinkStore({ id: "" })
      ).rejects.toThrow("Valid id is required");
    });

    it("should throw if id is not a string", async () => {
      await expect(
        verification.getLinkStore({ id: 123 as any })
      ).rejects.toThrow("Valid id is required");
    });
  });

  describe("postLinkStore", () => {
    const validOptions = {
      id: "sess-123",
      thid: "sess-123",
      type: "https://iden3-communication.io/authorization/1.0/request",
      from: "did:iden3:verifier",
      typ: "application/iden3comm-plain-json",
      body: {
        reason: "Verification",
        message: "",
        callbackUrl: "https://example.com/callback",
        scope: [
          {
            id: 1,
            circuitId: "credentialAtomicQuerySigV2",
            query: { type: "ProofOfAge", allowedIssuers: ["*"] },
          },
        ],
      },
    };

    it("should POST to /identity/verify/link-store", async () => {
      const mockResponse = {
        proofRequestUrl: "https://example.com/proof",
        iden3commUrl: "iden3comm://...",
      };
      (mockAxios.post as any).mockResolvedValue({ data: mockResponse });

      const result = await verification.postLinkStore(validOptions);

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/identity/verify/link-store",
        {
          id: validOptions.id,
          thid: validOptions.thid,
          type: validOptions.type,
          from: validOptions.from,
          typ: validOptions.typ,
          body: validOptions.body,
        },
        { headers: { "X-TrustID-Service": "identity:verification_link_store_post" } }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw if id is missing", async () => {
      await expect(
        verification.postLinkStore({ ...validOptions, id: "" })
      ).rejects.toThrow("Valid id is required");
    });

    it("should throw if body is missing", async () => {
      await expect(
        verification.postLinkStore({
          ...validOptions,
          body: null as any,
        })
      ).rejects.toThrow("Valid body object is required");
    });

    it("should throw if body.callbackUrl is missing", async () => {
      await expect(
        verification.postLinkStore({
          ...validOptions,
          body: { ...validOptions.body, callbackUrl: "" },
        })
      ).rejects.toThrow("Valid callbackUrl in body is required");
    });

    it("should throw if body.scope is not an array", async () => {
      await expect(
        verification.postLinkStore({
          ...validOptions,
          body: { ...validOptions.body, scope: "not-array" as any },
        })
      ).rejects.toThrow("Valid scope array in body is required");
    });
  });

  describe("verifyCallback", () => {
    it("should POST to /identity/verify/callback with sessionId param", async () => {
      const mockResponse = {
        id: "resp-123",
        typ: "application/iden3comm-plain-json",
        type: "https://iden3-communication.io/authorization/1.0/response",
        thid: "sess-123",
        body: {
          message: "verified",
          scope: [
            {
              id: 1,
              circuitId: "credentialAtomicQuerySigV2",
              proof: {
                pi_a: ["1", "2"],
                pi_b: [["3", "4"], ["5", "6"]],
                pi_c: ["7", "8"],
                protocol: "groth16",
                curve: "bn128",
              },
              pub_signals: ["sig1", "sig2"],
            },
          ],
        },
        from: "did:iden3:user",
        to: "did:iden3:verifier",
      };
      (mockAxios.post as any).mockResolvedValue({ data: mockResponse });

      const result = await verification.verifyCallback({
        sessionId: "sess-123",
        token: "jwz-token-abc",
      });

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/identity/verify/callback",
        { token: "jwz-token-abc" },
        {
          params: { sessionId: "sess-123" },
          headers: { "X-TrustID-Service": "identity:verification_callback" },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw if sessionId is missing", async () => {
      await expect(
        verification.verifyCallback({ sessionId: "", token: "abc" })
      ).rejects.toThrow("Valid session ID is required");
    });

    it("should throw if token is missing", async () => {
      await expect(
        verification.verifyCallback({ sessionId: "sess-1", token: "" })
      ).rejects.toThrow("Valid token (JWZ) is required");
    });

    it("should throw if sessionId is not a string", async () => {
      await expect(
        verification.verifyCallback({
          sessionId: 123 as any,
          token: "abc",
        })
      ).rejects.toThrow("Valid session ID is required");
    });

    it("should throw if token is not a string", async () => {
      await expect(
        verification.verifyCallback({
          sessionId: "sess-1",
          token: 123 as any,
        })
      ).rejects.toThrow("Valid token (JWZ) is required");
    });
  });
});
