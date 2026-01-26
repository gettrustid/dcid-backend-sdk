# Publishing the DCID Backend SDK

Instructions for publishing each language SDK.

## Prerequisites

- Ensure all code changes are committed and pushed
- Update the version number before publishing (see [Versioning](#versioning))

---

## TypeScript (npm)

**Package:** `@dcid/server-sdk`
**Registry:** npmjs.com

### First-Time Setup

1. Login to npm (need access to the `@dcid` org):
   ```bash
   npm login
   ```

2. Verify you have access to the `@dcid` scope:
   ```bash
   npm whoami
   npm org ls @dcid
   ```

### Publishing

```bash
cd typescript

# Install dependencies
npm install

# Build is automatic via prepublishOnly, but you can verify first:
npm run build

# Publish (scoped packages need --access public)
npm publish --access public
```

### Version Bump

Update `version` in `typescript/package.json` before publishing:

```bash
cd typescript
npm version patch   # 0.1.0 → 0.1.1
# or
npm version minor   # 0.1.0 → 0.2.0
# or
npm version major   # 0.1.0 → 1.0.0
```

### Verify Published Package

```bash
npm info @dcid/server-sdk
```

---

## Python (PyPI)

**Package:** `dcid-server-sdk`
**Registry:** pypi.org

### First-Time Setup

1. Install build tools:
   ```bash
   pip install build twine
   ```

2. Create a PyPI account and configure credentials:
   ```bash
   # Option A: Use a PyPI API token (recommended)
   # Create token at https://pypi.org/manage/account/token/
   # Then create ~/.pypirc:
   cat > ~/.pypirc << 'EOF'
   [pypi]
   username = __token__
   password = pypi-YOUR-TOKEN-HERE
   EOF
   ```

### Publishing

```bash
cd python

# Clean previous builds
rm -rf dist/ build/ *.egg-info

# Build the package
python -m build

# Upload to PyPI
twine upload dist/*
```

### Test with TestPyPI First (Optional)

```bash
# Upload to test registry
twine upload --repository testpypi dist/*

# Test install from test registry
pip install --index-url https://test.pypi.org/simple/ dcid-server-sdk
```

### Version Bump

Update `version` in `python/setup.py` before publishing.

### Verify Published Package

```bash
pip install dcid-server-sdk --upgrade
pip show dcid-server-sdk
```

---

## Go (GitHub)

**Module:** `github.com/gettrustid/dcid-server-sdk/golang`

Go modules are published by tagging a commit in the Git repository. No separate registry upload is needed.

### Publishing

```bash
# From the repository root
# Tag the release (use golang/ prefix for the submodule)
git tag golang/v0.1.0
git push origin golang/v0.1.0
```

### Version Bump

Update the tag version when publishing. Go uses semantic versioning via git tags.

### Verify Published Module

```bash
go list -m github.com/gettrustid/dcid-server-sdk/golang@v0.1.0
```

---

## Versioning

All SDKs should be versioned together. Before a release:

1. Update `typescript/package.json` → `"version": "X.Y.Z"`
2. Update `python/setup.py` → `version="X.Y.Z"`
3. Tag the Go module → `golang/vX.Y.Z`

Follow [Semantic Versioning](https://semver.org/):
- **patch** (0.1.0 → 0.1.1): Bug fixes, no API changes
- **minor** (0.1.0 → 0.2.0): New features, backward compatible
- **major** (0.1.0 → 1.0.0): Breaking API changes
