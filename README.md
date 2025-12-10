# TrustID SDK - Multi-Language SDK Repository

This repository contains the TrustID SDK implementations for multiple programming languages.

## 📦 Available SDKs

### TypeScript/JavaScript SDK
- **Location**: [`typescript/`](./typescript/)
- **Status**: ✅ Production Ready
- **Documentation**: [TypeScript SDK README](./typescript/README.md)
- **Installation**: `npm install @trustid/portalapi-sdk`

### Python SDK
- **Location**: [`python/`](./python/)
- **Status**: ✅ Production Ready
- **Documentation**: [Python SDK README](./python/README.md)
- **Installation**: `pip install trustid-portalapi-sdk`

### Golang SDK
- **Location**: [`golang/`](./golang/)
- **Status**: ✅ Production Ready
- **Documentation**: [Golang SDK README](./golang/README.md)

## 🏗️ Repository Structure

```
trustid-sdk/
├── typescript/          # TypeScript/JavaScript SDK
│   ├── src/            # Source code
│   ├── dist/           # Build output
│   ├── examples/       # Usage examples
│   └── README.md       # SDK documentation
├── python/             # Python SDK
│   ├── trustid_sdk/   # Source code
│   ├── test_server/   # Test server
│   ├── examples/      # Usage examples
│   └── README.md      # SDK documentation
├── golang/            # Go SDK
│   ├── pkg/           # Source code
│   ├── cmd/           # Test server
│   ├── examples/      # Usage examples
│   └── README.md      # SDK documentation
└── README.md          # This file
```

## 🚀 Quick Start

### TypeScript/JavaScript

```bash
cd typescript
npm install
npm run build
```

See [TypeScript SDK README](./typescript/README.md) for detailed usage.

### Python

```bash
cd python
pip install -r requirements.txt
python examples/basic_usage.py
```

See [Python SDK README](./python/README.md) for detailed usage.

### Golang

```bash
cd golang
go mod download
go run examples/basic_usage.go
```

See [Golang SDK README](./golang/README.md) for detailed usage.

## 🤝 Contributing

This is a monorepo containing multiple SDK implementations. Each language SDK is in its own folder with its own build system and dependencies.

## 📄 License

ISC

