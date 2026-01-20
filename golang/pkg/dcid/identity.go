package dcid

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
	client *Client
}

// Issuer provides credential issuance methods
type Issuer struct {
	client *Client
}

// IPFS provides IPFS credential storage methods
type IPFS struct {
	client *Client
}

// Verification provides verification flow methods
type Verification struct {
	client *Client
}

