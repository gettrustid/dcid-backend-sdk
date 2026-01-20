"""Basic usage example for DCID Backend SDK"""

import os
from dcid_backend_sdk import (
    DCIDBackendSDK,
    InitiateOTPOptions,
    ConfirmOTPOptions,
    GenerateEncryptionKeyOptions,
    IssueCredentialOptions,
)


def main():
    # Get API key from environment
    api_key = os.getenv("DCID_API_KEY")
    if not api_key:
        raise ValueError("DCID_API_KEY environment variable is required")

    # Initialize SDK
    sdk = DCIDBackendSDK(
        api_key=api_key,
        environment="dev",  # or 'prod'
        enable_request_logging=True,  # Enable logging in dev
    )

    print("=== DCID Backend SDK Basic Usage Example ===\n")

    # Example 1: OTP Registration/Sign-in
    print("1. Registering with OTP...")
    email = "user@example.com"
    result = sdk.auth.register_otp(InitiateOTPOptions(email=email))
    print(f"   OTP sent (dev only): {result.otp}\n")

    # Example 2: Confirm OTP
    print("2. Confirming OTP...")
    if result.otp:  # Only in dev environment
        tokens = sdk.auth.confirm_otp(
            ConfirmOTPOptions(email=email, otp=result.otp)
        )
        print(f"   Access Token: {tokens.access_token[:50]}...")
        print(f"   Refresh Token: {tokens.refresh_token[:50]}...\n")

        # Tokens are automatically set in SDK context
        print(f"   Current auth token: {sdk.get_auth_token()[:50]}...\n")

    # Example 3: Generate Encryption Key (requires authentication)
    print("3. Generating encryption key...")
    try:
        did = "did:iden3:dcid:main:2qadKcedyt3zCeTg7AqSvqsnBmwPvnSaX5qnGohLMT"
        key_result = sdk.identity.encryption.generate_key(
            GenerateEncryptionKeyOptions(did=did, owner_email=email)
        )
        print(f"   Encrypted Key: {key_result.encrypted_key[:50]}...")
        print(f"   DID: {key_result.did}")
        print(f"   Message: {key_result.message}\n")
    except Exception as e:
        print(f"   Error: {e}\n")

    # Example 4: Issue Credential (requires authentication)
    print("4. Issuing credential...")
    try:
        credential_result = sdk.identity.issuer.issue_credential(
            IssueCredentialOptions(
                did=did,
                credential_name="KYCAgeCredential",
                values={"birthday": 25, "documentType": 2},
                owner_email=email,
            )
        )
        if "qr_code_link" in credential_result:
            print(f"   QR Code Link: {credential_result['qr_code_link']}")
        else:
            print(f"   TX ID: {credential_result['tx_id']}")
            print(f"   Claim ID: {credential_result['claim_id']}")
        print()
    except Exception as e:
        print(f"   Error: {e}\n")

    # Example 5: Analytics - Start Session
    print("5. Starting analytics session...")
    try:
        from dcid_backend_sdk.modules.analytics.types import StartSessionEvent

        session_result = sdk.analytics.start_session(
            StartSessionEvent(
                user_id="user123", page_location="https://example.com/page"
            )
        )
        print(f"   Session ID: {session_result.session_id}")
        print(f"   Timestamp: {session_result.timestamp}\n")
    except Exception as e:
        print(f"   Error: {e}\n")

    print("=== Example completed successfully! ===")


if __name__ == "__main__":
    main()
