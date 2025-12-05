/**
 * Basic usage examples for TrustID PortalAPI SDK
 *
 * This file demonstrates how to use the SDK for OTP authentication.
 */

import { TrustIdSDK, TrustIdSDKError } from "../src";

// Example 1: Basic OTP Registration and Confirmation
async function example1_BasicOTP() {
  console.log("=== Example 1: Basic OTP Flow ===\n");

  const sdk = new TrustIdSDK({
    environment: "dev", // or 'prod'
    apiKey: "your-api-key-here",
  });

  try {
    // Step 1: Initiate OTP
    console.log("1. Initiating OTP registration...");
    const initiateResult = await sdk.auth.registerOTP({
      email: "test@test.com",
    });
    console.log("   ✓ OTP initiated");
    if (initiateResult.otp) {
      console.log(`   ✓ Dev OTP: ${initiateResult.otp}`);
    }

    // Step 2: Confirm OTP (in real app, user enters this)
    console.log("\n2. Confirming OTP...");
    const tokens = await sdk.auth.confirmOTP({
      email: "test@test.com",
      otp: initiateResult.otp || "123456", // Use actual OTP in production
    });
    console.log("   ✓ OTP confirmed");
    console.log(
      `   ✓ Access Token: ${tokens.access_token.substring(0, 20)}...`
    );
    console.log(
      `   ✓ Refresh Token: ${tokens.refresh_token.substring(0, 20)}...`
    );

    // Step 3: Refresh token
    console.log("\n3. Refreshing token...");
    const newTokens = await sdk.auth.refreshToken({
      refreshToken: tokens.refresh_token,
    });
    console.log("   ✓ Token refreshed");
    console.log(
      `   ✓ New Access Token: ${newTokens.access_token.substring(0, 20)}...`
    );
  } catch (error) {
    if (error instanceof TrustIdSDKError) {
      console.error("   ✗ SDK Error:", error.message);
      console.error("   Status:", error.statusCode);
    } else {
      console.error("   ✗ Unexpected error:", error);
    }
  }
}

// Example 2: Phone-based OTP
async function example2_PhoneOTP() {
  console.log("\n\n=== Example 2: Phone-based OTP ===\n");

  const sdk = new TrustIdSDK({
    environment: "dev",
    apiKey: "your-api-key-here",
  });

  try {
    console.log("1. Initiating OTP with phone...");
    await sdk.auth.registerOTP({
      phone: "+1234567890",
    });
    console.log("   ✓ OTP sent to phone");

    console.log("\n2. Confirming OTP...");
    const tokens = await sdk.auth.confirmOTP({
      phone: "+1234567890",
      otp: "123456", // User enters this
    });
    console.log("   ✓ Authentication successful");
  } catch (error) {
    if (error instanceof TrustIdSDKError) {
      console.error("   ✗ Error:", error.message);
    } else {
      console.error("   ✗ Unexpected error:", error);
    }
  }
}

// Example 3: Admin Login (OTP Flow)
async function example3_AdminLogin() {
  console.log("\n\n=== Example 3: Admin Login (OTP Flow) ===\n");

  const sdk = new TrustIdSDK({
    environment: "dev",
    apiKey: "your-api-key-here",
  });

  try {
    // Step 1: Initiate admin OTP
    console.log("1. Initiating admin OTP...");
    const initiateResult = await sdk.auth.adminLogin({
      email: "test@test.com",
    });
    console.log("   ✓ Admin OTP initiated");
    if (initiateResult.otp) {
      console.log(`   ✓ Dev OTP: ${initiateResult.otp}`);
    }

    // Step 2: Confirm OTP
    console.log("\n2. Confirming admin OTP...");
    const tokens = await sdk.auth.confirmOTP({
      email: "test@test.com",
      otp: initiateResult.otp || "123456",
    });
    console.log("   ✓ Admin authentication successful");
    console.log(
      `   ✓ Access Token: ${tokens.access_token.substring(0, 20)}...`
    );
    console.log(
      `   ✓ Refresh Token: ${tokens.refresh_token.substring(0, 20)}...`
    );
  } catch (error) {
    if (error instanceof TrustIdSDKError) {
      console.error("   ✗ Error:", error.message);
      console.error("   Status:", error.statusCode);
    } else {
      console.error("   ✗ Unexpected error:", error);
    }
  }
}

// Example 4: Error Handling
async function example4_ErrorHandling() {
  console.log("\n\n=== Example 4: Error Handling ===\n");

  const sdk = new TrustIdSDK({
    environment: "dev",
    apiKey: "your-api-key-here",
  });

  try {
    // This will fail - invalid OTP
    await sdk.auth.confirmOTP({
      email: "test@test.com",
      otp: "000000", // Wrong OTP
    });
  } catch (error) {
    if (error instanceof TrustIdSDKError) {
      console.log("   ✓ Caught SDK error properly");
      console.log(`   Message: ${error.message}`);
      console.log(`   Status Code: ${error.statusCode}`);
      if (error.response) {
        console.log(`   Response:`, error.response);
      }
    } else {
      console.error("   ✗ Unexpected error type:", error);
    }
  }
}

// Run all examples
async function runExamples() {
  console.log("TrustID PortalAPI SDK - Usage Examples\n");
  console.log("=".repeat(50) + "\n");

  await example1_BasicOTP();
  await example2_PhoneOTP();
  await example3_AdminLogin();
  await example4_ErrorHandling();

  console.log("\n" + "=".repeat(50));
  console.log("\nExamples completed!");
}

// Uncomment to run:
// runExamples().catch(console.error);

export {
  example1_BasicOTP,
  example2_PhoneOTP,
  example3_AdminLogin,
  example4_ErrorHandling,
  runExamples,
};
