"""
DCID Backend SDK for Python

A Python SDK for interacting with the DCID Backend API.
"""

from .client import DCIDBackendSDK
from .types import (
    DCIDBackendSDKConfig,
    InitiateOTPResponse,
    TokenResponse,
    InitiateOTPOptions,
    ConfirmOTPOptions,
    RefreshTokenOptions,
    GenerateEncryptionKeyOptions,
    GenerateEncryptionKeyResponse,
    GetEncryptedKeyOptions,
    GetEncryptedKeyResponse,
    IssueCredentialOptions,
    IssueCredentialResponse,
    GetCredentialOfferOptions,
    GetCredentialOfferResponse,
    StoreCredentialOptions,
    StoreCredentialResponse,
    RetrieveUserCredentialOptions,
    RetrieveUserCredentialResponse,
    GetAllUserCredentialsOptions,
    GetAllUserCredentialsResponse,
    VerifySignInOptions,
    VerifySignInResponse,
    PostLinkStoreOptions,
    PostLinkStoreResponse,
    GetLinkStoreOptions,
    GetLinkStoreResponse,
    VerifyCallbackOptions,
    VerifyCallbackResponse,
    DCIDBackendSDKError,
    NetworkError,
    AuthenticationError,
    ServerError,
)
from .modules.auth.otp import AuthOTP
from .modules.identity.encryption.key_manager import KeyManager
from .modules.identity.issuer.issuer import Issuer
from .modules.identity.ipfs.ipfs import IPFS
from .modules.identity.verification.verification import Verification
from .modules.analytics.analytics import Analytics
from .config.environments import ENVIRONMENTS, get_environment_config, EnvironmentConfig
from .utils.logger import Logger, ConsoleLogger, NoOpLogger

__version__ = "0.1.0"

__all__ = [
    "DCIDBackendSDK",
    "DCIDBackendSDKConfig",
    "InitiateOTPResponse",
    "TokenResponse",
    "InitiateOTPOptions",
    "ConfirmOTPOptions",
    "RefreshTokenOptions",
    "GenerateEncryptionKeyOptions",
    "GenerateEncryptionKeyResponse",
    "GetEncryptedKeyOptions",
    "GetEncryptedKeyResponse",
    "IssueCredentialOptions",
    "IssueCredentialResponse",
    "GetCredentialOfferOptions",
    "GetCredentialOfferResponse",
    "StoreCredentialOptions",
    "StoreCredentialResponse",
    "RetrieveUserCredentialOptions",
    "RetrieveUserCredentialResponse",
    "GetAllUserCredentialsOptions",
    "GetAllUserCredentialsResponse",
    "VerifySignInOptions",
    "VerifySignInResponse",
    "PostLinkStoreOptions",
    "PostLinkStoreResponse",
    "GetLinkStoreOptions",
    "GetLinkStoreResponse",
    "VerifyCallbackOptions",
    "VerifyCallbackResponse",
    "DCIDBackendSDKError",
    "NetworkError",
    "AuthenticationError",
    "ServerError",
    "AuthOTP",
    "KeyManager",
    "Issuer",
    "IPFS",
    "Verification",
    "Analytics",
    "ENVIRONMENTS",
    "get_environment_config",
    "EnvironmentConfig",
    "Logger",
    "ConsoleLogger",
    "NoOpLogger",
]
