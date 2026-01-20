# DCID Server SDK

A TypeScript/JavaScript SDK for interacting with the DCID Server API. This SDK provides a simple, type-safe interface for authentication and OTP operations.

## Installation

```bash
npm install @dcid/server-sdk
# or
yarn add @dcid/server-sdk
# or
pnpm add @dcid/server-sdk
```

## Quick Start

### ES Modules (Modern JavaScript/TypeScript)

```typescript
import { DCIDServerSDK } from "@dcid/server-sdk";

// Initialize the SDK
const sdk = new DCIDServerSDK({
  baseUrl: "https://api.dcid.com", // or 'http://localhost:4000' for local dev
});

// Register/Sign-in with OTP
await sdk.auth.registerOTP({ email: "user@example.com" });

// Confirm OTP and get tokens
const tokens = await sdk.auth.confirmOTP({
  email: "user@example.com",
  otp: "123456",
});

console.log("Access Token:", tokens.access_token);
console.log("Refresh Token:", tokens.refresh_token);
```

### CommonJS (Node.js)

```javascript
const { DCIDServerSDK } = require("@dcid/server-sdk");

// Initialize the SDK
const sdk = new DCIDServerSDK({
  baseUrl: "https://api.dcid.com",
});

// Use the SDK the same way...
await sdk.auth.registerOTP({ email: "user@example.com" });
```

## Universal Import Syntax

**The SDK automatically detects your module system!** Use the same import syntax regardless of whether you're using ES modules or CommonJS:

```typescript
// Works in both ES modules AND CommonJS projects
import { DCIDServerSDK } from "@dcid/server-sdk";
```

The SDK is built as a **dual package** that supports both:
- **ES Modules** (`import`/`export`) - for modern bundlers (Vite, Webpack 5, Rollup, etc.)
- **CommonJS** (`require`/`module.exports`) - for Node.js and older bundlers

When you import the SDK, Node.js or your bundler automatically selects the correct format based on your project's module system.

## API Reference

### Initialization

```typescript
const sdk = new DCIDServerSDK({
  environment?: "dev" | "prod", // Optional: Environment (default: "prod")
  apiKey: string, // Required: API key
  timeout?: number, // Optional: Request timeout (default: 30000ms)
  defaultHeaders?: Record<string, string>, // Optional: Default headers
  logger?: Logger, // Optional: Custom logger
  enableRequestLogging?: boolean, // Optional: Enable request logging
});
```

### Authentication Methods

#### `auth.registerOTP(options)`

Initiates OTP registration/sign-in process. Covers `POST /auth/sign-in/initiate`.

**Parameters:**

- `email?: string` - User's email address
- `phone?: string` - User's phone number (with country code)

**Returns:** `Promise<InitiateOTPResponse>`

- `otp?: string` - OTP code (only in dev environment)

**Example:**

```typescript
// With email
await sdk.auth.registerOTP({ email: "user@example.com" });

// With phone
await sdk.auth.registerOTP({ phone: "+1234567890" });
```

#### `auth.confirmOTP(options)`

Confirms OTP and completes registration/sign-in. Covers `POST /auth/sign-in/confirm`.

**Parameters:**

- `email?: string` - User's email address
- `phone?: string` - User's phone number
- `otp: string` - The OTP code received by the user

**Returns:** `Promise<TokenResponse>`

- `access_token: string` - JWT access token
- `refresh_token: string` - JWT refresh token

**Example:**

```typescript
const tokens = await sdk.auth.confirmOTP({
  email: "user@example.com",
  otp: "123456",
});

// Set tokens for authenticated requests
sdk.setTokens(tokens);
```

### Analytics Methods

```typescript
if (sdk.analytics) {
  // Start a session
  await sdk.analytics.startSession({
    user_id?: string;
    anonymous_id?: string;
    page_location?: string;
    page_title?: string;
    timestamp?: number;
    engagement_time_msec?: number;
    device_type?: string;
  });
}
```

### Identity Methods

#### Encryption

```typescript
// Generate encryption key (will auto-refresh token if expired)
await sdk.identity.encryption.generateKey({
  did: "did:iden3:dcid:main:...",
  ownerEmail: "user@example.com",
});

// Get encrypted key
await sdk.identity.encryption.getKey({
  did: "did:iden3:dcid:main:...",
});
```

#### Issuer

```typescript
// Issue a credential
await sdk.identity.issuer.issueCredential({
  did: "did:iden3:dcid:main:...",
  credentialName: "KYCAgeCredential",
  values: { birthday: 25, documentType: 2 },
});

// Get credential offer (for MTP credentials)
await sdk.identity.issuer.getCredentialOffer({
  claimId: "abc123...",
  txId: "0x1234567890abcdef...",
});
```

#### IPFS

```typescript
// Store credential to IPFS
await sdk.identity.ipfs.storeCredential({
  did: "did:iden3:dcid:main:...",
  credentialType: "KYCAgeCredential",
  credential: "U2FsdGVkX1+vupppZksvRf...",
  encrypted: true,
});

// Retrieve user credential
await sdk.identity.ipfs.retrieveUserCredential({
  did: "did:iden3:dcid:main:...",
  credentialType: "KYCAgeCredential",
  includeCidOnly: false,
});

// Get all user credentials
await sdk.identity.ipfs.getAllUserCredentials({
  did: "did:iden3:dcid:main:...",
  includeCredentialData: false,
});
```

## Test Server

The TypeScript SDK includes a test server that exposes HTTP endpoints for all SDK methods.

### Running the Test Server

```bash
# Navigate to test server directory
cd test_server

# Install dependencies
npm install

# Set environment variables
export DCID_API_KEY="your-api-key"
export DCID_ENVIRONMENT="dev"  # or "prod"
export PORT="8080"  # optional

# Run the server
npm run dev
```

The server will start on `http://localhost:8080`.

### Test Server Endpoints

The test server provides 21 endpoints covering all SDK functionality:

#### Authentication
- `POST /api/auth/register-otp` - Register OTP
- `POST /api/auth/confirm-otp` - Confirm OTP
- `POST /api/auth/admin-login` - Admin login
- `POST /api/auth/refresh-token` - Refresh token

#### Identity - Encryption
- `POST /api/identity/encryption/generate-key` - Generate encryption key
- `POST /api/identity/encryption/get-key` - Get encrypted key

#### Identity - Issuer
- `POST /api/identity/issuer/issue-credential` - Issue credential
- `GET /api/identity/issuer/get-credential-offer` - Get credential offer

#### Identity - IPFS
- `POST /api/identity/ipfs/store-credential` - Store credential
- `POST /api/identity/ipfs/retrieve-user-credential` - Retrieve user credential
- `POST /api/identity/ipfs/get-all-user-credentials` - Get all user credentials

#### Identity - Verification
- `POST /api/identity/verification/verify-sign-in` - Verify sign-in
- `GET /api/identity/verification/link-store` - Get link store
- `POST /api/identity/verification/link-store` - Post link store
- `POST /api/identity/verification/callback` - Verify callback

#### Analytics
- `POST /api/analytics/start-session` - Start session
- `POST /api/analytics/end-session` - End session

See [test_server/README.md](./test_server/README.md) for complete documentation.

## Module System Support

This SDK uses the **Package Exports** feature to automatically provide the correct module format:

- **ES Modules**: Automatically used when your project uses `import`/`export` or has `"type": "module"` in package.json
- **CommonJS**: Automatically used when your project uses `require()` or doesn't specify module type

You don't need to change your import syntax - it works the same way in both systems!

## TypeScript Support

Full TypeScript support is included. Types are automatically resolved based on your module system.

## License

ISC
