package dcid

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

// ============================================================================
// IDENTITY - ENCRYPTION TYPES
// ============================================================================

// GenerateEncryptionKeyOptions are options for generating an encryption key
type GenerateEncryptionKeyOptions struct {
	// DID is the decentralized identifier (must start with "did:")
	DID string `json:"did"`
	// OwnerEmail is the owner's email address (must contain "@")
	OwnerEmail string `json:"ownerEmail"`
}

// GenerateEncryptionKeyResponse is the response from generating an encryption key
type GenerateEncryptionKeyResponse struct {
	// EncryptedKey is the MetaKeep encrypted key
	EncryptedKey string `json:"encryptedKey"`
	// DID is the decentralized identifier
	DID string `json:"did"`
	// OwnerEmail is the owner's email address
	OwnerEmail string `json:"ownerEmail"`
	// Message is a status message
	Message string `json:"message"`
}

// GetEncryptedKeyOptions are options for getting an encrypted key
type GetEncryptedKeyOptions struct {
	// DID is the decentralized identifier (must start with "did:")
	DID string `json:"did"`
}

// GetEncryptedKeyResponse is the response from getting an encrypted key
type GetEncryptedKeyResponse struct {
	// EncryptedKey is the MetaKeep encrypted key
	EncryptedKey string `json:"encryptedKey"`
	// DID is the decentralized identifier
	DID string `json:"did"`
	// Message is a status message
	Message string `json:"message"`
}

// ============================================================================
// IDENTITY - ISSUER TYPES
// ============================================================================

// IssueCredentialOptions are options for issuing a credential
type IssueCredentialOptions struct {
	// DID is the decentralized identifier (must start with "did:")
	DID string `json:"did"`
	// CredentialName is the credential type name (e.g., "KYCAgeCredential")
	CredentialName string `json:"credentialName"`
	// Values are the credential attribute values
	Values map[string]interface{} `json:"values"`
	// OwnerEmail is the owner's email address (must contain "@")
	OwnerEmail string `json:"ownerEmail"`
}

// IssueCredentialResponse is the response from issuing a credential
// For SIG credentials: QRCodeLink and SchemaType are populated
// For MTP credentials: TxID and ClaimID are populated
type IssueCredentialResponse struct {
	// QRCodeLink is the QR code link (SIG credentials)
	QRCodeLink string `json:"qrCodeLink,omitempty"`
	// SchemaType is the schema type (SIG credentials)
	SchemaType string `json:"schemaType,omitempty"`
	// TxID is the blockchain transaction ID (MTP credentials)
	TxID string `json:"txId,omitempty"`
	// ClaimID is the credential claim ID (MTP credentials)
	ClaimID string `json:"claimId,omitempty"`
}

// GetCredentialOfferOptions are options for getting a credential offer
type GetCredentialOfferOptions struct {
	// ClaimID is the credential claim ID
	ClaimID string `json:"claimId"`
	// TxID is the blockchain transaction ID
	TxID string `json:"txId"`
}

// GetCredentialOfferResponse is the response from getting a credential offer
type GetCredentialOfferResponse struct {
	// Status is "published" or "pending"
	Status string `json:"status"`
	// TxID is the blockchain transaction ID
	TxID string `json:"txId"`
	// ClaimID is the credential claim ID
	ClaimID string `json:"claimId"`
	// OfferAvailable indicates if the offer is ready
	OfferAvailable bool `json:"offerAvailable"`
	// QRCodeLink is the QR code link (only if status is "published")
	QRCodeLink string `json:"qrCodeLink,omitempty"`
	// Offer is the full offer data (only if status is "published")
	Offer interface{} `json:"offer,omitempty"`
	// Message is a status message (only if status is "pending")
	Message string `json:"message,omitempty"`
}

// ============================================================================
// IDENTITY - IPFS TYPES
// ============================================================================

// StoreCredentialOptions are options for storing a credential
type StoreCredentialOptions struct {
	// DID is the decentralized identifier
	DID string `json:"did"`
	// CredentialType is the credential type name
	CredentialType string `json:"credentialType"`
	// Credential is the credential data (string if encrypted, object if not)
	Credential interface{} `json:"credential"`
	// Encrypted indicates if the credential is encrypted (defaults to true)
	Encrypted *bool `json:"encrypted,omitempty"`
}

// StoreCredentialResponse is the response from storing a credential
type StoreCredentialResponse struct {
	// CID is the IPFS Content Identifier
	CID string `json:"cid"`
	// DID is the decentralized identifier
	DID string `json:"did"`
	// CredentialType is the credential type name
	CredentialType string `json:"credentialType"`
	// Message is a status message
	Message string `json:"message"`
	// Encrypted indicates if the credential is encrypted
	Encrypted bool `json:"encrypted"`
}

// RetrieveUserCredentialOptions are options for retrieving a user credential
type RetrieveUserCredentialOptions struct {
	// DID is the decentralized identifier
	DID string `json:"did"`
	// CredentialType is the credential type to retrieve
	CredentialType string `json:"credentialType"`
	// IncludeCidOnly if true, returns only CID (faster)
	IncludeCidOnly bool `json:"includeCidOnly,omitempty"`
}

// RetrieveUserCredentialResponse is the response from retrieving a user credential
type RetrieveUserCredentialResponse struct {
	// Credential is the credential data (only when IncludeCidOnly=false)
	Credential interface{} `json:"credential,omitempty"`
	// CID is the IPFS Content Identifier
	CID string `json:"cid"`
	// DID is the decentralized identifier
	DID string `json:"did"`
	// CredentialType is the credential type name
	CredentialType string `json:"credentialType"`
	// Encrypted indicates if the credential is encrypted
	Encrypted bool `json:"encrypted,omitempty"`
	// Message is a status message
	Message string `json:"message"`
}

// GetAllUserCredentialsOptions are options for getting all user credentials
type GetAllUserCredentialsOptions struct {
	// DID is the decentralized identifier
	DID string `json:"did"`
	// IncludeCredentialData if true, includes full credential data
	IncludeCredentialData bool `json:"includeCredentialData,omitempty"`
}

// GetAllUserCredentialsResponse is the response from getting all user credentials
type GetAllUserCredentialsResponse struct {
	// Credentials is a map of credential type to CID or full data
	Credentials map[string]interface{} `json:"credentials"`
	// DID is the decentralized identifier
	DID string `json:"did"`
	// Count is the number of credentials
	Count int `json:"count"`
	// Message is a status message
	Message string `json:"message"`
}

// ============================================================================
// IDENTITY - VERIFICATION TYPES
// ============================================================================

// VerifySignInOptions are options for initiating verification
type VerifySignInOptions struct {
	// CredentialName is the credential type to verify (e.g., "ProofOfAgeCredential")
	CredentialName string `json:"credentialName"`
}

// VerifySignInResponse is the response from initiating verification
type VerifySignInResponse struct {
	// ProofRequestURL is the URL to fetch the proof request
	ProofRequestURL string `json:"proofRequestUrl"`
	// Iden3commURL is the deep link for wallet apps
	Iden3commURL string `json:"iden3commUrl"`
	// SessionID is the session identifier for subsequent steps
	SessionID string `json:"sessionId"`
}

// GetLinkStoreOptions are options for getting a stored proof request
type GetLinkStoreOptions struct {
	// ID is the session ID
	ID string `json:"id"`
}

// GetLinkStoreResponse is the response from getting a stored proof request
type GetLinkStoreResponse struct {
	// ID is the session ID
	ID string `json:"id"`
	// ThID is the thread ID
	ThID string `json:"thid"`
	// Type is the request type
	Type string `json:"type"`
	// From is the verifier DID
	From string `json:"from"`
	// Typ is the content type
	Typ string `json:"typ"`
	// Body contains the proof request details
	Body map[string]interface{} `json:"body"`
}

// PostLinkStoreOptions are options for storing a proof request
type PostLinkStoreOptions struct {
	// ID is the session ID
	ID string `json:"id"`
	// ThID is the thread ID
	ThID string `json:"thid"`
	// Type is the request type
	Type string `json:"type"`
	// From is the verifier DID
	From string `json:"from"`
	// Typ is the content type
	Typ string `json:"typ"`
	// Body contains the proof request details
	Body map[string]interface{} `json:"body"`
}

// PostLinkStoreResponse is the response from storing a proof request
type PostLinkStoreResponse struct {
	// ProofRequestURL is the URL to fetch the proof request
	ProofRequestURL string `json:"proofRequestUrl"`
	// Iden3commURL is the deep link for wallet apps
	Iden3commURL string `json:"iden3commUrl"`
}

// VerifyCallbackOptions are options for verifying a callback
type VerifyCallbackOptions struct {
	// SessionID is the session identifier
	SessionID string `json:"sessionId"`
	// Token is the JWZ token (proof response from wallet)
	Token string `json:"token"`
}

// VerifyCallbackResponse is the response from verifying a callback
type VerifyCallbackResponse struct {
	// ID is the response ID
	ID string `json:"id"`
	// Typ is the content type
	Typ string `json:"typ"`
	// Type is the response type
	Type string `json:"type"`
	// ThID is the thread ID
	ThID string `json:"thid"`
	// Body contains the verification response details
	Body map[string]interface{} `json:"body"`
	// From is the user's DID
	From string `json:"from"`
	// To is the verifier's DID
	To string `json:"to"`
}



