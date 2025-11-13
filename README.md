# TrustID PortalAPI SDK

A TypeScript/JavaScript SDK for interacting with the TrustID PortalAPI. This SDK provides a simple, type-safe interface for authentication and OTP operations.

## Installation

```bash
npm install @trustid/portalapi-sdk
# or
yarn add @trustid/portalapi-sdk
```

## Quick Start

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

## API Reference

### Initialization

```typescript
const sdk = new TrustIdSDK({
  baseUrl: string, // Required: API base URL
  timeout: number, // Optional: Request timeout (default: 30000ms)
  defaultHeaders: Record<string, string>, // Optional: Default headers
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

// Use tokens for authenticated requests
localStorage.setItem("access_token", tokens.access_token);
localStorage.setItem("refresh_token", tokens.refresh_token);
```

#### `auth.adminLogin(options)`

Admin OTP registration/sign-in initiation. Covers `POST /auth/sign-in/initiate?type=admin`.

Similar to `registerOTP()` but for admin users. After calling this, use `confirmOTP()` to complete the authentication.

**Parameters:**

- `email?: string` - Admin's email address
- `phone?: string` - Admin's phone number (with country code)

**Returns:** `Promise<InitiateOTPResponse>`

- `otp?: string` - OTP code (only in dev environment)

**Example:**

```typescript
// Step 1: Initiate admin OTP
const result = await sdk.auth.adminLogin({ email: "admin@example.com" });
// In dev: result.otp contains the code

// Step 2: Confirm OTP to get tokens
const tokens = await sdk.auth.confirmOTP({
  email: "admin@example.com",
  otp: result.otp || "123456",
});
```

#### `auth.refreshToken(options)`

Refreshes the access token using refresh token. Covers `POST /auth/refresh-token`.

**Parameters:**

- `refreshToken: string` - The refresh token

**Returns:** `Promise<TokenResponse>`

**Example:**

```typescript
const newTokens = await sdk.auth.refreshToken({
  refreshToken: "your-refresh-token",
});
```

## Error Handling

The SDK throws `TrustIdSDKError` for API errors:

```typescript
import { TrustIdSDKError } from "@trustid/portalapi-sdk";

try {
  await sdk.auth.confirmOTP({ email: "user@example.com", otp: "wrong" });
} catch (error) {
  if (error instanceof TrustIdSDKError) {
    console.error("API Error:", error.message);
    console.error("Status Code:", error.statusCode);
    console.error("Response:", error.response);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

## Complete Example

### Regular User Flow

```typescript
import { TrustIdSDK, TrustIdSDKError } from "@trustid/portalapi-sdk";

async function authenticateUser() {
  const sdk = new TrustIdSDK({
    baseUrl: "https://api.trustid.com",
  });

  try {
    // Step 1: Initiate OTP
    console.log("Sending OTP...");
    const initiateResult = await sdk.auth.registerOTP({
      email: "user@example.com",
    });
    console.log("OTP sent! Check your email.");
    if (initiateResult.otp) {
      console.log("Dev OTP:", initiateResult.otp);
    }

    // Step 2: Get OTP from user (in real app, from input)
    const otp = initiateResult.otp || "123456"; // User enters this

    // Step 3: Confirm OTP
    console.log("Confirming OTP...");
    const tokens = await sdk.auth.confirmOTP({
      email: "user@example.com",
      otp: otp,
    });

    console.log("Authentication successful!");
    console.log("Access Token:", tokens.access_token);

    // Step 4: Store tokens
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);

    // Step 5: Refresh token when needed
    const newTokens = await sdk.auth.refreshToken({
      refreshToken: tokens.refresh_token,
    });

    console.log("Token refreshed!");
  } catch (error) {
    if (error instanceof TrustIdSDKError) {
      console.error("API Error:", error.message);
    } else {
      console.error("Error:", error);
    }
  }
}

authenticateUser();
```

### Admin User Flow

```typescript
import { TrustIdSDK, TrustIdSDKError } from "@trustid/portalapi-sdk";

async function authenticateAdmin() {
  const sdk = new TrustIdSDK({
    baseUrl: "https://api.trustid.com",
  });

  try {
    // Step 1: Initiate admin OTP
    console.log("Sending admin OTP...");
    const initiateResult = await sdk.auth.adminLogin({
      email: "admin@example.com",
    });
    console.log("OTP sent! Check your email.");
    if (initiateResult.otp) {
      console.log("Dev OTP:", initiateResult.otp);
    }

    // Step 2: Get OTP from admin (in real app, from input)
    const otp = initiateResult.otp || "123456";

    // Step 3: Confirm OTP
    console.log("Confirming OTP...");
    const tokens = await sdk.auth.confirmOTP({
      email: "admin@example.com",
      otp: otp,
    });

    console.log("Admin authentication successful!");
    console.log("Access Token:", tokens.access_token);
  } catch (error) {
    if (error instanceof TrustIdSDKError) {
      console.error("API Error:", error.message);
    } else {
      console.error("Error:", error);
    }
  }
}

authenticateAdmin();
```

## Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

## License

ISC
