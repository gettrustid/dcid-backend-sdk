# SDK Language Comparison

This document provides a comparison of the DCID Backend SDK across TypeScript, Python, and Go implementations.

## Installation

| Language   | Installation Command                        |
|------------|---------------------------------------------|
| TypeScript | `npm install @dcid/backend-sdk`        |
| Python     | `pip install dcid-backend-sdk`         |
| Go         | `go get github.com/getdcid/dcid-backend-sdk`  |

## Initialization

### TypeScript
```typescript
import { DCIDBackendSDK } from '@dcid/backend-sdk';

const sdk = new DCIDBackendSDK({
  apiKey: 'your-api-key',
  environment: 'prod'
});
```

### Python
```python
from dcid_backend_sdk import DCIDBackendSDK

sdk = DCIDBackendSDK(
    api_key='your-api-key',
    environment='prod'
)
```

### Go
```go
import "github.com/getdcid/dcid-backend-sdk/golang/pkg/trustid"

sdk, err := dcid.NewClient(dcid.Config{
    APIKey:      "your-api-key",
    Environment: dcid.EnvironmentProd,
})
```

## OTP Registration/Sign-in

### TypeScript
```typescript
// Register OTP
await sdk.auth.registerOTP({ email: 'user@example.com' });

// Confirm OTP
const tokens = await sdk.auth.confirmOTP({
  email: 'user@example.com',
  otp: '123456'
});
```

### Python
```python
from dcid_backend_sdk import InitiateOTPOptions, ConfirmOTPOptions

# Register OTP
sdk.auth.register_otp(InitiateOTPOptions(email='user@example.com'))

# Confirm OTP
tokens = sdk.auth.confirm_otp(
    ConfirmOTPOptions(email='user@example.com', otp='123456')
)
```

### Go
```go
// Register OTP
result, err := sdk.Auth.RegisterOTP(dcid.RegisterOTPOptions{
    Email: "user@example.com",
})

// Confirm OTP
tokens, err := sdk.Auth.ConfirmOTP(dcid.ConfirmOTPOptions{
    Email: "user@example.com",
    OTP:   "123456",
})
```

## Generate Encryption Key

### TypeScript
```typescript
await sdk.identity.encryption.generateKey({
  did: 'did:iden3:trustid:main:...',
  ownerEmail: 'user@example.com'
});
```

### Python
```python
from dcid_backend_sdk import GenerateEncryptionKeyOptions

sdk.identity.encryption.generate_key(
    GenerateEncryptionKeyOptions(
        did='did:iden3:trustid:main:...',
        owner_email='user@example.com'
    )
)
```

### Go
```go
result, err := sdk.Identity.Encryption.GenerateKey(dcid.GenerateEncryptionKeyOptions{
    DID:        "did:iden3:trustid:main:...",
    OwnerEmail: "user@example.com",
})
```

## Issue Credential

### TypeScript
```typescript
await sdk.identity.issuer.issueCredential({
  did: 'did:iden3:trust-id:main:...',
  credentialName: 'KYCAgeCredential',
  values: { birthday: 25, documentType: 2 },
  ownerEmail: 'user@example.com'
});
```

### Python
```python
from dcid_backend_sdk import IssueCredentialOptions

sdk.identity.issuer.issue_credential(
    IssueCredentialOptions(
        did='did:iden3:trust-id:main:...',
        credential_name='KYCAgeCredential',
        values={'birthday': 25, 'documentType': 2},
        owner_email='user@example.com'
    )
)
```

### Go
```go
result, err := sdk.Identity.Issuer.IssueCredential(dcid.IssueCredentialOptions{
    DID:            "did:iden3:trust-id:main:...",
    CredentialName: "KYCAgeCredential",
    Values: map[string]interface{}{
        "birthday":     25,
        "documentType": 2,
    },
    OwnerEmail: "user@example.com",
})
```

## Start Analytics Session

### TypeScript
```typescript
await sdk.analytics.startSession({
  user_id: 'user123',
  page_location: 'https://example.com'
});
```

### Python
```python
from dcid_backend_sdk.modules.analytics.types import StartSessionEvent

sdk.analytics.start_session(
    StartSessionEvent(
        user_id='user123',
        page_location='https://example.com'
    )
)
```

### Go
```go
result, err := sdk.Analytics.StartSession(&dcid.StartSessionOptions{
    UserID:       "user123",
    PageLocation: "https://example.com",
})
```

## Test Server Endpoints

All three implementations provide identical REST API endpoints through their test servers:

| Endpoint                                          | Method | Description            |
|---------------------------------------------------|--------|------------------------|
| `/health`                                         | GET    | Health check           |
| `/api/auth/register-otp`                          | POST   | Register OTP           |
| `/api/auth/confirm-otp`                           | POST   | Confirm OTP            |
| `/api/auth/admin-login`                           | POST   | Admin login            |
| `/api/auth/refresh-token`                         | POST   | Refresh token          |
| `/api/identity/encryption/generate-key`           | POST   | Generate encryption key|
| `/api/identity/encryption/get-key`                | POST   | Get encrypted key      |
| `/api/identity/issuer/issue-credential`           | POST   | Issue credential       |
| `/api/identity/issuer/get-credential-offer`       | GET    | Get credential offer   |
| `/api/identity/ipfs/store-credential`             | POST   | Store credential       |
| `/api/identity/ipfs/retrieve-user-credential`     | POST   | Retrieve credential    |
| `/api/identity/ipfs/get-all-user-credentials`     | POST   | Get all credentials    |
| `/api/identity/verification/verify-sign-in`       | POST   | Verify sign-in         |
| `/api/identity/verification/link-store`           | GET/POST| Link store operations |
| `/api/identity/verification/callback`             | POST   | Verify callback        |
| `/api/analytics/start-session`                    | POST   | Start session          |
| `/api/analytics/end-session`                      | POST   | End session            |

## Running Test Servers

### TypeScript (if implemented)
```bash
cd typescript
npm run dev
```

### Python
```bash
cd python
export DCID_API_KEY="your-api-key"
export DCID_ENVIRONMENT="dev"
python test_server/main.py
```

### Go
```bash
cd golang
export DCID_API_KEY="your-api-key"
export DCID_ENVIRONMENT="dev"
go run cmd/test-server/main.go
```

All servers run on port 8080 by default.

## Key Features

| Feature                    | TypeScript | Python | Go  |
|----------------------------|-----------|--------|-----|
| OTP Authentication         | ✅        | ✅     | ✅  |
| Token Refresh              | ✅        | ✅     | ✅  |
| Encryption Key Management  | ✅        | ✅     | ✅  |
| Credential Issuance        | ✅        | ✅     | ✅  |
| IPFS Storage               | ✅        | ✅     | ✅  |
| Verification               | ✅        | ✅     | ✅  |
| Analytics                  | ✅        | ✅     | ✅  |
| Automatic Token Refresh    | ✅        | ✅     | ✅  |
| Error Handling             | ✅        | ✅     | ✅  |
| Request Logging            | ✅        | ✅     | ✅  |
| Type Safety                | ✅        | ✅     | ✅  |
| Test Server                | ❌        | ✅     | ✅  |

## Naming Conventions

### API Fields
- **TypeScript**: camelCase (e.g., `ownerEmail`, `credentialName`)
- **Python**: snake_case (e.g., `owner_email`, `credential_name`)
- **Go**: PascalCase (e.g., `OwnerEmail`, `CredentialName`)

### Module Organization
- **TypeScript**: `sdk.identity.encryption.generateKey()`
- **Python**: `sdk.identity.encryption.generate_key()`
- **Go**: `sdk.Identity.Encryption.GenerateKey()`

## Error Handling

All three implementations provide similar error types:

- `DCIDBackendSDKError` / `SDKError`: Base error class
- `NetworkError`: Network connectivity issues
- `AuthenticationError`: API-KEY or JWT token issues
- `ServerError`: Backend or gateway errors

The error handling approach is consistent across all implementations, making it easy to handle errors in the same way regardless of the language used.
