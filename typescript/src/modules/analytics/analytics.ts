import { AxiosInstance } from 'axios';
import {
  StartSessionEvent,
  StartSessionResponse,
  EndSessionEvent,
  AnalyticsEventResponse,
} from './types';

/**
 * Analytics module for tracking user events
 * 
 * This module sends analytics events to the sgtm-proxy server,
 * which then forwards them to the analytics API and SGTM container.
 * 
 * All events are sent to the /sgtm endpoint of the sgtm-proxy server.
 */
export class Analytics {
  constructor(
    private httpClient: AxiosInstance,
    private baseUrl: string
  ) {}

  /**
   * Start session - Creates a new session and returns session_id and anonymous_id
   * 
   * This is a special event that creates a session first, then forwards to SGTM.
   * 
   * @param event - Start session event data
   * @returns Promise with session_id, anonymous_id, and linked status
   * 
   * @example
   * ```typescript
   * const result = await sdk.analytics.startSession({
   *   user_id: 'user123',
   *   anonymous_id: 'anon-123',
   *   page_location: 'https://example.com/page',
   * });
   * // result.session_id - use this for subsequent events
   * // result.anonymous_id - for unauthenticated users
   * ```
   */
  async startSession(params?: Partial<StartSessionEvent>): Promise<StartSessionResponse> {
    const response = await this.httpClient.post<StartSessionResponse>(
      `${this.baseUrl}/analytics/sgtm`,
      {
        ...params,
        event: 'start_session',
        event_name: 'start_session',
      },
      { headers: { 'X-TrustID-Service': 'analytics:start_session' } }
    );

    return response.data;
  }

  /**
   * End session - Marks a session as ended
   * 
   * @param event - End session event data
   * @returns Promise with success status
   */
  async endSession(event: EndSessionEvent): Promise<AnalyticsEventResponse> {
    if (!event.session_id) {
      throw new Error('session_id is required for end_session event');
    }

    const response = await this.httpClient.post<AnalyticsEventResponse>(
      `${this.baseUrl}/analytics/sgtm`,
      {
        ...event,
        event: 'end_session',
        event_name: 'end_session',
      },
      { headers: { 'X-TrustID-Service': 'analytics:end_session' } }
    );

    return response.data;
  }
}



