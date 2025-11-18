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
export { KeyManager } from "./modules/encryption";
export { Analytics } from "./modules/analytics";
export * from "./modules/analytics/types";
