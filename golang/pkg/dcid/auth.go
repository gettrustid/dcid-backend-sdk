package trustid

import (
	"fmt"
	"time"

	httpclient "github.com/gettrustid/trustid-sdk/golang/internal/http"
)

// AuthClient provides authentication methods
type AuthClient struct {
	client    *Client
	httpClient *httpclient.Client
}

// RegisterOTP initiates OTP registration/sign-in process
//
// This method covers the endpoint: POST /auth/sign-in/initiate
//
// It can be used for both:
// - New user registration (creates user if doesn't exist)
// - Existing user sign-in (sends OTP to existing user)
//
// Example:
//
//	result, err := client.Auth.RegisterOTP(trustid.RegisterOTPOptions{
//		Email: stringPtr("user@example.com"),
//	})
func (a *AuthClient) RegisterOTP(options RegisterOTPOptions) (*InitiateOTPResponse, error) {
	if options.Email == nil && options.Phone == nil {
		return nil, fmt.Errorf("either email or phone must be provided")
	}

	var result InitiateOTPResponse
	err := a.httpClient.Post("/auth/sign-in/initiate", options, &result)
	if err != nil {
		return nil, a.convertError(err)
	}
	return &result, nil
}

// ConfirmOTP confirms OTP and completes registration/sign-in
//
// This method covers the endpoint: POST /auth/sign-in/confirm
//
// After user receives OTP, call this method to verify and get access tokens.
// Tokens are automatically set in the SDK context.
//
// Example:
//
//	tokens, err := client.Auth.ConfirmOTP(trustid.ConfirmOTPOptions{
//		Email: stringPtr("user@example.com"),
//		OTP:   "123456",
//	})
func (a *AuthClient) ConfirmOTP(options ConfirmOTPOptions) (*TokenResponse, error) {
	if options.Email == nil && options.Phone == nil {
		return nil, fmt.Errorf("either email or phone must be provided")
	}
	if options.OTP == "" {
		return nil, fmt.Errorf("OTP code is required")
	}

	var result TokenResponse
	err := a.httpClient.Post("/auth/sign-in/confirm", options, &result)
	if err != nil {
		return nil, a.convertError(err)
	}

	// Automatically set tokens in SDK context
	a.client.SetTokens(result)

	return &result, nil
}

// AdminLogin initiates admin OTP registration/sign-in
//
// This method covers the endpoint: POST /auth/sign-in/initiate?type=admin
//
// Example:
//
//	result, err := client.Auth.AdminLogin(trustid.RegisterOTPOptions{
//		Email: stringPtr("admin@example.com"),
//	})
func (a *AuthClient) AdminLogin(options RegisterOTPOptions) (*InitiateOTPResponse, error) {
	if options.Email == nil && options.Phone == nil {
		return nil, fmt.Errorf("either email or phone must be provided")
	}

	var result InitiateOTPResponse
	err := a.httpClient.Post("/auth/sign-in/initiate?type=admin", options, &result)
	if err != nil {
		return nil, a.convertError(err)
	}
	return &result, nil
}

// RefreshToken refreshes the access token using refresh token
//
// This method covers the endpoint: POST /auth/refresh-token
//
// Example:
//
//	tokens, err := client.Auth.RefreshToken(trustid.RefreshTokenOptions{
//		RefreshToken: "your-refresh-token",
//	})
func (a *AuthClient) RefreshToken(options RefreshTokenOptions) (*TokenResponse, error) {
	if options.RefreshToken == "" {
		return nil, fmt.Errorf("refresh token is required")
	}

	var result TokenResponse
	err := a.httpClient.Post("/auth/refresh-token", options, &result)
	if err != nil {
		return nil, a.convertError(err)
	}

	// Automatically set tokens in SDK context
	a.client.SetTokens(result)

	return &result, nil
}

// convertError converts HTTP errors to SDK errors
func (a *AuthClient) convertError(err error) error {
	httpErr, ok := err.(*httpclient.HTTPError)
	if !ok {
		// Network error
		return &NetworkError{
			SDKError: SDKError{
				Message: err.Error(),
			},
		}
	}

	context := &ErrorContext{
		URL:        httpErr.URL,
		Method:     httpErr.Method,
		StatusCode: httpErr.StatusCode,
		Timestamp:  time.Now(),
	}

	if httpErr.StatusCode == 401 {
		return &AuthenticationError{
			SDKError: SDKError{
				Message:    httpErr.Message,
				StatusCode: httpErr.StatusCode,
				Context:    context,
			},
			IsAPIKeyError: false,
		}
	}

	if httpErr.StatusCode >= 500 {
		return &ServerError{
			SDKError: SDKError{
				Message:    httpErr.Message,
				StatusCode: httpErr.StatusCode,
				Context:    context,
			},
		}
	}

	return &SDKError{
		Message:    httpErr.Message,
		StatusCode: httpErr.StatusCode,
		Context:    context,
	}
}



