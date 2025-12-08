package trustid

// InitiateOTPResponse is the response from OTP initiation
type InitiateOTPResponse struct {
	// OTP code (only returned in dev environment)
	OTP *string `json:"otp,omitempty"`
}

// TokenResponse is the response from OTP confirmation or token refresh
type TokenResponse struct {
	// AccessToken is the JWT access token
	AccessToken string `json:"access_token"`
	// RefreshToken is the JWT refresh token
	RefreshToken string `json:"refresh_token"`
}

// RegisterOTPOptions are options for initiating OTP registration/sign-in
type RegisterOTPOptions struct {
	// Email is the user's email address
	Email *string `json:"email,omitempty"`
	// Phone is the user's phone number (with country code, e.g., +1234567890)
	Phone *string `json:"phone,omitempty"`
}

// ConfirmOTPOptions are options for confirming OTP
type ConfirmOTPOptions struct {
	// Email is the user's email address
	Email *string `json:"email,omitempty"`
	// Phone is the user's phone number
	Phone *string `json:"phone,omitempty"`
	// OTP is the OTP code received by the user
	OTP string `json:"otp"`
}

// RefreshTokenOptions are options for refreshing token
type RefreshTokenOptions struct {
	// RefreshToken is the refresh token
	RefreshToken string `json:"refreshToken"`
}



