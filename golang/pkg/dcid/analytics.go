package dcid

import (
	"time"

	httpclient "github.com/gettrustid/dcid-backend-sdk/golang/internal/http"
)

// AnalyticsClient provides analytics tracking methods
type AnalyticsClient struct {
	client     *Client
	httpClient *httpclient.Client
}

// StartSession creates a new session and returns session_id and anonymous_id
//
// This is a special event that creates a session first, then forwards to SGTM.
//
// Example:
//
//	result, err := client.Analytics.StartSession(&StartSessionOptions{
//		UserID:      stringPtr("user123"),
//		AnonymousID: stringPtr("anon-123"),
//		PageLocation: stringPtr("https://example.com/page"),
//	})
func (a *AnalyticsClient) StartSession(options *StartSessionOptions) (*StartSessionResponse, error) {
	// Build request body with event fields
	requestBody := map[string]interface{}{
		"event":      "start_session",
		"event_name": "start_session",
	}
	if options != nil {
		if options.UserID != nil {
			requestBody["user_id"] = *options.UserID
		}
		if options.AnonymousID != nil {
			requestBody["anonymous_id"] = *options.AnonymousID
		}
		if options.PageLocation != nil {
			requestBody["page_location"] = *options.PageLocation
		}
		if options.PageTitle != nil {
			requestBody["page_title"] = *options.PageTitle
		}
		if options.Timestamp != nil {
			requestBody["timestamp"] = *options.Timestamp
		}
		if options.EngagementTimeMsec != nil {
			requestBody["engagement_time_msec"] = *options.EngagementTimeMsec
		}
		if options.DeviceType != nil {
			requestBody["device_type"] = *options.DeviceType
		}
	}

	var result StartSessionResponse
	err := a.httpClient.PostWithService("/analytics/sgtm", requestBody, &result, "analytics:start_session")
	if err != nil {
		return nil, a.convertError(err)
	}
	return &result, nil
}

// convertError converts HTTP errors to SDK errors HTTP errors to SDK errors
func (a *AnalyticsClient) convertError(err error) error {
	httpErr, ok := err.(*httpclient.HTTPError)
	if !ok {
		return &NetworkError{
			SDKError: SDKError{
				Message: err.Error(),
			},
		}
	}

	context := &ErrorContext{
		URL:        httpErr.URL,
		Method:     httpErr.Method,
		StatusCode: httpErr.StatusCode,
		Timestamp:  time.Now(),
	}

	if httpErr.StatusCode == 401 {
		return &AuthenticationError{
			SDKError: SDKError{
				Message:    httpErr.Message,
				StatusCode: httpErr.StatusCode,
				Context:    context,
			},
			IsAPIKeyError: false,
		}
	}

	if httpErr.StatusCode >= 500 {
		return &ServerError{
			SDKError: SDKError{
				Message:    httpErr.Message,
				StatusCode: httpErr.StatusCode,
				Context:    context,
			},
		}
	}

	return &SDKError{
		Message:    httpErr.Message,
		StatusCode: httpErr.StatusCode,
		Context:    context,
	}
}

// StartSessionOptions are options for starting a session
type StartSessionOptions struct {
	UserID            *string `json:"user_id,omitempty"`
	AnonymousID       *string `json:"anonymous_id,omitempty"`
	PageLocation      *string `json:"page_location,omitempty"`
	PageTitle         *string `json:"page_title,omitempty"`
	Timestamp         *int64  `json:"timestamp,omitempty"`
	EngagementTimeMsec *int    `json:"engagement_time_msec,omitempty"`
	DeviceType        *string `json:"device_type,omitempty"`
}

// StartSessionResponse is the response from starting a session
type StartSessionResponse struct {
	Success     bool   `json:"success"`
	SessionID   string `json:"session_id"`
	Timestamp   string `json:"timestamp,omitempty"`
	AnonymousID string `json:"anonymous_id"`
	Linked      bool   `json:"linked"`
}

// EndSessionOptions are options for ending a session
type EndSessionOptions struct {
	SessionID   string  `json:"session_id"`
	UserID      *string `json:"user_id,omitempty"`
	AnonymousID *string `json:"anonymous_id,omitempty"`
	EndedAt     *string `json:"ended_at,omitempty"`
}

// EndSessionResponse is the response from ending a session
type EndSessionResponse struct {
	Success   bool   `json:"success"`
	Timestamp string `json:"timestamp,omitempty"`
}

// EndSession ends a session
//
// This method covers the endpoint: POST /analytics/end-session
//
// Example:
//
//	result, err := client.Analytics.EndSession(&EndSessionOptions{
//		SessionID: "session-123",
//	})
func (a *AnalyticsClient) EndSession(options *EndSessionOptions) (*EndSessionResponse, error) {
	if options == nil || options.SessionID == "" {
		return nil, &SDKError{Message: "session_id is required"}
	}

	requestBody := map[string]interface{}{
		"event":      "end_session",
		"event_name": "end_session",
		"session_id": options.SessionID,
	}
	if options.UserID != nil {
		requestBody["user_id"] = *options.UserID
	}
	if options.AnonymousID != nil {
		requestBody["anonymous_id"] = *options.AnonymousID
	}
	if options.EndedAt != nil {
		requestBody["ended_at"] = *options.EndedAt
	}

	var result EndSessionResponse
	err := a.httpClient.PostWithService("/analytics/sgtm", requestBody, &result, "analytics:end_session")
	if err != nil {
		return nil, a.convertError(err)
	}
	return &result, nil
}



