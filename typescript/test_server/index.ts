/**
 * Test server for DCID Server TypeScript SDK
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { DCIDServerSDK } from "../dist/cjs";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Get API key from environment
const apiKey = process.env.DCID_API_KEY;
if (!apiKey) {
  console.error("DCID_API_KEY environment variable is required");
  process.exit(1);
}

const environment =
  (process.env.DCID_ENVIRONMENT as "dev" | "prod") || "dev";

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SDK instance
const sdk = new DCIDServerSDK({
  environment,
  apiKey,
  timeout: parseInt(process.env.SDK_TIMEOUT || "30000"),
});

// Error handler middleware
const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err);

  // Handle different SDK error types
  if (err.name === "AuthenticationError") {
    return res.status(err.statusCode || 401).json({
      error: err.message,
      type: "AuthenticationError",
      isAPIKeyError: (err as any).isApiKeyError,
    });
  } else if (err.name === "NetworkError") {
    return res.status(502).json({
      error: err.message,
      type: "NetworkError",
      code: (err as any).code,
    });
  } else if (err.name === "ServerError") {
    return res.status(err.statusCode || 500).json({
      error: err.message,
      type: "ServerError",
    });
  } else if (err.name === "DCIDServerSDKError") {
    return res.status(err.statusCode || 500).json({
      error: err.message,
      type: "SDKError",
    });
  }

  res.status(err.statusCode || 500).json({
    error: err.message || "Internal server error",
    type: "UnknownError",
  });
};

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "dcid-server-sdk-test-server",
  });
});

// ============================================================================
// AUTH ROUTES
// ============================================================================

app.post("/api/auth/register-otp", async (req, res, next) => {
  try {
    const result = await sdk.auth.registerOTP(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/confirm-otp", async (req, res, next) => {
  try {
    const result = await sdk.auth.confirmOTP(req.body);
    // Tokens are automatically set in SDK context
    sdk.setTokens(result);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/admin-login", async (req, res, next) => {
  try {
    const result = await sdk.auth.adminLogin(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/refresh-token", async (req, res, next) => {
  try {
    const result = await sdk.auth.refreshToken(req.body);
    sdk.setTokens(result);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// IDENTITY - ENCRYPTION ROUTES
// ============================================================================

app.post("/api/identity/encryption/generate-key", async (req, res, next) => {
  try {
    const result = await sdk.identity.encryption.generateKey(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/identity/encryption/get-key", async (req, res, next) => {
  try {
    const result = await sdk.identity.encryption.getKey(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// IDENTITY - ISSUER ROUTES
// ============================================================================

app.post("/api/identity/issuer/issue-credential", async (req, res, next) => {
  try {
    const result = await sdk.identity.issuer.issueCredential(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/api/identity/issuer/get-credential-offer", async (req, res, next) => {
  try {
    const result = await sdk.identity.issuer.getCredentialOffer(
      req.query as any
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// IDENTITY - IPFS ROUTES
// ============================================================================

app.post("/api/identity/ipfs/store-credential", async (req, res, next) => {
  try {
    const result = await sdk.identity.ipfs.storeCredential(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/identity/ipfs/retrieve-user-credential",
  async (req, res, next) => {
    try {
      const result = await sdk.identity.ipfs.retrieveUserCredential(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/identity/ipfs/get-all-user-credentials",
  async (req, res, next) => {
    try {
      const result = await sdk.identity.ipfs.getAllUserCredentials(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// IDENTITY - VERIFICATION ROUTES
// ============================================================================

app.post(
  "/api/identity/verification/verify-sign-in",
  async (req, res, next) => {
    try {
      const result = await sdk.identity.verification.verifySignIn(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

app.get("/api/identity/verification/link-store", async (req, res, next) => {
  try {
    const result = await sdk.identity.verification.getLinkStore(
      req.query as any
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/identity/verification/link-store", async (req, res, next) => {
  try {
    const result = await sdk.identity.verification.postLinkStore(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/identity/verification/callback", async (req, res, next) => {
  try {
    const result = await sdk.identity.verification.verifyCallback({
      ...req.body,
      sessionId: req.query.sessionId as string,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// ANALYTICS ROUTES
// ============================================================================

app.post("/api/analytics/start-session", async (req, res, next) => {
  try {
    if (!sdk.analytics) {
      return res
        .status(503)
        .json({ error: "Analytics module not available" });
    }
    const result = await sdk.analytics.startSession(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/analytics/end-session", async (req, res, next) => {
  try {
    if (!sdk.analytics) {
      return res
        .status(503)
        .json({ error: "Analytics module not available" });
    }
    const result = await sdk.analytics.endSession(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`DCID Server SDK Test Server running on port ${PORT}`);
  console.log(`SDK Environment: ${environment}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
