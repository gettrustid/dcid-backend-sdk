package http

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Logger interface for HTTP client logging
type Logger interface {
	Debug(msg string, fields map[string]interface{})
	Info(msg string, fields map[string]interface{})
	Error(msg string, fields map[string]interface{})
}

// TokenResponse represents token response
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// Client wraps the standard http.Client with SDK-specific functionality
type Client struct {
	baseURL              string
	apiKey               string
	timeout              time.Duration
	httpClient           *http.Client
	logger               Logger
	enableLogging        bool
	getAuthToken         func() string
	getRefreshToken      func() string
	refreshTokenCallback func(string) (*TokenResponse, error)
	onTokenRefreshed     func(*TokenResponse)
}

// NewClient creates a new HTTP client
func NewClient(
	baseURL string,
	apiKey string,
	timeout time.Duration,
	logger Logger,
	enableLogging bool,
	getAuthToken func() string,
	getRefreshToken func() string,
	refreshTokenCallback func(string) (*TokenResponse, error),
	onTokenRefreshed func(*TokenResponse),
) *Client {
	return &Client{
		baseURL:              baseURL,
		apiKey:               apiKey,
		timeout:              timeout,
		logger:               logger,
		enableLogging:        enableLogging,
		getAuthToken:         getAuthToken,
		getRefreshToken:       getRefreshToken,
		refreshTokenCallback:  refreshTokenCallback,
		onTokenRefreshed:      onTokenRefreshed,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}

// Post makes a POST request
func (c *Client) Post(url string, body interface{}, response interface{}) error {
	return c.Request("POST", url, body, response)
}

// Get makes a GET request
func (c *Client) Get(url string, response interface{}) error {
	return c.Request("GET", url, nil, response)
}

// Request makes an HTTP request
func (c *Client) Request(method, url string, body interface{}, response interface{}) error {
	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	fullURL := c.baseURL + url
	req, err := http.NewRequest(method, fullURL, reqBody)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("X-API-Key", c.apiKey)

	// Add auth token if available
	if c.getAuthToken != nil {
		if token := c.getAuthToken(); token != "" {
			req.Header.Set("Authorization", "Bearer "+token)
		}
	}

	// Log request if enabled
	if c.enableLogging && c.logger != nil {
		c.logger.Debug("Outgoing API request", map[string]interface{}{
			"method": method,
			"url":    fullURL,
		})
	}

	// Make request
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return c.handleNetworkError(err)
	}
	defer resp.Body.Close()

	// Handle 401 with token refresh
	if resp.StatusCode == 401 && c.refreshTokenCallback != nil && c.onTokenRefreshed != nil {
		if c.getRefreshToken != nil {
			refreshToken := c.getRefreshToken()
			if refreshToken != "" {
				newTokens, err := c.refreshTokenCallback(refreshToken)
				if err == nil && newTokens != nil {
					c.onTokenRefreshed(newTokens)
					// Retry request with new token
					return c.Request(method, url, body, response)
				}
			}
		}
	}

	// Read response body
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %w", err)
	}

	// Handle errors
	if resp.StatusCode >= 400 {
		return c.handleHTTPError(resp.StatusCode, respBody, method, fullURL)
	}

	// Parse response
	if response != nil {
		if err := json.Unmarshal(respBody, response); err != nil {
			return fmt.Errorf("failed to unmarshal response: %w", err)
		}
	}

	return nil
}

// HTTPError represents an HTTP error
type HTTPError struct {
	StatusCode int
	Message    string
	Body       []byte
	Method     string
	URL        string
}

func (e *HTTPError) Error() string {
	return fmt.Sprintf("HTTP %d: %s", e.StatusCode, e.Message)
}

func (c *Client) handleNetworkError(err error) error {
	return fmt.Errorf("network error: %w", err)
}

func (c *Client) handleHTTPError(statusCode int, body []byte, method, url string) error {
	var errorData map[string]interface{}
	json.Unmarshal(body, &errorData)

	message := "Request failed"
	if msg, ok := errorData["message"].(string); ok {
		message = msg
	} else if err, ok := errorData["error"].(string); ok {
		message = err
	}

	return &HTTPError{
		StatusCode: statusCode,
		Message:    message,
		Body:       body,
		Method:     method,
		URL:        url,
	}
}

