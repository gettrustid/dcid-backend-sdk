import { AxiosInstance } from 'axios';
import {
  StartSessionEvent,
  StartSessionResponse,
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
    private sgtmProxyBaseUrl: string
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
      `${this.sgtmProxyBaseUrl}/sgtm`,
      {
        ...params,
        event: 'start_session',
        event_name: 'start_session',
      }
    );

    return response.data;
  }
}



