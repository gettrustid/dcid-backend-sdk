/**
 * TrustID PortalAPI SDK
 *
 * A TypeScript/JavaScript SDK for interacting with the TrustID PortalAPI.
 *
 * @packageDocumentation
 */

export { TrustIdSDK } from "./client";
export * from "./types";
export { AuthOTP } from "./modules/auth/otp";
export { KeyManager } from "./modules/identity/encryption";
export { Issuer } from "./modules/identity/issuer";
export { IPFS } from "./modules/identity/ipfs";
export { Analytics } from "./modules/analytics";
export * from "./modules/analytics/types";
export { ENVIRONMENTS, getEnvironmentConfig } from "./config/environments";
export type { EnvironmentConfig } from "./config/environments";
