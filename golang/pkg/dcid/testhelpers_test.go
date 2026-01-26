package dcid

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"time"

	httpclient "github.com/gettrustid/dcid-backend-sdk/golang/internal/http"
)

// newTestServer creates a mock HTTP server with a custom handler.
func newTestServer(handler http.HandlerFunc) *httptest.Server {
	return httptest.NewServer(handler)
}

// newJSONHandler creates a handler that returns a JSON response with the given status code.
func newJSONHandler(statusCode int, response interface{}) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		json.NewEncoder(w).Encode(response)
	}
}

// newTestHTTPClient creates an httpclient.Client pointed at the test server.
func newTestHTTPClient(serverURL string, opts ...testHTTPClientOption) *httpclient.Client {
	cfg := testHTTPClientConfig{
		apiKey:  "test-api-key",
		timeout: 5 * time.Second,
	}
	for _, opt := range opts {
		opt(&cfg)
	}
	return httpclient.NewClient(
		serverURL,
		cfg.apiKey,
		cfg.timeout,
		&NoOpLogger{},
		false,
		cfg.getAuthToken,
		cfg.getRefreshToken,
		cfg.refreshTokenCallback,
		cfg.onTokenRefreshed,
	)
}

type testHTTPClientConfig struct {
	apiKey               string
	timeout              time.Duration
	getAuthToken         func() string
	getRefreshToken      func() string
	refreshTokenCallback func(string) (*httpclient.TokenResponse, error)
	onTokenRefreshed     func(*httpclient.TokenResponse)
}

type testHTTPClientOption func(*testHTTPClientConfig)

func withAuthToken(fn func() string) testHTTPClientOption {
	return func(cfg *testHTTPClientConfig) {
		cfg.getAuthToken = fn
	}
}

func withRefreshToken(fn func() string) testHTTPClientOption {
	return func(cfg *testHTTPClientConfig) {
		cfg.getRefreshToken = fn
	}
}

func withRefreshCallback(fn func(string) (*httpclient.TokenResponse, error)) testHTTPClientOption {
	return func(cfg *testHTTPClientConfig) {
		cfg.refreshTokenCallback = fn
	}
}

func withOnTokenRefreshed(fn func(*httpclient.TokenResponse)) testHTTPClientOption {
	return func(cfg *testHTTPClientConfig) {
		cfg.onTokenRefreshed = fn
	}
}

// newTestClient creates a Client with modules wired to the mock server.
func newTestClient(serverURL string) *Client {
	client := &Client{
		baseURL: serverURL,
	}

	httpClient := newTestHTTPClient(serverURL)

	getAuthToken := func() string { return client.GetAuthToken() }
	getRefreshToken := func() string { return client.GetRefreshToken() }
	authenticatedHTTPClient := newTestHTTPClient(serverURL,
		withAuthToken(getAuthToken),
		withRefreshToken(getRefreshToken),
	)

	client.Auth = &AuthClient{
		client:     client,
		httpClient: httpClient,
	}
	client.Identity = &IdentityClient{
		Encryption:   &Encryption{client: client, httpClient: authenticatedHTTPClient},
		Issuer:       &Issuer{client: client, httpClient: authenticatedHTTPClient},
		IPFS:         &IPFS{client: client, httpClient: authenticatedHTTPClient},
		Verification: &Verification{client: client, httpClient: authenticatedHTTPClient},
	}
	client.Analytics = &AnalyticsClient{
		client:     client,
		httpClient: httpClient,
	}

	return client
}
