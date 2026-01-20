package dcid

import (
	"errors"
	"strings"
	"sync"
	"time"

	httpclient "github.com/gettrustid/dcid-server-sdk/golang/internal/http"
)

// Client is the main DCID Server SDK client
type Client struct {
	// Auth provides authentication methods
	Auth *AuthClient
	// Identity provides identity management methods
	Identity *IdentityClient
	// Analytics provides analytics tracking methods
	Analytics *AnalyticsClient

	// Internal fields
	authToken    string
	refreshToken string
	baseURL      string
	mu           sync.RWMutex // Protects token access
}

// NewClient creates a new DCID Server SDK client
//
// Example:
//
//	client, err := dcid.NewClient(dcid.Config{
//		Environment: dcid.EnvironmentDev,
//		APIKey:      "your-api-key",
//	})
//	if err != nil {
//		log.Fatal(err)
//	}
//
//	// Register OTP
//	result, err := client.Auth.RegisterOTP(dcid.RegisterOTPOptions{
//		Email: stringPtr("user@example.com"),
//	})
func NewClient(config Config) (*Client, error) {
	if config.APIKey == "" {
		return nil, errors.New("apiKey is required in SDK configuration")
	}

	// Default to prod if not specified
	env := config.Environment
	if env == "" {
		env = EnvironmentProd
	}

	// Get environment configuration
	envConfig := getEnvironmentConfig(env)

	// Remove trailing slash from baseURL
	baseURL := strings.TrimSuffix(envConfig.BaseURL, "/")

	// Setup logger (use provided logger or default based on environment)
	logger := config.Logger
	if logger == nil {
		if env == EnvironmentDev {
			logger = NewConsoleLogger(true)
		} else {
			logger = &NoOpLogger{}
		}
	}

	// Determine if request logging should be enabled
	enableRequestLogging := false
	if config.EnableRequestLogging != nil {
		enableRequestLogging = *config.EnableRequestLogging
	} else {
		enableRequestLogging = env == EnvironmentDev
	}

	// Set default timeout
	timeout := config.Timeout
	if timeout == 0 {
		timeout = 30 * time.Second
	}

	client := &Client{
		baseURL: baseURL,
	}

	// Create token getters
	getAuthToken := func() string {
		return client.GetAuthToken()
	}
	getRefreshToken := func() string {
		return client.GetRefreshToken()
	}

	// Create refresh token callback
	refreshTokenCallback := func(refreshToken string) (*httpclient.TokenResponse, error) {
		// Create a temporary auth client for refresh
		// This avoids circular dependency
		httpClient := httpclient.NewClient(
			baseURL,
			config.APIKey,
			timeout,
			logger,
			enableRequestLogging,
			getAuthToken,
			getRefreshToken,
			nil, // No nested refresh
			nil, // No nested refresh handler
		)
		var result httpclient.TokenResponse
		err := httpClient.Post("/auth/refresh-token", RefreshTokenOptions{
			RefreshToken: refreshToken,
		}, &result)
		if err != nil {
			return nil, err
		}
		return &result, nil
	}

	// Create token refresh handler
	onTokenRefreshed := func(tokens *httpclient.TokenResponse) {
		client.SetTokens(TokenResponse{
			AccessToken:  tokens.AccessToken,
			RefreshToken: tokens.RefreshToken,
		})
	}

	// Create HTTP clients
	authHTTPClient := httpclient.NewClient(
		baseURL,
		config.APIKey,
		timeout,
		logger,
		enableRequestLogging,
		nil, // No auth token for auth endpoints
		nil, // No refresh token for auth endpoints
		nil, // No refresh callback for auth endpoints
		nil, // No refresh handler for auth endpoints
	)

	// TODO: authenticatedHTTPClient will be used for Identity operations
	_ = httpclient.NewClient(
		baseURL,
		config.APIKey,
		timeout,
		logger,
		enableRequestLogging,
		getAuthToken,
		getRefreshToken,
		refreshTokenCallback,
		onTokenRefreshed,
	)

	analyticsHTTPClient := httpclient.NewClient(
		baseURL,
		config.APIKey,
		timeout,
		logger,
		enableRequestLogging,
		nil, // Analytics doesn't require auth
		nil,
		nil,
		nil,
	)

	client.Auth = &AuthClient{
		client:     client,
		httpClient: authHTTPClient,
	}
	client.Identity = &IdentityClient{
		Encryption:   &Encryption{client: client},
		Issuer:      &Issuer{client: client},
		IPFS:        &IPFS{client: client},
		Verification: &Verification{client: client},
	}
	client.Analytics = &AnalyticsClient{
		client:     client,
		httpClient: analyticsHTTPClient,
	}

	return client, nil
}

// SetTokens sets the authorization and refresh tokens
func (c *Client) SetTokens(tokens TokenResponse) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.authToken = tokens.AccessToken
	c.refreshToken = tokens.RefreshToken
}

// SetAuthToken sets the authorization token
func (c *Client) SetAuthToken(token string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.authToken = token
}

// SetRefreshToken sets the refresh token
func (c *Client) SetRefreshToken(token string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.refreshToken = token
}

// GetAuthToken returns the current authorization token
func (c *Client) GetAuthToken() string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.authToken
}

// GetRefreshToken returns the current refresh token
func (c *Client) GetRefreshToken() string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.refreshToken
}

// Helper function to create string pointer
func stringPtr(s string) *string {
	return &s
}

