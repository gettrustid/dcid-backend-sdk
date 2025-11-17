# TrustID PortalAPI SDK

A TypeScript/JavaScript SDK for interacting with the TrustID PortalAPI. This SDK provides a simple, type-safe interface for authentication and OTP operations.

## Installation

```bash
npm install @trustid/portalapi-sdk
# or
yarn add @trustid/portalapi-sdk
# or
pnpm add @trustid/portalapi-sdk
```

## Quick Start

### ES Modules (Modern JavaScript/TypeScript)

```typescript
import { TrustIdSDK } from "@trustid/portalapi-sdk";

// Initialize the SDK
const sdk = new TrustIdSDK({
  baseUrl: "https://api.trustid.com", // or 'http://localhost:4000' for local dev
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
const { TrustIdSDK } = require("@trustid/portalapi-sdk");

// Initialize the SDK
const sdk = new TrustIdSDK({
  baseUrl: "https://api.trustid.com",
});

// Use the SDK the same way...
await sdk.auth.registerOTP({ email: "user@example.com" });
```

## Universal Import Syntax

**The SDK automatically detects your module system!** Use the same import syntax regardless of whether you're using ES modules or CommonJS:

```typescript
// Works in both ES modules AND CommonJS projects
import { TrustIdSDK } from "@trustid/portalapi-sdk";
```

The SDK is built as a **dual package** that supports both:
- **ES Modules** (`import`/`export`) - for modern bundlers (Vite, Webpack 5, Rollup, etc.)
- **CommonJS** (`require`/`module.exports`) - for Node.js and older bundlers

When you import the SDK, Node.js or your bundler automatically selects the correct format based on your project's module system.

## API Reference

### Initialization

```typescript
const sdk = new TrustIdSDK({
  baseUrl: string, // Required: API base URL
  sgtmProxyBaseUrl?: string, // Optional: SGTM proxy URL for analytics
  timeout?: number, // Optional: Request timeout (default: 30000ms)
  defaultHeaders?: Record<string, string>, // Optional: Default headers
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

If `sgtmProxyBaseUrl` is configured, you can use analytics methods:

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

### Encryption Methods

```typescript
// Generate encryption key (will auto-refresh token if expired)
await sdk.encryption.generateKey({
  did: "did:iden3:trustid:main:...",
  ownerEmail: "user@example.com",
});
```

## Module System Support

This SDK uses the **Package Exports** feature to automatically provide the correct module format:

- **ES Modules**: Automatically used when your project uses `import`/`export` or has `"type": "module"` in package.json
- **CommonJS**: Automatically used when your project uses `require()` or doesn't specify module type

You don't need to change your import syntax - it works the same way in both systems!

## TypeScript Support

Full TypeScript support is included. Types are automatically resolved based on your module system.

## License

ISC
