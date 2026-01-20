# DCID Backend SDK Test Server - TypeScript

An Express-based test server that exposes HTTP endpoints for all DCID Backend SDK methods.

## Features

- Complete coverage of all SDK methods
- RESTful API endpoints
- Automatic error handling
- Request/response logging
- Compatible with Python and Go test servers

## Quick Start

### Installation

```bash
# Install dependencies
npm install
```

### Configuration

Set the required environment variables:

```bash
export DCID_API_KEY="your-api-key"
export DCID_ENVIRONMENT="dev"  # or "prod"
export PORT="8080"  # optional
```

Or create a `.env` file:

```
DCID_API_KEY=your-api-key
DCID_ENVIRONMENT=dev
PORT=8080
```

### Running the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

The server will start on `http://localhost:8080`.

## API Endpoints

The test server provides the following endpoints:

### Health Check
- `GET /health` - Health check endpoint

### Authentication
- `POST /api/auth/register-otp` - Register OTP
- `POST /api/auth/confirm-otp` - Confirm OTP
- `POST /api/auth/admin-login` - Admin login
- `POST /api/auth/refresh-token` - Refresh token

### Identity - Encryption
- `POST /api/identity/encryption/generate-key` - Generate encryption key
- `POST /api/identity/encryption/get-key` - Get encrypted key

### Identity - Issuer
- `POST /api/identity/issuer/issue-credential` - Issue credential
- `GET /api/identity/issuer/get-credential-offer` - Get credential offer

### Identity - IPFS
- `POST /api/identity/ipfs/store-credential` - Store credential
- `POST /api/identity/ipfs/retrieve-user-credential` - Retrieve user credential
- `POST /api/identity/ipfs/get-all-user-credentials` - Get all user credentials

### Identity - Verification
- `POST /api/identity/verification/verify-sign-in` - Verify sign-in
- `GET /api/identity/verification/link-store` - Get link store
- `POST /api/identity/verification/link-store` - Post link store
- `POST /api/identity/verification/callback` - Verify callback

### Analytics
- `POST /api/analytics/start-session` - Start session
- `POST /api/analytics/end-session` - End session

## Example Requests

### Health Check

```bash
curl http://localhost:8080/health
```

### Register OTP

```bash
curl -X POST http://localhost:8080/api/auth/register-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Confirm OTP

```bash
curl -X POST http://localhost:8080/api/auth/confirm-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456"
  }'
```

### Generate Encryption Key

```bash
curl -X POST http://localhost:8080/api/identity/encryption/generate-key \
  -H "Content-Type: application/json" \
  -d '{
    "did": "did:iden3:dcid:main:...",
    "ownerEmail": "user@example.com"
  }'
```

### Start Analytics Session

```bash
curl -X POST http://localhost:8080/api/analytics/start-session \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "page_location": "https://example.com"
  }'
```

## Error Handling

The server returns consistent error responses:

```json
{
  "error": "Error message",
  "type": "ErrorType"
}
```

Error types:
- `AuthenticationError`: API-KEY or JWT token issues
- `NetworkError`: Network connectivity issues
- `ServerError`: Backend or gateway errors
- `SDKError`: General SDK errors
- `UnknownError`: Unexpected errors

## Development

### Watch Mode

```bash
npm run watch
```

This will watch for TypeScript changes and rebuild automatically.

### TypeScript Configuration

The project uses TypeScript with strict mode enabled. See `tsconfig.json` for configuration details.

## Project Structure

```
test_server/
├── index.ts           # Main server file
├── dist/             # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Comparison with Other Implementations

This TypeScript test server follows the same structure and endpoints as the Python (FastAPI) and Go test servers, ensuring API compatibility across all three implementations.

| Feature | TypeScript | Python | Go |
|---------|-----------|--------|-----|
| Framework | Express | FastAPI | net/http |
| Port | 8080 | 8080 | 8080 |
| Endpoints | 21 | 21 | 21 |
| Error Handling | ✅ | ✅ | ✅ |
| Auto Documentation | ❌ | ✅ Swagger | ❌ |

## License

ISC
