# DCID Backend SDK Test Server

A Go HTTP server for testing the DCID Backend Go SDK. This server provides REST endpoints that use the SDK to interact with the DCID Backend API.

## Quick Start with Docker Desktop

### Prerequisites

- Docker Desktop installed and running on Windows
- DCID Backend API key

### Steps

1. **Set up environment variables**

   Create a `.env` file in the `golang/` directory (or copy from `env.example`):

   ```env
   DCID_API_KEY=your-api-key-here
   DCID_ENVIRONMENT=dev
   DCID_BASE_URL=http://host.docker.internal:5000/api
   PORT=8080
   ```

   **Note:** If KrakenD is running in another Docker container:
   - Option 1: Use `host.docker.internal:5000` (default, works if KrakenD is on host or port-forwarded)
   - Option 2: Connect to the same Docker network (see "Connecting to KrakenD Container" below)

2. **Build and run with Docker Compose**

   ```bash
   cd golang
   docker-compose up --build
   ```

   The server will start on `http://localhost:8080`

3. **Test the server**

   ```bash
   # Health check
   curl http://localhost:8080/health

   # Register OTP
   curl -X POST http://localhost:8080/auth/register-otp \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com"}'

   # Confirm OTP (use OTP from previous response)
   curl -X POST http://localhost:8080/auth/confirm-otp \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "otp": "123456"}'
   ```

## API Endpoints

### Health Check

```
GET /health
```

Returns server status.

### Authentication

#### Register OTP

```
POST /auth/register-otp
Content-Type: application/json

{
  "email": "user@example.com"
  // or
  "phone": "+1234567890"
}
```

#### Confirm OTP

```
POST /auth/confirm-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

#### Admin Login

```
POST /auth/admin-login
Content-Type: application/json

{
  "email": "admin@example.com"
}
```

#### Refresh Token

```
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Analytics

#### Start Session

```
POST /analytics/start-session
Content-Type: application/json

{
  "user_id": "user123",
  "anonymous_id": "anon-123",
  "page_location": "https://example.com/page"
}
```

## Running Locally (without Docker)

```bash
cd golang

# Set environment variables
export DCID_API_KEY=your-api-key-here
export DCID_ENVIRONMENT=dev
export PORT=8080

# Run the server
go run ./cmd/test-server
```

## Building Docker Image Manually

```bash
cd golang
docker build -t dcid-sdk-test-server .
docker run -p 8080:8080 \
  -e DCID_API_KEY=your-api-key-here \
  -e DCID_ENVIRONMENT=dev \
  dcid-sdk-test-server
```

## Connecting to KrakenD Container

If KrakenD is running in another Docker container, you have two options:

### Option 1: Use host.docker.internal (Default)

This works if KrakenD's port 5000 is exposed to the host. The default configuration already uses this.

### Option 2: Connect to Same Docker Network

If KrakenD is on a specific Docker network, connect the test server to that network:

1. **Find KrakenD's network:**
   ```bash
   docker inspect <krakend-container-name> | grep NetworkMode
   ```

2. **Update docker-compose.yml** to use an external network:
   ```yaml
   services:
     test-server:
       # ... other config ...
       networks:
         - krakend-network  # Use KrakenD's network name
   
   networks:
     krakend-network:
       external: true  # Use existing network
   ```

3. **Update DCID_BASE_URL** to use KrakenD's container name:
   ```env
   DCID_BASE_URL=http://krakend-container-name:5000/api
   ```

## Stopping the Server

Press `Ctrl+C` or run:

```bash
docker-compose down
```



