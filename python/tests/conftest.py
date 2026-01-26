"""Shared test fixtures for DCID Server SDK tests."""

import pytest
from unittest.mock import MagicMock, patch

from dcid_server_sdk.utils.http import HTTPClient
from dcid_server_sdk.utils.logger import NoOpLogger


@pytest.fixture
def mock_http_client():
    """Create an HTTPClient with a mocked requests layer."""
    return HTTPClient(
        base_url="http://test-server",
        timeout=5000,
        default_headers={"X-API-Key": "test-api-key"},
        logger=NoOpLogger(),
    )


@pytest.fixture
def mock_auth_http_client():
    """HTTPClient without auth tokens (for auth endpoints)."""
    return HTTPClient(
        base_url="http://test-server",
        timeout=5000,
        default_headers={"X-API-Key": "test-api-key"},
        logger=NoOpLogger(),
    )


@pytest.fixture
def mock_authenticated_http_client():
    """HTTPClient with auth token getter (for identity endpoints)."""
    return HTTPClient(
        base_url="http://test-server",
        timeout=5000,
        default_headers={"X-API-Key": "test-api-key"},
        get_auth_token=lambda: "test-auth-token",
        get_refresh_token=lambda: "test-refresh-token",
        logger=NoOpLogger(),
    )


def make_mock_response(status_code=200, json_data=None, text="", headers=None):
    """Create a mock requests.Response object."""
    response = MagicMock()
    response.status_code = status_code
    response.json.return_value = json_data or {}
    response.text = text or (str(json_data) if json_data else "")
    response.headers = headers or {}
    response.reason = "OK" if status_code < 400 else "Error"
    response.url = "http://test-server/test"
    response.request = MagicMock()
    response.request.method = "POST"
    response.request.headers = {"Content-Type": "application/json"}
    return response
