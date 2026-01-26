/**
 * Environment configuration for TrustID SDK
 *
 * Contains hard-coded URLs for different environments (dev, prod)
 */
export interface EnvironmentConfig {
  /** API base URL */
  baseUrl: string;
}

/**
 * Environment configurations
 */
export const ENVIRONMENTS: Record<"dev" | "prod", EnvironmentConfig> = {
  dev: {
    baseUrl: "http://krakend.dev-external.trustid.life/api",
  },
  prod: {
    baseUrl: "https://gateway.trustid.life/api",
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
