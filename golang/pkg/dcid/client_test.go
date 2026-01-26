package dcid

import (
	"os"
	"sync"
	"testing"
)

// ---------------------------------------------------------------------------
// NewClient validation
// ---------------------------------------------------------------------------

func TestNewClient_APIKeyRequired(t *testing.T) {
	_, err := NewClient(Config{})
	if err == nil {
		t.Fatal("expected error for missing apiKey")
	}
	if err.Error() != "apiKey is required in SDK configuration" {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestNewClient_DefaultsToProd(t *testing.T) {
	os.Unsetenv("DCID_BASE_URL")
	client, err := NewClient(Config{APIKey: "test-key"})
	if err != nil {
		t.Fatal(err)
	}
	if client.baseURL != "https://gateway.trustid.life/api" {
		t.Errorf("expected prod URL, got %s", client.baseURL)
	}
}

func TestNewClient_DevEnvironment(t *testing.T) {
	os.Unsetenv("DCID_BASE_URL")
	client, err := NewClient(Config{
		APIKey:      "test-key",
		Environment: EnvironmentDev,
	})
	if err != nil {
		t.Fatal(err)
	}
	if client.baseURL != "http://krakend.dev-external.trustid.life/api" {
		t.Errorf("expected dev URL, got %s", client.baseURL)
	}
}

func TestNewClient_TrimsTrailingSlash(t *testing.T) {
	os.Setenv("DCID_BASE_URL", "http://localhost:8080/api/")
	defer os.Unsetenv("DCID_BASE_URL")

	client, err := NewClient(Config{APIKey: "test-key"})
	if err != nil {
		t.Fatal(err)
	}
	if client.baseURL != "http://localhost:8080/api" {
		t.Errorf("expected trimmed URL, got %s", client.baseURL)
	}
}

func TestNewClient_EnvOverrideBaseURL(t *testing.T) {
	os.Setenv("DCID_BASE_URL", "http://custom:9090")
	defer os.Unsetenv("DCID_BASE_URL")

	client, err := NewClient(Config{APIKey: "test-key", Environment: EnvironmentDev})
	if err != nil {
		t.Fatal(err)
	}
	if client.baseURL != "http://custom:9090" {
		t.Errorf("expected custom URL, got %s", client.baseURL)
	}
}

func TestNewClient_ModulesInitialized(t *testing.T) {
	os.Unsetenv("DCID_BASE_URL")
	client, err := NewClient(Config{APIKey: "test-key"})
	if err != nil {
		t.Fatal(err)
	}
	if client.Auth == nil {
		t.Error("Auth module not initialized")
	}
	if client.Identity == nil {
		t.Error("Identity module not initialized")
	}
	if client.Identity.Encryption == nil {
		t.Error("Encryption sub-module not initialized")
	}
	if client.Identity.Issuer == nil {
		t.Error("Issuer sub-module not initialized")
	}
	if client.Identity.IPFS == nil {
		t.Error("IPFS sub-module not initialized")
	}
	if client.Identity.Verification == nil {
		t.Error("Verification sub-module not initialized")
	}
	if client.Analytics == nil {
		t.Error("Analytics module not initialized")
	}
}

func TestNewClient_CustomTimeout(t *testing.T) {
	os.Unsetenv("DCID_BASE_URL")
	_, err := NewClient(Config{
		APIKey:  "test-key",
		Timeout: 60_000_000_000, // 60s
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestNewClient_CustomLogger(t *testing.T) {
	os.Unsetenv("DCID_BASE_URL")
	_, err := NewClient(Config{
		APIKey: "test-key",
		Logger: NewConsoleLogger(false),
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestNewClient_EnableRequestLogging(t *testing.T) {
	os.Unsetenv("DCID_BASE_URL")
	enable := true
	_, err := NewClient(Config{
		APIKey:               "test-key",
		EnableRequestLogging: &enable,
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestNewClient_DisableRequestLogging(t *testing.T) {
	os.Unsetenv("DCID_BASE_URL")
	disable := false
	_, err := NewClient(Config{
		APIKey:               "test-key",
		Environment:          EnvironmentDev,
		EnableRequestLogging: &disable,
	})
	if err != nil {
		t.Fatal(err)
	}
}

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

func TestSetTokens_And_GetTokens(t *testing.T) {
	client := &Client{}
	client.SetTokens(TokenResponse{
		AccessToken:  "access-123",
		RefreshToken: "refresh-456",
	})
	if got := client.GetAuthToken(); got != "access-123" {
		t.Errorf("expected access-123, got %s", got)
	}
	if got := client.GetRefreshToken(); got != "refresh-456" {
		t.Errorf("expected refresh-456, got %s", got)
	}
}

func TestSetAuthToken(t *testing.T) {
	client := &Client{}
	client.SetAuthToken("token-abc")
	if got := client.GetAuthToken(); got != "token-abc" {
		t.Errorf("expected token-abc, got %s", got)
	}
}

func TestSetRefreshToken(t *testing.T) {
	client := &Client{}
	client.SetRefreshToken("refresh-xyz")
	if got := client.GetRefreshToken(); got != "refresh-xyz" {
		t.Errorf("expected refresh-xyz, got %s", got)
	}
}

func TestTokensInitiallyEmpty(t *testing.T) {
	client := &Client{}
	if got := client.GetAuthToken(); got != "" {
		t.Errorf("expected empty, got %s", got)
	}
	if got := client.GetRefreshToken(); got != "" {
		t.Errorf("expected empty, got %s", got)
	}
}

func TestSetTokens_OverwritesPrevious(t *testing.T) {
	client := &Client{}
	client.SetTokens(TokenResponse{AccessToken: "a1", RefreshToken: "r1"})
	client.SetTokens(TokenResponse{AccessToken: "a2", RefreshToken: "r2"})
	if got := client.GetAuthToken(); got != "a2" {
		t.Errorf("expected a2, got %s", got)
	}
	if got := client.GetRefreshToken(); got != "r2" {
		t.Errorf("expected r2, got %s", got)
	}
}

// ---------------------------------------------------------------------------
// Thread safety
// ---------------------------------------------------------------------------

func TestTokenAccess_ThreadSafety(t *testing.T) {
	client := &Client{}
	var wg sync.WaitGroup
	for i := 0; i < 100; i++ {
		wg.Add(3)
		go func() {
			defer wg.Done()
			client.SetTokens(TokenResponse{AccessToken: "a", RefreshToken: "r"})
		}()
		go func() {
			defer wg.Done()
			_ = client.GetAuthToken()
		}()
		go func() {
			defer wg.Done()
			_ = client.GetRefreshToken()
		}()
	}
	wg.Wait()
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

func TestStringPtr(t *testing.T) {
	s := stringPtr("hello")
	if *s != "hello" {
		t.Errorf("expected hello, got %s", *s)
	}
}
