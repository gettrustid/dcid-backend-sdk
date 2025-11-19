/**
 * Environment configuration for TrustID SDK
 *
 * Contains hard-coded URLs for different environments (dev, prod)
 */
export interface EnvironmentConfig {
  /** API base URL */
  baseUrl: string;
  /** WebSocket URL for MTP credential updates */
  wsUrl: string;
  /** SGTM Proxy base URL for analytics events */
  sgtmProxyBaseUrl: string;
}

/**
 * Environment configurations
 */
export const ENVIRONMENTS: Record<"dev" | "prod", EnvironmentConfig> = {
  dev: {
    baseUrl: "https://dev.trustid.life/api",
    wsUrl: "wss://dev-identity.trustid.life/ws",
    sgtmProxyBaseUrl: "https://dev.trustid.life/server/api",
  },
  prod: {
    baseUrl: "https://portal-api.external.trustid.life/api",
    wsUrl: "wss://wss.trustid.life/ws",
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
