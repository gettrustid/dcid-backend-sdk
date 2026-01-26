package dcid

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// ---------------------------------------------------------------------------
// RegisterOTP
// ---------------------------------------------------------------------------

func TestRegisterOTP_Success_Email(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("expected POST, got %s", r.Method)
		}
		if r.URL.Path != "/auth/sign-in/initiate" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		var body map[string]interface{}
		json.NewDecoder(r.Body).Decode(&body)
		if body["email"] != "user@example.com" {
			t.Errorf("unexpected email: %v", body["email"])
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"otp": "123456"})
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	email := "user@example.com"
	result, err := client.Auth.RegisterOTP(RegisterOTPOptions{Email: &email})
	if err != nil {
		t.Fatal(err)
	}
	if result.OTP == nil || *result.OTP != "123456" {
		t.Errorf("expected OTP 123456, got %v", result.OTP)
	}
}

func TestRegisterOTP_Success_Phone(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"otp": "654321"})
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	phone := "+1234567890"
	result, err := client.Auth.RegisterOTP(RegisterOTPOptions{Phone: &phone})
	if err != nil {
		t.Fatal(err)
	}
	if result.OTP == nil || *result.OTP != "654321" {
		t.Errorf("expected OTP 654321, got %v", result.OTP)
	}
}

func TestRegisterOTP_MissingEmailAndPhone(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Auth.RegisterOTP(RegisterOTPOptions{})
	if err == nil {
		t.Fatal("expected error")
	}
	if err.Error() != "either email or phone must be provided" {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestRegisterOTP_ServerError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(500)
		w.Write([]byte(`{"message":"internal error"}`))
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	email := "user@example.com"
	_, err := client.Auth.RegisterOTP(RegisterOTPOptions{Email: &email})
	if err == nil {
		t.Fatal("expected error")
	}
	if _, ok := err.(*ServerError); !ok {
		t.Errorf("expected *ServerError, got %T", err)
	}
}

func TestRegisterOTP_AuthError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(401)
		w.Write([]byte(`{"message":"unauthorized"}`))
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	email := "user@example.com"
	_, err := client.Auth.RegisterOTP(RegisterOTPOptions{Email: &email})
	if err == nil {
		t.Fatal("expected error")
	}
	if _, ok := err.(*AuthenticationError); !ok {
		t.Errorf("expected *AuthenticationError, got %T", err)
	}
}

func TestRegisterOTP_ClientError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(400)
		w.Write([]byte(`{"message":"bad request"}`))
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	email := "user@example.com"
	_, err := client.Auth.RegisterOTP(RegisterOTPOptions{Email: &email})
	if err == nil {
		t.Fatal("expected error")
	}
	if _, ok := err.(*SDKError); !ok {
		t.Errorf("expected *SDKError, got %T", err)
	}
}

// ---------------------------------------------------------------------------
// ConfirmOTP
// ---------------------------------------------------------------------------

func TestConfirmOTP_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/auth/sign-in/confirm" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"access_token":  "at-123",
			"refresh_token": "rt-456",
		})
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	email := "user@example.com"
	result, err := client.Auth.ConfirmOTP(ConfirmOTPOptions{
		Email: &email,
		OTP:   "123456",
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.AccessToken != "at-123" {
		t.Errorf("expected at-123, got %s", result.AccessToken)
	}
	if result.RefreshToken != "rt-456" {
		t.Errorf("expected rt-456, got %s", result.RefreshToken)
	}
	// Tokens should be auto-set on client
	if client.GetAuthToken() != "at-123" {
		t.Errorf("expected auth token at-123, got %s", client.GetAuthToken())
	}
	if client.GetRefreshToken() != "rt-456" {
		t.Errorf("expected refresh token rt-456, got %s", client.GetRefreshToken())
	}
}

func TestConfirmOTP_MissingEmailAndPhone(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Auth.ConfirmOTP(ConfirmOTPOptions{OTP: "123456"})
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestConfirmOTP_MissingOTP(t *testing.T) {
	client := newTestClient("http://unused")
	email := "user@example.com"
	_, err := client.Auth.ConfirmOTP(ConfirmOTPOptions{Email: &email})
	if err == nil {
		t.Fatal("expected error")
	}
	if err.Error() != "OTP code is required" {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestConfirmOTP_ServerError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(500)
		w.Write([]byte(`{"message":"server error"}`))
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	email := "user@example.com"
	_, err := client.Auth.ConfirmOTP(ConfirmOTPOptions{Email: &email, OTP: "123"})
	if err == nil {
		t.Fatal("expected error")
	}
	if _, ok := err.(*ServerError); !ok {
		t.Errorf("expected *ServerError, got %T", err)
	}
}

// ---------------------------------------------------------------------------
// AdminLogin
// ---------------------------------------------------------------------------

func TestAdminLogin_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/auth/sign-in/initiate" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		if r.URL.RawQuery != "type=admin" {
			t.Errorf("expected type=admin query, got %s", r.URL.RawQuery)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"otp": "admin-otp"})
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	email := "admin@example.com"
	result, err := client.Auth.AdminLogin(RegisterOTPOptions{Email: &email})
	if err != nil {
		t.Fatal(err)
	}
	if result.OTP == nil || *result.OTP != "admin-otp" {
		t.Errorf("expected admin-otp, got %v", result.OTP)
	}
}

func TestAdminLogin_MissingEmailAndPhone(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Auth.AdminLogin(RegisterOTPOptions{})
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestAdminLogin_ServerError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(502)
		w.Write([]byte(`{"message":"bad gateway"}`))
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	email := "admin@example.com"
	_, err := client.Auth.AdminLogin(RegisterOTPOptions{Email: &email})
	if err == nil {
		t.Fatal("expected error")
	}
	if _, ok := err.(*ServerError); !ok {
		t.Errorf("expected *ServerError, got %T", err)
	}
}

// ---------------------------------------------------------------------------
// RefreshToken
// ---------------------------------------------------------------------------

func TestRefreshToken_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/auth/refresh-token" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"access_token":  "new-at",
			"refresh_token": "new-rt",
		})
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	result, err := client.Auth.RefreshToken(RefreshTokenOptions{RefreshToken: "old-rt"})
	if err != nil {
		t.Fatal(err)
	}
	if result.AccessToken != "new-at" {
		t.Errorf("expected new-at, got %s", result.AccessToken)
	}
	// Tokens should be auto-set
	if client.GetAuthToken() != "new-at" {
		t.Errorf("auth token not updated")
	}
	if client.GetRefreshToken() != "new-rt" {
		t.Errorf("refresh token not updated")
	}
}

func TestRefreshToken_MissingToken(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Auth.RefreshToken(RefreshTokenOptions{})
	if err == nil {
		t.Fatal("expected error")
	}
	if err.Error() != "refresh token is required" {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestRefreshToken_ServerError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(500)
		w.Write([]byte(`{"message":"server error"}`))
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	_, err := client.Auth.RefreshToken(RefreshTokenOptions{RefreshToken: "old-rt"})
	if err == nil {
		t.Fatal("expected error")
	}
}

// ---------------------------------------------------------------------------
// convertError
// ---------------------------------------------------------------------------

func TestAuthConvertError_NetworkError(t *testing.T) {
	client := newTestClient("http://127.0.0.1:1")
	email := "user@example.com"
	_, err := client.Auth.RegisterOTP(RegisterOTPOptions{Email: &email})
	if err == nil {
		t.Fatal("expected error")
	}
	if _, ok := err.(*NetworkError); !ok {
		t.Errorf("expected *NetworkError, got %T", err)
	}
}
