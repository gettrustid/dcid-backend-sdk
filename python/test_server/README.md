# DCID Backend SDK Test Server

A FastAPI-based test server that exposes HTTP endpoints for all DCID Backend SDK methods.

## Features

- Complete coverage of all SDK methods
- RESTful API endpoints
- Automatic error handling
- Request/response logging
- Compatible with the TypeScript and Go test servers

## Quick Start

### Installation

```bash
# Install dependencies
pip install -r requirements-server.txt
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
# Using Python
python test_server/main.py

# Or using uvicorn directly
uvicorn test_server.main:app --host 0.0.0.0 --port 8080 --reload
```

The server will start on `http://localhost:8080`.

## API Documentation

Once the server is running, you can access the interactive API documentation at:

- Swagger UI: `http://localhost:8080/docs`
- ReDoc: `http://localhost:8080/redoc`

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
    "userId": "user123",
    "pageLocation": "https://example.com"
  }'
```

## Endpoints

### Authentication
- `POST /api/auth/register-otp`
- `POST /api/auth/confirm-otp`
- `POST /api/auth/admin-login`
- `POST /api/auth/refresh-token`

### Identity - Encryption
- `POST /api/identity/encryption/generate-key`
- `POST /api/identity/encryption/get-key`

### Identity - Issuer
- `POST /api/identity/issuer/issue-credential`
- `GET /api/identity/issuer/get-credential-offer`

### Identity - IPFS
- `POST /api/identity/ipfs/store-credential`
- `POST /api/identity/ipfs/retrieve-user-credential`
- `POST /api/identity/ipfs/get-all-user-credentials`

### Identity - Verification
- `POST /api/identity/verification/verify-sign-in`
- `GET /api/identity/verification/link-store`
- `POST /api/identity/verification/link-store`
- `POST /api/identity/verification/callback`

### Analytics
- `POST /api/analytics/start-session`
- `POST /api/analytics/end-session`

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
