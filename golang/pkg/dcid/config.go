package trustid

import (
	"os"
	"time"
)

// Environment represents the SDK environment (dev or prod)
type Environment string

const (
	// EnvironmentDev is the development environment
	EnvironmentDev Environment = "dev"
	// EnvironmentProd is the production environment
	EnvironmentProd Environment = "prod"
)

// Config holds SDK configuration
type Config struct {
	// Environment specifies the environment (dev or prod)
	Environment Environment
	// APIKey is required for API authentication
	APIKey string
	// Timeout specifies the request timeout (default: 30s)
	Timeout time.Duration
	// Logger is an optional logger instance
	Logger Logger
	// EnableRequestLogging enables request/response logging (default: false in prod, true in dev)
	EnableRequestLogging *bool
}

// EnvironmentConfig holds environment-specific configuration
type EnvironmentConfig struct {
	// BaseURL is the API base URL
	BaseURL string
}

// getEnvironmentConfig returns the configuration for the given environment
func getEnvironmentConfig(env Environment) EnvironmentConfig {
	// Check for environment variable override (useful for Docker)
	baseURL := os.Getenv("TRUSTID_BASE_URL")
	if baseURL != "" {
		return EnvironmentConfig{BaseURL: baseURL}
	}

	switch env {
	case EnvironmentDev:
		return EnvironmentConfig{
			// Use host.docker.internal for Docker Desktop to access host/other containers
			BaseURL: "http://host.docker.internal:5000/api",
			// Alternative: "http://localhost:5000/api" (if running locally, not in Docker)
		}
	case EnvironmentProd:
		return EnvironmentConfig{
			BaseURL: "http://host.docker.internal:5000/api",
		}
	default:
		// Default to dev
		return EnvironmentConfig{
			BaseURL: "http://host.docker.internal:5000/api",
		}
	}
}



