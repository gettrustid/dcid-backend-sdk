# Publishing dcid-server-sdk to PyPI

## Prerequisites

- Python 3.8+
- A [PyPI account](https://pypi.org/account/register/)
- A [TestPyPI account](https://test.pypi.org/account/register/) (for pre-release testing)
- API tokens from both [PyPI](https://pypi.org/manage/account/token/) and [TestPyPI](https://test.pypi.org/manage/account/token/)

## 1. Configure PyPI credentials

Create or edit `~/.pypirc`:

```bash
touch ~/.pypirc
chmod 600 ~/.pypirc
```

Add tokens for both registries:

```ini
[pypi]
  username = __token__
  password = pypi-XXXXXXXXXXXXXXXXXXXX

[testpypi]
  username = __token__
  password = pypi-XXXXXXXXXXXXXXXXXXXX
```

> **Note:** The username is literally `__token__` (with double underscores). The password is your full API token including the `pypi-` prefix. PyPI and TestPyPI have separate accounts and separate tokens.

## 2. Install build tools

```bash
pip install build twine
```

## 3. Build the package

```bash
cd python
rm -rf dist/ build/ *.egg-info
python -m build
```

This produces two files in `dist/`:
- `dcid_server_sdk-X.Y.Z.tar.gz` (source distribution)
- `dcid_server_sdk-X.Y.Z-py3-none-any.whl` (wheel)

## 4. Verify the package (optional)

```bash
twine check dist/*
```

## 5. Test before release (recommended)

TestPyPI is a separate instance of PyPI meant for testing. Always publish here first to catch packaging issues before going to production.

### Upload to TestPyPI:

```bash
twine upload --repository testpypi dist/*
```

### Install from TestPyPI:

```bash
pip install -i https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ dcid-server-sdk==0.1.0
```

> The `--extra-index-url` flag tells pip to pull dependencies (like `requests`) from real PyPI, since TestPyPI may not have them.

### Sanity check:

```python
from dcid_server_sdk import DCIDServerSDK

sdk = DCIDServerSDK(api_key="test-key", environment="dev")
print(sdk.auth)       # <AuthOTP>
print(sdk.identity)   # <Identity>
print(sdk.analytics)  # <Analytics>
```

If the imports and initialization work, the package is good to go.

## 6. Publish to PyPI (production)

```bash
twine upload dist/*
```

Verify:

```bash
pip install dcid-server-sdk
```

## Versioning

Update the version in **both** files before publishing a new release:
- `pyproject.toml` (`version = "X.Y.Z"`)
- `dcid_server_sdk/__init__.py` (`__version__ = "X.Y.Z"`)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `403 Forbidden` | Check that your API token is correct and includes the `pypi-` prefix |
| `400 File already exists` | You cannot overwrite a published version. Bump the version number |
| `Invalid or non-existent authentication` | Verify `~/.pypirc` uses `__token__` as the username |
| TestPyPI install pulls local package | Remove `*.egg-info` dirs and run from a different directory |
