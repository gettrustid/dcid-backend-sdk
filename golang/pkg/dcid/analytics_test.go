package dcid

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// ---------------------------------------------------------------------------
// StartSession
// ---------------------------------------------------------------------------

func TestStartSession_Success_NilOptions(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("expected POST, got %s", r.Method)
		}
		if r.URL.Path != "/analytics/sgtm" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		var body map[string]interface{}
		json.NewDecoder(r.Body).Decode(&body)
		if body["event"] != "start_session" {
			t.Errorf("expected event=start_session, got %v", body["event"])
		}
		if body["event_name"] != "start_session" {
			t.Errorf("expected event_name=start_session, got %v", body["event_name"])
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(StartSessionResponse{
			Success:     true,
			SessionID:   "sess-123",
			AnonymousID: "anon-456",
		})
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	result, err := client.Analytics.StartSession(nil)
	if err != nil {
		t.Fatal(err)
	}
	if !result.Success {
		t.Error("expected success=true")
	}
	if result.SessionID != "sess-123" {
		t.Errorf("expected sess-123, got %s", result.SessionID)
	}
}

func TestStartSession_Success_WithOptions(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var body map[string]interface{}
		json.NewDecoder(r.Body).Decode(&body)
		if body["user_id"] != "user-1" {
			t.Errorf("expected user_id=user-1, got %v", body["user_id"])
		}
		if body["anonymous_id"] != "anon-1" {
			t.Errorf("expected anonymous_id=anon-1, got %v", body["anonymous_id"])
		}
		if body["page_location"] != "https://example.com" {
			t.Errorf("expected page_location, got %v", body["page_location"])
		}
		if body["page_title"] != "Home" {
			t.Errorf("expected page_title=Home, got %v", body["page_title"])
		}
		if body["device_type"] != "desktop" {
			t.Errorf("expected device_type=desktop, got %v", body["device_type"])
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(StartSessionResponse{
			Success:   true,
			SessionID: "sess-opt",
		})
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	userID := "user-1"
	anonID := "anon-1"
	pageLocation := "https://example.com"
	pageTitle := "Home"
	var timestamp int64 = 1234567890
	engagementTime := 5000
	deviceType := "desktop"
	result, err := client.Analytics.StartSession(&StartSessionOptions{
		UserID:             &userID,
		AnonymousID:        &anonID,
		PageLocation:       &pageLocation,
		PageTitle:          &pageTitle,
		Timestamp:          &timestamp,
		EngagementTimeMsec: &engagementTime,
		DeviceType:         &deviceType,
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.SessionID != "sess-opt" {
		t.Errorf("expected sess-opt, got %s", result.SessionID)
	}
}

func TestStartSession_ServerError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(500)
		w.Write([]byte(`{"message":"internal error"}`))
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	_, err := client.Analytics.StartSession(nil)
	if err == nil {
		t.Fatal("expected error")
	}
	if _, ok := err.(*ServerError); !ok {
		t.Errorf("expected *ServerError, got %T", err)
	}
}

func TestStartSession_AuthError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(401)
		w.Write([]byte(`{"message":"unauthorized"}`))
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	_, err := client.Analytics.StartSession(nil)
	if err == nil {
		t.Fatal("expected error")
	}
	if _, ok := err.(*AuthenticationError); !ok {
		t.Errorf("expected *AuthenticationError, got %T", err)
	}
}

func TestStartSession_ClientError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(400)
		w.Write([]byte(`{"message":"bad request"}`))
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	_, err := client.Analytics.StartSession(nil)
	if err == nil {
		t.Fatal("expected error")
	}
	if _, ok := err.(*SDKError); !ok {
		t.Errorf("expected *SDKError, got %T", err)
	}
}

func TestStartSession_NetworkError(t *testing.T) {
	client := newTestClient("http://127.0.0.1:1")
	_, err := client.Analytics.StartSession(nil)
	if err == nil {
		t.Fatal("expected error")
	}
	if _, ok := err.(*NetworkError); !ok {
		t.Errorf("expected *NetworkError, got %T", err)
	}
}

// ---------------------------------------------------------------------------
// EndSession
// ---------------------------------------------------------------------------

func TestEndSession_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/analytics/sgtm" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		var body map[string]interface{}
		json.NewDecoder(r.Body).Decode(&body)
		if body["event"] != "end_session" {
			t.Errorf("expected event=end_session, got %v", body["event"])
		}
		if body["session_id"] != "sess-123" {
			t.Errorf("expected session_id=sess-123, got %v", body["session_id"])
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(EndSessionResponse{
			Success: true,
		})
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	result, err := client.Analytics.EndSession(&EndSessionOptions{
		SessionID: "sess-123",
	})
	if err != nil {
		t.Fatal(err)
	}
	if !result.Success {
		t.Error("expected success=true")
	}
}

func TestEndSession_WithOptionalFields(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var body map[string]interface{}
		json.NewDecoder(r.Body).Decode(&body)
		if body["user_id"] != "user-1" {
			t.Errorf("expected user_id=user-1, got %v", body["user_id"])
		}
		if body["anonymous_id"] != "anon-1" {
			t.Errorf("expected anonymous_id=anon-1, got %v", body["anonymous_id"])
		}
		if body["ended_at"] != "2024-01-01T00:00:00Z" {
			t.Errorf("unexpected ended_at: %v", body["ended_at"])
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(EndSessionResponse{Success: true})
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	userID := "user-1"
	anonID := "anon-1"
	endedAt := "2024-01-01T00:00:00Z"
	result, err := client.Analytics.EndSession(&EndSessionOptions{
		SessionID:   "sess-123",
		UserID:      &userID,
		AnonymousID: &anonID,
		EndedAt:     &endedAt,
	})
	if err != nil {
		t.Fatal(err)
	}
	if !result.Success {
		t.Error("expected success=true")
	}
}

func TestEndSession_NilOptions(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Analytics.EndSession(nil)
	if err == nil {
		t.Fatal("expected error")
	}
	if err.Error() != "session_id is required" {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestEndSession_EmptySessionID(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Analytics.EndSession(&EndSessionOptions{})
	if err == nil {
		t.Fatal("expected error")
	}
	if err.Error() != "session_id is required" {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestEndSession_ServerError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(500)
		w.Write([]byte(`{"message":"error"}`))
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	_, err := client.Analytics.EndSession(&EndSessionOptions{SessionID: "sess-123"})
	if err == nil {
		t.Fatal("expected error")
	}
	if _, ok := err.(*ServerError); !ok {
		t.Errorf("expected *ServerError, got %T", err)
	}
}

func TestEndSession_NetworkError(t *testing.T) {
	client := newTestClient("http://127.0.0.1:1")
	_, err := client.Analytics.EndSession(&EndSessionOptions{SessionID: "sess-123"})
	if err == nil {
		t.Fatal("expected error")
	}
	if _, ok := err.(*NetworkError); !ok {
		t.Errorf("expected *NetworkError, got %T", err)
	}
}
