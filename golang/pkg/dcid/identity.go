package dcid

import (
	"fmt"
	"strings"
	"time"

	httpclient "github.com/gettrustid/dcid-server-sdk/golang/internal/http"
)

// IdentityClient provides identity management methods
type IdentityClient struct {
	// Encryption provides encryption key management methods
	Encryption *Encryption
	// Issuer provides credential issuance methods
	Issuer *Issuer
	// IPFS provides IPFS credential storage methods
	IPFS *IPFS
	// Verification provides verification flow methods
	Verification *Verification
}

// Encryption provides encryption key management methods
type Encryption struct {
	client     *Client
	httpClient *httpclient.Client
}

// Issuer provides credential issuance methods
type Issuer struct {
	client     *Client
	httpClient *httpclient.Client
}

// IPFS provides IPFS credential storage methods
type IPFS struct {
	client     *Client
	httpClient *httpclient.Client
}

// Verification provides verification flow methods
type Verification struct {
	client     *Client
	httpClient *httpclient.Client
}

// ============================================================================
// ENCRYPTION METHODS
// ============================================================================

// GenerateKey generates an AES-256 encryption key for a DID
//
// This method covers the endpoint: POST /identity/generate-encryption-key
//
// Example:
//
//	result, err := client.Identity.Encryption.GenerateKey(dcid.GenerateEncryptionKeyOptions{
//		DID:        "did:polygonid:polygon:amoy:...",
//		OwnerEmail: "user@example.com",
//	})
func (e *Encryption) GenerateKey(options GenerateEncryptionKeyOptions) (*GenerateEncryptionKeyResponse, error) {
	if !strings.HasPrefix(options.DID, "did:") {
		return nil, fmt.Errorf("DID must start with 'did:'")
	}
	if !strings.Contains(options.OwnerEmail, "@") {
		return nil, fmt.Errorf("ownerEmail must be a valid email address")
	}

	var result GenerateEncryptionKeyResponse
	err := e.httpClient.Post("/identity/generate-encryption-key", options, &result)
	if err != nil {
		return nil, convertHTTPError(err)
	}
	return &result, nil
}

// GetKey retrieves the encrypted decryption key for a specific DID
//
// This method covers the endpoint: POST /identity/get-encrypted-key
//
// Example:
//
//	result, err := client.Identity.Encryption.GetKey(dcid.GetEncryptedKeyOptions{
//		DID: "did:polygonid:polygon:amoy:...",
//	})
func (e *Encryption) GetKey(options GetEncryptedKeyOptions) (*GetEncryptedKeyResponse, error) {
	if !strings.HasPrefix(options.DID, "did:") {
		return nil, fmt.Errorf("DID must start with 'did:'")
	}

	var result GetEncryptedKeyResponse
	err := e.httpClient.Post("/identity/get-encrypted-key", options, &result)
	if err != nil {
		return nil, convertHTTPError(err)
	}
	return &result, nil
}

// ============================================================================
// ISSUER METHODS
// ============================================================================

// IssueCredential issues a new SIG or MTP credential for a user
//
// This method covers the endpoint: POST /identity/issuer/issue-credential
//
// For SIG credentials: Returns QRCodeLink and SchemaType immediately
// For MTP credentials: Returns TxID and ClaimID (use GetCredentialOffer after state is published)
//
// Example:
//
//	result, err := client.Identity.Issuer.IssueCredential(dcid.IssueCredentialOptions{
//		DID:            "did:polygonid:polygon:amoy:...",
//		CredentialName: "KYCAgeCredential",
//		Values:         map[string]interface{}{"birthday": 25, "documentType": 2},
//		OwnerEmail:     "user@example.com",
//	})
func (i *Issuer) IssueCredential(options IssueCredentialOptions) (*IssueCredentialResponse, error) {
	if !strings.HasPrefix(options.DID, "did:") {
		return nil, fmt.Errorf("DID must start with 'did:'")
	}
	if options.CredentialName == "" {
		return nil, fmt.Errorf("credentialName is required")
	}
	if !strings.Contains(options.OwnerEmail, "@") {
		return nil, fmt.Errorf("ownerEmail must be a valid email address")
	}

	var result IssueCredentialResponse
	err := i.httpClient.Post("/identity/issuer/issue-credential", options, &result)
	if err != nil {
		return nil, convertHTTPError(err)
	}
	return &result, nil
}

// GetCredentialOffer checks if MTP credential state is published and returns the offer link
//
// This method covers the endpoint: GET /identity/issuer/get-credential-offer
//
// Example:
//
//	result, err := client.Identity.Issuer.GetCredentialOffer(dcid.GetCredentialOfferOptions{
//		ClaimID: "claim-id",
//		TxID:    "tx-id",
//	})
func (i *Issuer) GetCredentialOffer(options GetCredentialOfferOptions) (*GetCredentialOfferResponse, error) {
	if options.ClaimID == "" {
		return nil, fmt.Errorf("claimId is required")
	}
	if options.TxID == "" {
		return nil, fmt.Errorf("txId is required")
	}

	var result GetCredentialOfferResponse
	endpoint := fmt.Sprintf("/identity/issuer/get-credential-offer?claimId=%s&txId=%s", options.ClaimID, options.TxID)
	err := i.httpClient.Get(endpoint, &result)
	if err != nil {
		return nil, convertHTTPError(err)
	}
	return &result, nil
}

// ============================================================================
// IPFS METHODS
// ============================================================================

// StoreCredential stores credential data to IPFS and saves the CID to PostgreSQL
//
// This method covers the endpoint: POST /identity/ipfs/store-credential
//
// Example:
//
//	encrypted := true
//	result, err := client.Identity.IPFS.StoreCredential(dcid.StoreCredentialOptions{
//		DID:            "did:polygonid:polygon:amoy:...",
//		CredentialType: "KYCAgeCredential",
//		Credential:     "encrypted-credential-string",
//		Encrypted:      &encrypted,
//	})
func (ip *IPFS) StoreCredential(options StoreCredentialOptions) (*StoreCredentialResponse, error) {
	if options.DID == "" {
		return nil, fmt.Errorf("did is required")
	}
	if options.CredentialType == "" {
		return nil, fmt.Errorf("credentialType is required")
	}

	var result StoreCredentialResponse
	err := ip.httpClient.Post("/identity/ipfs/store-credential", options, &result)
	if err != nil {
		return nil, convertHTTPError(err)
	}
	return &result, nil
}

// RetrieveUserCredential retrieves a user credential by looking up CID in PostgreSQL
//
// This method covers the endpoint: POST /identity/retrieve-user-credential
//
// Example:
//
//	result, err := client.Identity.IPFS.RetrieveUserCredential(dcid.RetrieveUserCredentialOptions{
//		DID:            "did:polygonid:polygon:amoy:...",
//		CredentialType: "KYCAgeCredential",
//		IncludeCidOnly: false,
//	})
func (ip *IPFS) RetrieveUserCredential(options RetrieveUserCredentialOptions) (*RetrieveUserCredentialResponse, error) {
	if options.DID == "" {
		return nil, fmt.Errorf("did is required")
	}
	if options.CredentialType == "" {
		return nil, fmt.Errorf("credentialType is required")
	}

	var result RetrieveUserCredentialResponse
	err := ip.httpClient.Post("/identity/retrieve-user-credential", options, &result)
	if err != nil {
		return nil, convertHTTPError(err)
	}
	return &result, nil
}

// GetAllUserCredentials retrieves all credential CIDs for a user
//
// This method covers the endpoint: POST /identity/get-all-user-credentials
//
// Example:
//
//	result, err := client.Identity.IPFS.GetAllUserCredentials(dcid.GetAllUserCredentialsOptions{
//		DID:                   "did:polygonid:polygon:amoy:...",
//		IncludeCredentialData: false,
//	})
func (ip *IPFS) GetAllUserCredentials(options GetAllUserCredentialsOptions) (*GetAllUserCredentialsResponse, error) {
	if options.DID == "" {
		return nil, fmt.Errorf("did is required")
	}

	var result GetAllUserCredentialsResponse
	err := ip.httpClient.Post("/identity/get-all-user-credentials", options, &result)
	if err != nil {
		return nil, convertHTTPError(err)
	}
	return &result, nil
}

// ============================================================================
// VERIFICATION METHODS
// ============================================================================

// VerifySignIn initiates a verification request for a specific credential type
//
// This method covers the endpoint: POST /identity/verify/sign-in
//
// Example:
//
//	result, err := client.Identity.Verification.VerifySignIn(dcid.VerifySignInOptions{
//		CredentialName: "ProofOfAgeCredential",
//	})
func (v *Verification) VerifySignIn(options VerifySignInOptions) (*VerifySignInResponse, error) {
	if options.CredentialName == "" {
		return nil, fmt.Errorf("credentialName is required")
	}

	var result VerifySignInResponse
	err := v.httpClient.Post("/identity/verify/sign-in", options, &result)
	if err != nil {
		return nil, convertHTTPError(err)
	}
	return &result, nil
}

// GetLinkStore retrieves the stored proof request from Redis using session ID
//
// This method covers the endpoint: GET /identity/verify/link-store
//
// Example:
//
//	result, err := client.Identity.Verification.GetLinkStore(dcid.GetLinkStoreOptions{
//		ID: "session-id",
//	})
func (v *Verification) GetLinkStore(options GetLinkStoreOptions) (*GetLinkStoreResponse, error) {
	if options.ID == "" {
		return nil, fmt.Errorf("id is required")
	}

	var result GetLinkStoreResponse
	endpoint := fmt.Sprintf("/identity/verify/link-store?id=%s", options.ID)
	err := v.httpClient.Get(endpoint, &result)
	if err != nil {
		return nil, convertHTTPError(err)
	}
	return &result, nil
}

// PostLinkStore stores the proof request JSON in Redis with 1-hour TTL
//
// This method covers the endpoint: POST /identity/verify/link-store
//
// Example:
//
//	result, err := client.Identity.Verification.PostLinkStore(dcid.PostLinkStoreOptions{
//		ID:   "session-id",
//		ThID: "session-id",
//		Type: "https://iden3-communication.io/authorization/1.0/request",
//		From: "did:polygonid:polygon:amoy:...",
//		Typ:  "application/iden3comm-plain-json",
//		Body: map[string]interface{}{...},
//	})
func (v *Verification) PostLinkStore(options PostLinkStoreOptions) (*PostLinkStoreResponse, error) {
	if options.ID == "" {
		return nil, fmt.Errorf("id is required")
	}

	var result PostLinkStoreResponse
	err := v.httpClient.Post("/identity/verify/link-store", options, &result)
	if err != nil {
		return nil, convertHTTPError(err)
	}
	return &result, nil
}

// VerifyCallback submits proof response (JWZ token) for verification
//
// This method covers the endpoint: POST /identity/verify/callback?sessionId=...
//
// Example:
//
//	result, err := client.Identity.Verification.VerifyCallback(dcid.VerifyCallbackOptions{
//		SessionID: "session-id",
//		Token:     "jwz-token",
//	})
func (v *Verification) VerifyCallback(options VerifyCallbackOptions) (*VerifyCallbackResponse, error) {
	if options.SessionID == "" {
		return nil, fmt.Errorf("sessionId is required")
	}
	if options.Token == "" {
		return nil, fmt.Errorf("token is required")
	}

	var result VerifyCallbackResponse
	endpoint := fmt.Sprintf("/identity/verify/callback?sessionId=%s", options.SessionID)
	err := v.httpClient.Post(endpoint, map[string]string{"token": options.Token}, &result)
	if err != nil {
		return nil, convertHTTPError(err)
	}
	return &result, nil
}

// ============================================================================
// ERROR HELPER
// ============================================================================

// convertHTTPError converts HTTP errors to SDK errors
func convertHTTPError(err error) error {
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
