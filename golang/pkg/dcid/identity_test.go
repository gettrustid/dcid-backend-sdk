package dcid

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// ============================================================================
// ENCRYPTION
// ============================================================================

func TestGenerateKey_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("expected POST, got %s", r.Method)
		}
		if r.URL.Path != "/identity/generate-encryption-key" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(GenerateEncryptionKeyResponse{
			EncryptedKey: "enc-key-123",
			DID:          "did:test:123",
			OwnerEmail:   "user@example.com",
			Message:      "Key generated",
		})
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	result, err := client.Identity.Encryption.GenerateKey(GenerateEncryptionKeyOptions{
		DID:        "did:test:123",
		OwnerEmail: "user@example.com",
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.EncryptedKey != "enc-key-123" {
		t.Errorf("unexpected key: %s", result.EncryptedKey)
	}
}

func TestGenerateKey_InvalidDID(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Identity.Encryption.GenerateKey(GenerateEncryptionKeyOptions{
		DID:        "invalid",
		OwnerEmail: "user@example.com",
	})
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "DID must start with 'did:'") {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestGenerateKey_InvalidEmail(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Identity.Encryption.GenerateKey(GenerateEncryptionKeyOptions{
		DID:        "did:test:123",
		OwnerEmail: "invalid-email",
	})
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "ownerEmail must be a valid email") {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestGenerateKey_ServerError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(500)
		w.Write([]byte(`{"message":"internal error"}`))
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	_, err := client.Identity.Encryption.GenerateKey(GenerateEncryptionKeyOptions{
		DID:        "did:test:123",
		OwnerEmail: "user@example.com",
	})
	if err == nil {
		t.Fatal("expected error")
	}
	if _, ok := err.(*ServerError); !ok {
		t.Errorf("expected *ServerError, got %T", err)
	}
}

func TestGetKey_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/identity/get-encrypted-key" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(GetEncryptedKeyResponse{
			EncryptedKey: "key-abc",
			DID:          "did:test:123",
			Message:      "Key retrieved",
		})
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	result, err := client.Identity.Encryption.GetKey(GetEncryptedKeyOptions{DID: "did:test:123"})
	if err != nil {
		t.Fatal(err)
	}
	if result.EncryptedKey != "key-abc" {
		t.Errorf("unexpected key: %s", result.EncryptedKey)
	}
}

func TestGetKey_InvalidDID(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Identity.Encryption.GetKey(GetEncryptedKeyOptions{DID: "bad"})
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestGetKey_AuthError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(401)
		w.Write([]byte(`{"message":"unauthorized"}`))
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	_, err := client.Identity.Encryption.GetKey(GetEncryptedKeyOptions{DID: "did:test:123"})
	if err == nil {
		t.Fatal("expected error")
	}
	if _, ok := err.(*AuthenticationError); !ok {
		t.Errorf("expected *AuthenticationError, got %T", err)
	}
}

// ============================================================================
// ISSUER
// ============================================================================

func TestIssueCredential_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/identity/issuer/issue-credential" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(IssueCredentialResponse{
			QRCodeLink: "https://example.com/qr",
			SchemaType: "KYCAgeCredential",
		})
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	result, err := client.Identity.Issuer.IssueCredential(IssueCredentialOptions{
		DID:            "did:test:123",
		CredentialName: "KYCAgeCredential",
		Values:         map[string]interface{}{"birthday": 25},
		OwnerEmail:     "user@example.com",
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.QRCodeLink != "https://example.com/qr" {
		t.Errorf("unexpected QR link: %s", result.QRCodeLink)
	}
}

func TestIssueCredential_InvalidDID(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Identity.Issuer.IssueCredential(IssueCredentialOptions{
		DID:            "bad",
		CredentialName: "cred",
		OwnerEmail:     "user@example.com",
	})
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestIssueCredential_MissingCredentialName(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Identity.Issuer.IssueCredential(IssueCredentialOptions{
		DID:        "did:test:123",
		OwnerEmail: "user@example.com",
	})
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "credentialName is required") {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestIssueCredential_InvalidEmail(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Identity.Issuer.IssueCredential(IssueCredentialOptions{
		DID:            "did:test:123",
		CredentialName: "cred",
		OwnerEmail:     "bad-email",
	})
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestIssueCredential_ServerError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(500)
		w.Write([]byte(`{"message":"error"}`))
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	_, err := client.Identity.Issuer.IssueCredential(IssueCredentialOptions{
		DID:            "did:test:123",
		CredentialName: "cred",
		OwnerEmail:     "user@example.com",
	})
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestGetCredentialOffer_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" {
			t.Errorf("expected GET, got %s", r.Method)
		}
		if !strings.Contains(r.URL.Path, "/identity/issuer/get-credential-offer") {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		if r.URL.Query().Get("claimId") != "claim-1" {
			t.Errorf("unexpected claimId: %s", r.URL.Query().Get("claimId"))
		}
		if r.URL.Query().Get("txId") != "tx-1" {
			t.Errorf("unexpected txId: %s", r.URL.Query().Get("txId"))
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(GetCredentialOfferResponse{
			Status:         "published",
			OfferAvailable: true,
			QRCodeLink:     "https://example.com/offer-qr",
		})
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	result, err := client.Identity.Issuer.GetCredentialOffer(GetCredentialOfferOptions{
		ClaimID: "claim-1",
		TxID:    "tx-1",
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.Status != "published" {
		t.Errorf("expected published, got %s", result.Status)
	}
	if !result.OfferAvailable {
		t.Error("expected offer available")
	}
}

func TestGetCredentialOffer_MissingClaimID(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Identity.Issuer.GetCredentialOffer(GetCredentialOfferOptions{TxID: "tx-1"})
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "claimId is required") {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestGetCredentialOffer_MissingTxID(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Identity.Issuer.GetCredentialOffer(GetCredentialOfferOptions{ClaimID: "c-1"})
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "txId is required") {
		t.Errorf("unexpected error: %v", err)
	}
}

// ============================================================================
// IPFS
// ============================================================================

func TestStoreCredential_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/identity/ipfs/store-credential" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(StoreCredentialResponse{
			CID:            "QmTest123",
			DID:            "did:test:123",
			CredentialType: "KYCAgeCredential",
			Message:        "stored",
			Encrypted:      true,
		})
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	encrypted := true
	result, err := client.Identity.IPFS.StoreCredential(StoreCredentialOptions{
		DID:            "did:test:123",
		CredentialType: "KYCAgeCredential",
		Credential:     "encrypted-data",
		Encrypted:      &encrypted,
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.CID != "QmTest123" {
		t.Errorf("unexpected CID: %s", result.CID)
	}
}

func TestStoreCredential_MissingDID(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Identity.IPFS.StoreCredential(StoreCredentialOptions{
		CredentialType: "KYCAgeCredential",
	})
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "did is required") {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestStoreCredential_MissingCredentialType(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Identity.IPFS.StoreCredential(StoreCredentialOptions{
		DID: "did:test:123",
	})
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "credentialType is required") {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestStoreCredential_ServerError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(500)
		w.Write([]byte(`{"message":"error"}`))
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	_, err := client.Identity.IPFS.StoreCredential(StoreCredentialOptions{
		DID:            "did:test:123",
		CredentialType: "cred",
	})
	if err == nil {
		t.Fatal("expected error")
	}
	if _, ok := err.(*ServerError); !ok {
		t.Errorf("expected *ServerError, got %T", err)
	}
}

func TestRetrieveUserCredential_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/identity/retrieve-user-credential" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(RetrieveUserCredentialResponse{
			CID:            "QmRetrieve",
			DID:            "did:test:123",
			CredentialType: "KYCAgeCredential",
			Message:        "retrieved",
		})
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	result, err := client.Identity.IPFS.RetrieveUserCredential(RetrieveUserCredentialOptions{
		DID:            "did:test:123",
		CredentialType: "KYCAgeCredential",
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.CID != "QmRetrieve" {
		t.Errorf("unexpected CID: %s", result.CID)
	}
}

func TestRetrieveUserCredential_MissingDID(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Identity.IPFS.RetrieveUserCredential(RetrieveUserCredentialOptions{
		CredentialType: "cred",
	})
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestRetrieveUserCredential_MissingCredentialType(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Identity.IPFS.RetrieveUserCredential(RetrieveUserCredentialOptions{
		DID: "did:test:123",
	})
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestGetAllUserCredentials_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/identity/get-all-user-credentials" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(GetAllUserCredentialsResponse{
			DID:     "did:test:123",
			Count:   2,
			Message: "found",
			Credentials: map[string]interface{}{
				"KYCAgeCredential": "QmCid1",
				"ProofOfAge":       "QmCid2",
			},
		})
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	result, err := client.Identity.IPFS.GetAllUserCredentials(GetAllUserCredentialsOptions{
		DID: "did:test:123",
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.Count != 2 {
		t.Errorf("expected count 2, got %d", result.Count)
	}
	if len(result.Credentials) != 2 {
		t.Errorf("expected 2 credentials, got %d", len(result.Credentials))
	}
}

func TestGetAllUserCredentials_MissingDID(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Identity.IPFS.GetAllUserCredentials(GetAllUserCredentialsOptions{})
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "did is required") {
		t.Errorf("unexpected error: %v", err)
	}
}

// ============================================================================
// VERIFICATION
// ============================================================================

func TestVerifySignIn_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/identity/verify/sign-in" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(VerifySignInResponse{
			ProofRequestURL: "https://example.com/proof",
			Iden3commURL:    "iden3comm://example",
			SessionID:       "session-1",
		})
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	result, err := client.Identity.Verification.VerifySignIn(VerifySignInOptions{
		CredentialName: "ProofOfAgeCredential",
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.SessionID != "session-1" {
		t.Errorf("expected session-1, got %s", result.SessionID)
	}
}

func TestVerifySignIn_MissingCredentialName(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Identity.Verification.VerifySignIn(VerifySignInOptions{})
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "credentialName is required") {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestVerifySignIn_ServerError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(500)
		w.Write([]byte(`{"message":"error"}`))
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	_, err := client.Identity.Verification.VerifySignIn(VerifySignInOptions{
		CredentialName: "cred",
	})
	if err == nil {
		t.Fatal("expected error")
	}
	if _, ok := err.(*ServerError); !ok {
		t.Errorf("expected *ServerError, got %T", err)
	}
}

func TestGetLinkStore_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" {
			t.Errorf("expected GET, got %s", r.Method)
		}
		if !strings.Contains(r.URL.String(), "id=session-1") {
			t.Errorf("expected id=session-1, got %s", r.URL.String())
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(GetLinkStoreResponse{
			ID:   "session-1",
			ThID: "session-1",
			Type: "auth-request",
		})
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	result, err := client.Identity.Verification.GetLinkStore(GetLinkStoreOptions{ID: "session-1"})
	if err != nil {
		t.Fatal(err)
	}
	if result.ID != "session-1" {
		t.Errorf("expected session-1, got %s", result.ID)
	}
}

func TestGetLinkStore_MissingID(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Identity.Verification.GetLinkStore(GetLinkStoreOptions{})
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "id is required") {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestPostLinkStore_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("expected POST, got %s", r.Method)
		}
		if r.URL.Path != "/identity/verify/link-store" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(PostLinkStoreResponse{
			ProofRequestURL: "https://example.com/proof",
			Iden3commURL:    "iden3comm://example",
		})
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	result, err := client.Identity.Verification.PostLinkStore(PostLinkStoreOptions{
		ID:   "session-1",
		ThID: "session-1",
		Type: "auth-request",
		From: "did:test:verifier",
		Typ:  "application/iden3comm-plain-json",
		Body: map[string]interface{}{"scope": []interface{}{}},
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.ProofRequestURL != "https://example.com/proof" {
		t.Errorf("unexpected proof URL: %s", result.ProofRequestURL)
	}
}

func TestPostLinkStore_MissingID(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Identity.Verification.PostLinkStore(PostLinkStoreOptions{})
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "id is required") {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestVerifyCallback_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("expected POST, got %s", r.Method)
		}
		if !strings.Contains(r.URL.String(), "sessionId=session-1") {
			t.Errorf("expected sessionId=session-1, got %s", r.URL.String())
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(VerifyCallbackResponse{
			ID:   "resp-1",
			Type: "auth-response",
			From: "did:user:123",
			To:   "did:verifier:456",
		})
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	result, err := client.Identity.Verification.VerifyCallback(VerifyCallbackOptions{
		SessionID: "session-1",
		Token:     "jwz-token-data",
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.ID != "resp-1" {
		t.Errorf("expected resp-1, got %s", result.ID)
	}
	if result.From != "did:user:123" {
		t.Errorf("unexpected From: %s", result.From)
	}
}

func TestVerifyCallback_MissingSessionID(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Identity.Verification.VerifyCallback(VerifyCallbackOptions{
		Token: "token",
	})
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "sessionId is required") {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestVerifyCallback_MissingToken(t *testing.T) {
	client := newTestClient("http://unused")
	_, err := client.Identity.Verification.VerifyCallback(VerifyCallbackOptions{
		SessionID: "session-1",
	})
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "token is required") {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestVerifyCallback_AuthError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(401)
		w.Write([]byte(`{"message":"unauthorized"}`))
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	_, err := client.Identity.Verification.VerifyCallback(VerifyCallbackOptions{
		SessionID: "s-1",
		Token:     "bad-token",
	})
	if err == nil {
		t.Fatal("expected error")
	}
	if _, ok := err.(*AuthenticationError); !ok {
		t.Errorf("expected *AuthenticationError, got %T", err)
	}
}

// ============================================================================
// convertHTTPError (shared identity error converter)
// ============================================================================

func TestConvertHTTPError_NetworkError(t *testing.T) {
	client := newTestClient("http://127.0.0.1:1")
	_, err := client.Identity.Encryption.GetKey(GetEncryptedKeyOptions{DID: "did:test:1"})
	if err == nil {
		t.Fatal("expected error")
	}
	if _, ok := err.(*NetworkError); !ok {
		t.Errorf("expected *NetworkError, got %T", err)
	}
}

func TestConvertHTTPError_ClientError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(400)
		w.Write([]byte(`{"message":"bad request"}`))
	}))
	defer server.Close()

	client := newTestClient(server.URL)
	_, err := client.Identity.Encryption.GetKey(GetEncryptedKeyOptions{DID: "did:test:1"})
	if err == nil {
		t.Fatal("expected error")
	}
	sdkErr, ok := err.(*SDKError)
	if !ok {
		t.Fatalf("expected *SDKError, got %T", err)
	}
	if sdkErr.StatusCode != 400 {
		t.Errorf("expected 400, got %d", sdkErr.StatusCode)
	}
}
