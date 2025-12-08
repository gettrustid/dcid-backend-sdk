# TrustID SDK - Go

Go SDK for interacting with the TrustID PortalAPI. This SDK provides a simple, type-safe interface for authentication, identity management, and analytics operations.

## Status

🚧 **Work in Progress** - Core structure is in place. HTTP client and module implementations are coming next.

## Installation

```bash
go get github.com/gettrustid/trustid-sdk/golang/pkg/trustid
```

## Quick Start

```go
package main

import (
    "fmt"
    "log"
    
    "github.com/gettrustid/trustid-sdk/golang/pkg/trustid"
)

func main() {
    // Initialize the SDK
    client, err := trustid.NewClient(trustid.Config{
        Environment: trustid.EnvironmentDev,
        APIKey:      "your-api-key-here",
    })
    if err != nil {
        log.Fatal(err)
    }

    // Register OTP
    result, err := client.Auth.RegisterOTP(trustid.RegisterOTPOptions{
        Email: stringPtr("user@example.com"),
    })
    if err != nil {
        log.Fatal(err)
    }

    // Confirm OTP
    tokens, err := client.Auth.ConfirmOTP(trustid.ConfirmOTPOptions{
        Email: stringPtr("user@example.com"),
        OTP:   "123456",
    })
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Access Token: %s\n", tokens.AccessToken)
}

func stringPtr(s string) *string {
    return &s
}
```

## Features

- ✅ **Authentication**: OTP-based registration/sign-in
- 🚧 **Identity Management**: Encryption, credential issuance, IPFS storage, verification
- 🚧 **Analytics**: Session tracking and event tracking
- 🚧 **HTTP Client**: Automatic token refresh, error handling, logging

## API Reference

### Configuration

```go
type Config struct {
    Environment Environment // "dev" or "prod"
    APIKey      string      // Required
    Timeout     time.Duration // Optional, default 30s
    Logger      Logger      // Optional logger
    EnableRequestLogging *bool // Optional, default false in prod, true in dev
}
```

### Authentication

```go
// Register OTP
result, err := client.Auth.RegisterOTP(trustid.RegisterOTPOptions{
    Email: stringPtr("user@example.com"),
    // or Phone: stringPtr("+1234567890"),
})

// Confirm OTP
tokens, err := client.Auth.ConfirmOTP(trustid.ConfirmOTPOptions{
    Email: stringPtr("user@example.com"),
    OTP:   "123456",
})

// Admin Login
result, err := client.Auth.AdminLogin(trustid.RegisterOTPOptions{
    Email: stringPtr("admin@example.com"),
})

// Refresh Token
tokens, err := client.Auth.RefreshToken(trustid.RefreshTokenOptions{
    RefreshToken: "your-refresh-token",
})
```

### Identity Management

```go
// Encryption
key, err := client.Identity.Encryption.GenerateKey(...)

// Issuer
credential, err := client.Identity.Issuer.IssueCredential(...)

// IPFS
cid, err := client.Identity.IPFS.StoreCredential(...)

// Verification
session, err := client.Identity.Verification.VerifySignIn(...)
```

### Analytics

```go
// Start Session
session, err := client.Analytics.StartSession(&trustid.StartSessionOptions{
    UserID:      stringPtr("user123"),
    AnonymousID: stringPtr("anon-123"),
})
```

## Error Handling

The SDK provides custom error types:

- `SDKError` - Base error type
- `NetworkError` - Network-related errors
- `AuthenticationError` - Authentication errors (API key or token issues)
- `ServerError` - Server errors

```go
tokens, err := client.Auth.ConfirmOTP(...)
if err != nil {
    var authErr *trustid.AuthenticationError
    if errors.As(err, &authErr) {
        fmt.Printf("Auth error: %s (API Key Error: %v)\n", authErr.Error(), authErr.IsAPIKeyError)
    }
    return err
}
```

## Development

This SDK is part of a monorepo. See the root [README](../README.md) for more information.

## License

ISC



