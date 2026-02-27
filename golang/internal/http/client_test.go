package http

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"
)

// noopLogger satisfies the Logger interface for tests.
type noopLogger struct{}

func (l *noopLogger) Debug(msg string, fields map[string]interface{}) {}
func (l *noopLogger) Info(msg string, fields map[string]interface{})  {}
func (l *noopLogger) Error(msg string, fields map[string]interface{}) {}

func newTestHTTPClient(serverURL string, opts ...func(*Client)) *Client {
	c := NewClient(
		serverURL,
		"test-api-key",
		"",
		5*time.Second,
		&noopLogger{},
		false,
		nil, nil, nil, nil,
	)
	for _, opt := range opts {
		opt(c)
	}
	return c
}

// ---------------------------------------------------------------------------
// POST / GET basics
// ---------------------------------------------------------------------------

func TestPost_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("expected POST, got %s", r.Method)
		}
		body, _ := io.ReadAll(r.Body)
		var payload map[string]interface{}
		json.Unmarshal(body, &payload)
		if payload["name"] != "test" {
			t.Errorf("unexpected body: %s", body)
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(200)
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	}))
	defer server.Close()

	c := newTestHTTPClient(server.URL)
	var resp map[string]string
	err := c.Post("/test", map[string]string{"name": "test"}, &resp)
	if err != nil {
		t.Fatal(err)
	}
	if resp["status"] != "ok" {
		t.Errorf("unexpected response: %v", resp)
	}
}

func TestGet_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" {
			t.Errorf("expected GET, got %s", r.Method)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"data": "value"})
	}))
	defer server.Close()

	c := newTestHTTPClient(server.URL)
	var resp map[string]string
	err := c.Get("/resource", &resp)
	if err != nil {
		t.Fatal(err)
	}
	if resp["data"] != "value" {
		t.Errorf("unexpected response: %v", resp)
	}
}

// ---------------------------------------------------------------------------
// Header verification
// ---------------------------------------------------------------------------

func TestRequest_SetsRequiredHeaders(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if ct := r.Header.Get("Content-Type"); ct != "application/json" {
			t.Errorf("Content-Type = %q", ct)
		}
		if acc := r.Header.Get("Accept"); acc != "application/json" {
			t.Errorf("Accept = %q", acc)
		}
		if key := r.Header.Get("X-API-Key"); key != "my-key" {
			t.Errorf("X-API-Key = %q", key)
		}
		w.WriteHeader(200)
		w.Write([]byte("{}"))
	}))
	defer server.Close()

	c := NewClient(server.URL, "my-key", "", 5*time.Second, &noopLogger{}, false, nil, nil, nil, nil)
	var resp json.RawMessage
	if err := c.Get("/headers", &resp); err != nil {
		t.Fatal(err)
	}
}

func TestRequest_BearerToken(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		if auth != "Bearer my-token" {
			t.Errorf("Authorization = %q, want Bearer my-token", auth)
		}
		w.WriteHeader(200)
		w.Write([]byte("{}"))
	}))
	defer server.Close()

	c := newTestHTTPClient(server.URL, func(cl *Client) {
		cl.getAuthToken = func() string { return "my-token" }
	})
	var resp json.RawMessage
	if err := c.Get("/auth", &resp); err != nil {
		t.Fatal(err)
	}
}

func TestRequest_NoBearerTokenWhenNil(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		if auth != "" {
			t.Errorf("expected no Authorization header, got %q", auth)
		}
		w.WriteHeader(200)
		w.Write([]byte("{}"))
	}))
	defer server.Close()

	c := newTestHTTPClient(server.URL) // no getAuthToken
	var resp json.RawMessage
	if err := c.Get("/no-auth", &resp); err != nil {
		t.Fatal(err)
	}
}

func TestRequest_NoBearerTokenWhenEmpty(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		if auth != "" {
			t.Errorf("expected no Authorization header, got %q", auth)
		}
		w.WriteHeader(200)
		w.Write([]byte("{}"))
	}))
	defer server.Close()

	c := newTestHTTPClient(server.URL, func(cl *Client) {
		cl.getAuthToken = func() string { return "" }
	})
	var resp json.RawMessage
	if err := c.Get("/empty-auth", &resp); err != nil {
		t.Fatal(err)
	}
}

// ---------------------------------------------------------------------------
// 401 auto-refresh + retry
// ---------------------------------------------------------------------------

func TestRequest_401AutoRefreshRetry(t *testing.T) {
	var callCount int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		n := atomic.AddInt32(&callCount, 1)
		if n == 1 {
			// First call: return 401
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(401)
			w.Write([]byte(`{"error":"unauthorized"}`))
			return
		}
		// Retry: check new token
		auth := r.Header.Get("Authorization")
		if auth != "Bearer new-access-token" {
			t.Errorf("retry Authorization = %q", auth)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	}))
	defer server.Close()

	currentToken := "old-token"
	c := newTestHTTPClient(server.URL, func(cl *Client) {
		cl.getAuthToken = func() string { return currentToken }
		cl.getRefreshToken = func() string { return "refresh-token" }
		cl.refreshTokenCallback = func(rt string) (*TokenResponse, error) {
			if rt != "refresh-token" {
				t.Errorf("unexpected refresh token: %s", rt)
			}
			return &TokenResponse{
				AccessToken:  "new-access-token",
				RefreshToken: "new-refresh-token",
			}, nil
		}
		cl.onTokenRefreshed = func(tokens *TokenResponse) {
			currentToken = tokens.AccessToken
		}
	})

	var resp map[string]string
	err := c.Get("/protected", &resp)
	if err != nil {
		t.Fatal(err)
	}
	if resp["status"] != "ok" {
		t.Errorf("unexpected response: %v", resp)
	}
}

func TestRequest_401NoRefreshCallback_ReturnsError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(401)
		w.Write([]byte(`{"message":"unauthorized"}`))
	}))
	defer server.Close()

	c := newTestHTTPClient(server.URL) // no refresh callback
	var resp json.RawMessage
	err := c.Get("/protected", &resp)
	if err == nil {
		t.Fatal("expected error")
	}
	httpErr, ok := err.(*HTTPError)
	if !ok {
		t.Fatalf("expected *HTTPError, got %T", err)
	}
	if httpErr.StatusCode != 401 {
		t.Errorf("expected 401, got %d", httpErr.StatusCode)
	}
}

func TestRequest_401RefreshFails_ReturnsError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(401)
		w.Write([]byte(`{"message":"unauthorized"}`))
	}))
	defer server.Close()

	c := newTestHTTPClient(server.URL, func(cl *Client) {
		cl.getAuthToken = func() string { return "expired" }
		cl.getRefreshToken = func() string { return "refresh-token" }
		cl.refreshTokenCallback = func(rt string) (*TokenResponse, error) {
			return nil, fmt.Errorf("refresh failed")
		}
		cl.onTokenRefreshed = func(tokens *TokenResponse) {}
	})

	var resp json.RawMessage
	err := c.Get("/protected", &resp)
	if err == nil {
		t.Fatal("expected error")
	}
	httpErr, ok := err.(*HTTPError)
	if !ok {
		t.Fatalf("expected *HTTPError, got %T", err)
	}
	if httpErr.StatusCode != 401 {
		t.Errorf("expected 401, got %d", httpErr.StatusCode)
	}
}

func TestRequest_401EmptyRefreshToken_ReturnsError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(401)
		w.Write([]byte(`{"message":"unauthorized"}`))
	}))
	defer server.Close()

	c := newTestHTTPClient(server.URL, func(cl *Client) {
		cl.getAuthToken = func() string { return "expired" }
		cl.getRefreshToken = func() string { return "" } // empty
		cl.refreshTokenCallback = func(rt string) (*TokenResponse, error) {
			t.Error("should not be called with empty refresh token")
			return nil, nil
		}
		cl.onTokenRefreshed = func(tokens *TokenResponse) {}
	})

	var resp json.RawMessage
	err := c.Get("/protected", &resp)
	if err == nil {
		t.Fatal("expected error")
	}
}

// ---------------------------------------------------------------------------
// HTTP error handling
// ---------------------------------------------------------------------------

func TestRequest_HTTPError_4xx(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(400)
		w.Write([]byte(`{"message":"bad request"}`))
	}))
	defer server.Close()

	c := newTestHTTPClient(server.URL)
	var resp json.RawMessage
	err := c.Get("/bad", &resp)
	if err == nil {
		t.Fatal("expected error")
	}
	httpErr, ok := err.(*HTTPError)
	if !ok {
		t.Fatalf("expected *HTTPError, got %T", err)
	}
	if httpErr.StatusCode != 400 {
		t.Errorf("expected 400, got %d", httpErr.StatusCode)
	}
	if httpErr.Message != "bad request" {
		t.Errorf("expected 'bad request', got %q", httpErr.Message)
	}
}

func TestRequest_HTTPError_5xx(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(500)
		w.Write([]byte(`{"message":"internal server error"}`))
	}))
	defer server.Close()

	c := newTestHTTPClient(server.URL)
	var resp json.RawMessage
	err := c.Get("/error", &resp)
	if err == nil {
		t.Fatal("expected error")
	}
	httpErr, ok := err.(*HTTPError)
	if !ok {
		t.Fatalf("expected *HTTPError, got %T", err)
	}
	if httpErr.StatusCode != 500 {
		t.Errorf("expected 500, got %d", httpErr.StatusCode)
	}
}

func TestRequest_HTTPError_ErrorFieldFallback(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(422)
		w.Write([]byte(`{"error":"validation failed"}`))
	}))
	defer server.Close()

	c := newTestHTTPClient(server.URL)
	var resp json.RawMessage
	err := c.Get("/validate", &resp)
	if err == nil {
		t.Fatal("expected error")
	}
	httpErr := err.(*HTTPError)
	if httpErr.Message != "validation failed" {
		t.Errorf("expected 'validation failed', got %q", httpErr.Message)
	}
}

func TestRequest_HTTPError_DefaultMessage(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(503)
		w.Write([]byte(`not json`))
	}))
	defer server.Close()

	c := newTestHTTPClient(server.URL)
	var resp json.RawMessage
	err := c.Get("/unavailable", &resp)
	if err == nil {
		t.Fatal("expected error")
	}
	httpErr := err.(*HTTPError)
	if httpErr.Message != "Request failed" {
		t.Errorf("expected 'Request failed', got %q", httpErr.Message)
	}
}

func TestRequest_HTTPError_MethodAndURL(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(404)
		w.Write([]byte(`{"message":"not found"}`))
	}))
	defer server.Close()

	c := newTestHTTPClient(server.URL)
	var resp json.RawMessage
	err := c.Post("/missing", nil, &resp)
	if err == nil {
		t.Fatal("expected error")
	}
	httpErr := err.(*HTTPError)
	if httpErr.Method != "POST" {
		t.Errorf("expected POST, got %s", httpErr.Method)
	}
	if httpErr.URL != server.URL+"/missing" {
		t.Errorf("unexpected URL: %s", httpErr.URL)
	}
}

// ---------------------------------------------------------------------------
// Network errors
// ---------------------------------------------------------------------------

func TestRequest_NetworkError(t *testing.T) {
	c := newTestHTTPClient("http://127.0.0.1:1") // nothing listening
	var resp json.RawMessage
	err := c.Get("/fail", &resp)
	if err == nil {
		t.Fatal("expected network error")
	}
}

// ---------------------------------------------------------------------------
// JSON marshaling edge cases
// ---------------------------------------------------------------------------

func TestPost_NilBody(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		if len(body) > 0 {
			t.Errorf("expected empty body, got %s", body)
		}
		w.WriteHeader(200)
		w.Write([]byte(`{}`))
	}))
	defer server.Close()

	c := newTestHTTPClient(server.URL)
	var resp json.RawMessage
	if err := c.Post("/nil-body", nil, &resp); err != nil {
		t.Fatal(err)
	}
}

func TestPost_NilResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		w.Write([]byte(`{"ignored": true}`))
	}))
	defer server.Close()

	c := newTestHTTPClient(server.URL)
	if err := c.Post("/no-resp", map[string]string{"k": "v"}, nil); err != nil {
		t.Fatal(err)
	}
}

// ---------------------------------------------------------------------------
// HTTPError.Error() format
// ---------------------------------------------------------------------------

func TestHTTPError_ErrorString(t *testing.T) {
	e := &HTTPError{StatusCode: 403, Message: "forbidden"}
	expected := "HTTP 403: forbidden"
	if e.Error() != expected {
		t.Errorf("got %q, want %q", e.Error(), expected)
	}
}

// ---------------------------------------------------------------------------
// Logging enabled
// ---------------------------------------------------------------------------

func TestRequest_LoggingEnabled(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		w.Write([]byte(`{}`))
	}))
	defer server.Close()

	logger := &noopLogger{}
	c := NewClient(server.URL, "key", "", 5*time.Second, logger, true, nil, nil, nil, nil)
	var resp json.RawMessage
	if err := c.Get("/log-test", &resp); err != nil {
		t.Fatal(err)
	}
}
