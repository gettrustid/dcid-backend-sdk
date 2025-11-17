/**
 * Analytics event types and payloads
 */

/**
 * Base analytics event payload
 */
export interface BaseAnalyticsEvent {
  /** Session ID (required for most events) */
  session_id?: string;
  /** User ID */
  user_id?: string;
  /** Anonymous ID (for unauthenticated users) */
  anonymous_id?: string;
  /** Page location/URL */
  page_location?: string;
  /** Additional event properties */
  [key: string]: any;
}

/**
 * Start session event payload
 */
export interface StartSessionEvent extends BaseAnalyticsEvent {}

/**
 * Start session response
 */
export interface StartSessionResponse {
  success: boolean;
  session_id: string;
  anonymous_id?: string;
  linked?: boolean;
  timestamp: string;
}

/**
 * Generic analytics event response
 */
export interface AnalyticsEventResponse {
  success: boolean;
  timestamp: string;
}



