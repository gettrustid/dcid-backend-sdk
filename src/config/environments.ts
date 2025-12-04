/**
 * Environment configuration for TrustID SDK
 *
 * Contains hard-coded URLs for different environments (dev, prod)
 */
export interface EnvironmentConfig {
  /** API base URL */
  baseUrl: string;
  /** SGTM Proxy base URL for analytics events */
  sgtmProxyBaseUrl: string;
}

/**
 * Environment configurations
 */
export const ENVIRONMENTS: Record<"dev" | "prod", EnvironmentConfig> = {
  dev: {
    // baseUrl: "http://localhost:5000/api",
    // baseUrl: "https://dev.trustid.life/api",
    baseUrl: "http://krakend.dev-external.trustid.life/api",
    // sgtmProxyBaseUrl: "http://localhost:5000/api/analytics",
    // sgtmProxyBaseUrl: "https://dev.trustid.life/server/api/analytics",
    sgtmProxyBaseUrl: "http://krakend.dev-external.trustid.life/api/analytics",
  },
  prod: {
    baseUrl: "http://krakend.dev-external.trustid.life/api",
    sgtmProxyBaseUrl: "https://sgtm-proxy.external.trustid.life/api",
  },
};

/**
 * Get environment configuration
 *
 * @param environment - Environment name ('dev' or 'prod')
 * @returns Environment configuration
 */
export function getEnvironmentConfig(
  environment: "dev" | "prod"
): EnvironmentConfig {
  const config = ENVIRONMENTS[environment];
  if (!config) {
    throw new Error(
      `Invalid environment: ${environment}. Must be 'dev' or 'prod'.`
    );
  }
  return config;
}
