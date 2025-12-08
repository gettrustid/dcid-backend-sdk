package main

import (
	"fmt"
	"log"

	"github.com/gettrustid/trustid-sdk/golang/pkg/trustid"
)

func main() {
	// Initialize the SDK
	client, err := trustid.NewClient(trustid.Config{
		Environment: trustid.EnvironmentDev,
		APIKey:      "your-api-key-here",
	})
	if err != nil {
		log.Fatal(err)
	}

	// Example 1: Register OTP
	fmt.Println("=== Example 1: Register OTP ===")
	result, err := client.Auth.RegisterOTP(trustid.RegisterOTPOptions{
		Email: stringPtr("user@example.com"),
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("OTP initiated: %+v\n", result)

	// Example 2: Confirm OTP
	fmt.Println("\n=== Example 2: Confirm OTP ===")
	tokens, err := client.Auth.ConfirmOTP(trustid.ConfirmOTPOptions{
		Email: stringPtr("user@example.com"),
		OTP:   "123456", // In dev, use the OTP from result
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Access Token: %s...\n", tokens.AccessToken[:20])
	fmt.Printf("Refresh Token: %s...\n", tokens.RefreshToken[:20])

	// Example 3: Refresh Token
	fmt.Println("\n=== Example 3: Refresh Token ===")
	newTokens, err := client.Auth.RefreshToken(trustid.RefreshTokenOptions{
		RefreshToken: tokens.RefreshToken,
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("New Access Token: %s...\n", newTokens.AccessToken[:20])
}

func stringPtr(s string) *string {
	return &s
}



