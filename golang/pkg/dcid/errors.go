package trustid

import (
	"fmt"
	"time"
)

// ErrorContext provides context information for debugging
type ErrorContext struct {
	URL            string
	Method         string
	StatusCode     int
	StatusText     string
	ResponseHeaders map[string][]string
	RequestHeaders  map[string]string
	Timestamp      time.Time
	RequestID      string
	IsKrakendError bool
	ErrorSource    string // "krakend", "backend", or "network"
}

// SDKError is the base error type for all SDK errors
type SDKError struct {
	Message    string
	StatusCode int
	Response   interface{}
	Context    *ErrorContext
}

func (e *SDKError) Error() string {
	if e.StatusCode > 0 {
		return fmt.Sprintf("%s (status: %d)", e.Message, e.StatusCode)
	}
	return e.Message
}

// NetworkError represents network-related errors (connectivity issues, timeouts, etc.)
type NetworkError struct {
	SDKError
	Code string
}

func (e *NetworkError) Error() string {
	if e.Code != "" {
		return fmt.Sprintf("%s (code: %s)", e.SDKError.Error(), e.Code)
	}
	return e.SDKError.Error()
}

// AuthenticationError represents authentication errors (API-KEY or JWT token issues)
type AuthenticationError struct {
	SDKError
	IsAPIKeyError bool
}

func (e *AuthenticationError) Error() string {
	return e.SDKError.Error()
}

// ServerError represents server errors (backend or gateway errors)
type ServerError struct {
	SDKError
	IsBackendConnectivityError bool
}

func (e *ServerError) Error() string {
	return e.SDKError.Error()
}



