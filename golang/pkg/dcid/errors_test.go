package dcid

import "testing"

func TestSDKError_WithStatusCode(t *testing.T) {
	e := &SDKError{Message: "bad request", StatusCode: 400}
	expected := "bad request (status: 400)"
	if e.Error() != expected {
		t.Errorf("got %q, want %q", e.Error(), expected)
	}
}

func TestSDKError_WithoutStatusCode(t *testing.T) {
	e := &SDKError{Message: "something failed"}
	if e.Error() != "something failed" {
		t.Errorf("got %q, want %q", e.Error(), "something failed")
	}
}

func TestSDKError_ZeroStatusCode(t *testing.T) {
	e := &SDKError{Message: "error", StatusCode: 0}
	if e.Error() != "error" {
		t.Errorf("got %q, want %q", e.Error(), "error")
	}
}

func TestNetworkError_WithCode(t *testing.T) {
	e := &NetworkError{
		SDKError: SDKError{Message: "connection refused"},
		Code:     "ECONNREFUSED",
	}
	expected := "connection refused (code: ECONNREFUSED)"
	if e.Error() != expected {
		t.Errorf("got %q, want %q", e.Error(), expected)
	}
}

func TestNetworkError_WithoutCode(t *testing.T) {
	e := &NetworkError{
		SDKError: SDKError{Message: "timeout"},
	}
	if e.Error() != "timeout" {
		t.Errorf("got %q, want %q", e.Error(), "timeout")
	}
}

func TestNetworkError_WithStatusCodeAndCode(t *testing.T) {
	e := &NetworkError{
		SDKError: SDKError{Message: "error", StatusCode: 500},
		Code:     "ECONNRESET",
	}
	expected := "error (status: 500) (code: ECONNRESET)"
	if e.Error() != expected {
		t.Errorf("got %q, want %q", e.Error(), expected)
	}
}

func TestAuthenticationError_Format(t *testing.T) {
	e := &AuthenticationError{
		SDKError: SDKError{Message: "unauthorized", StatusCode: 401},
	}
	expected := "unauthorized (status: 401)"
	if e.Error() != expected {
		t.Errorf("got %q, want %q", e.Error(), expected)
	}
}

func TestAuthenticationError_IsAPIKeyError(t *testing.T) {
	e := &AuthenticationError{
		SDKError:      SDKError{Message: "bad api key", StatusCode: 401},
		IsAPIKeyError: true,
	}
	if !e.IsAPIKeyError {
		t.Error("expected IsAPIKeyError=true")
	}
}

func TestServerError_Format(t *testing.T) {
	e := &ServerError{
		SDKError: SDKError{Message: "internal error", StatusCode: 500},
	}
	expected := "internal error (status: 500)"
	if e.Error() != expected {
		t.Errorf("got %q, want %q", e.Error(), expected)
	}
}

func TestServerError_IsBackendConnectivityError(t *testing.T) {
	e := &ServerError{
		SDKError:                   SDKError{Message: "gateway error", StatusCode: 502},
		IsBackendConnectivityError: true,
	}
	if !e.IsBackendConnectivityError {
		t.Error("expected IsBackendConnectivityError=true")
	}
}

func TestErrorContext_Fields(t *testing.T) {
	ctx := &ErrorContext{
		URL:            "http://example.com",
		Method:         "POST",
		StatusCode:     500,
		StatusText:     "Internal Server Error",
		IsKrakendError: true,
		ErrorSource:    "krakend",
	}
	if ctx.URL != "http://example.com" {
		t.Errorf("unexpected URL: %s", ctx.URL)
	}
	if ctx.ErrorSource != "krakend" {
		t.Errorf("unexpected ErrorSource: %s", ctx.ErrorSource)
	}
}

func TestAllErrors_ImplementErrorInterface(t *testing.T) {
	var _ error = &SDKError{}
	var _ error = &NetworkError{}
	var _ error = &AuthenticationError{}
	var _ error = &ServerError{}
}
