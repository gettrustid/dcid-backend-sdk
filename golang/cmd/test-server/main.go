package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gettrustid/dcid-server-sdk/golang/pkg/dcid"
)

type Server struct {
	sdk *dcid.Client
}

func main() {
	// Get configuration from environment variables
	apiKey := os.Getenv("DCID_API_KEY")
	if apiKey == "" {
		log.Fatal("DCID_API_KEY environment variable is required")
	}

	environment := os.Getenv("DCID_ENVIRONMENT")
	if environment == "" {
		environment = "dev"
	}

	env := dcid.EnvironmentDev
	if environment == "prod" {
		env = dcid.EnvironmentProd
	}

	// Initialize SDK
	sdk, err := dcid.NewClient(dcid.Config{
		Environment: env,
		APIKey:      apiKey,
		Timeout:     30 * time.Second,
		Logger:      dcid.NewConsoleLogger(true),
	})
	if err != nil {
		log.Fatalf("Failed to initialize SDK: %v", err)
	}

	server := &Server{sdk: sdk}

	// Setup routes
	http.HandleFunc("/health", server.healthHandler)
	http.HandleFunc("/api/auth/register-otp", server.registerOTPHandler)
	http.HandleFunc("/api/auth/confirm-otp", server.confirmOTPHandler)
	http.HandleFunc("/api/auth/admin-login", server.adminLoginHandler)
	http.HandleFunc("/api/auth/refresh-token", server.refreshTokenHandler)
	http.HandleFunc("/api/analytics/start-session", server.startSessionHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Printf("SDK Environment: %s", environment)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func (s *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
		"service": "dcid-server-sdk-test-server",
	})
}

func (s *Server) registerOTPHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req dcid.RegisterOTPOptions
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	result, err := s.sdk.Auth.RegisterOTP(req)
	if err != nil {
		s.handleError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (s *Server) confirmOTPHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req dcid.ConfirmOTPOptions
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	tokens, err := s.sdk.Auth.ConfirmOTP(req)
	if err != nil {
		s.handleError(w, err)
		return
	}

	// Tokens are automatically set in SDK context
	s.sdk.SetTokens(*tokens)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tokens)
}

func (s *Server) adminLoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req dcid.RegisterOTPOptions
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	result, err := s.sdk.Auth.AdminLogin(req)
	if err != nil {
		s.handleError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (s *Server) refreshTokenHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req dcid.RefreshTokenOptions
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	tokens, err := s.sdk.Auth.RefreshToken(req)
	if err != nil {
		s.handleError(w, err)
		return
	}

	s.sdk.SetTokens(*tokens)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tokens)
}

func (s *Server) startSessionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req dcid.StartSessionOptions
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	result, err := s.sdk.Analytics.StartSession(&req)
	if err != nil {
		s.handleError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (s *Server) handleError(w http.ResponseWriter, err error) {
	w.Header().Set("Content-Type", "application/json")

	switch e := err.(type) {
	case *dcid.AuthenticationError:
		w.WriteHeader(e.StatusCode)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": e.Error(),
			"type":  "AuthenticationError",
			"isAPIKeyError": e.IsAPIKeyError,
		})
	case *dcid.NetworkError:
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": e.Error(),
			"type":  "NetworkError",
			"code":  e.Code,
		})
	case *dcid.ServerError:
		w.WriteHeader(e.StatusCode)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": e.Error(),
			"type":  "ServerError",
		})
	case *dcid.SDKError:
		w.WriteHeader(e.StatusCode)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": e.Error(),
			"type":  "SDKError",
		})
	default:
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": err.Error(),
			"type":  "UnknownError",
		})
	}
}



