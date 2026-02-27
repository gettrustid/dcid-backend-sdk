import { describe, it, expect, beforeEach } from "vitest";
import { Analytics } from "./analytics";
import { createMockAxios } from "../../__test-utils__/mock-axios";
import type { AxiosInstance } from "axios";

describe("Analytics", () => {
  let mockAxios: AxiosInstance;
  let analytics: Analytics;
  const baseUrl = "https://gateway.trustid.life/api";

  beforeEach(() => {
    mockAxios = createMockAxios();
    analytics = new Analytics(mockAxios, baseUrl);
  });

  describe("startSession", () => {
    it("should POST to {baseUrl}/analytics/sgtm with start_session event", async () => {
      const mockResponse = {
        success: true,
        session_id: "sess-abc",
        anonymous_id: "anon-123",
        linked: false,
        timestamp: "2025-01-01T00:00:00Z",
      };
      (mockAxios.post as any).mockResolvedValue({ data: mockResponse });

      const result = await analytics.startSession({
        user_id: "user-1",
        page_location: "https://example.com",
      });

      expect(mockAxios.post).toHaveBeenCalledWith(
        `${baseUrl}/analytics/sgtm`,
        {
          user_id: "user-1",
          page_location: "https://example.com",
          event: "start_session",
          event_name: "start_session",
        },
        { headers: { "X-TrustID-Service": "analytics:start_session" } }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should work without any params", async () => {
      (mockAxios.post as any).mockResolvedValue({
        data: {
          success: true,
          session_id: "sess-def",
          timestamp: "2025-01-01T00:00:00Z",
        },
      });

      await analytics.startSession();

      expect(mockAxios.post).toHaveBeenCalledWith(
        `${baseUrl}/analytics/sgtm`,
        {
          event: "start_session",
          event_name: "start_session",
        },
        { headers: { "X-TrustID-Service": "analytics:start_session" } }
      );
    });

    it("should merge custom params with event fields", async () => {
      (mockAxios.post as any).mockResolvedValue({
        data: { success: true, session_id: "s", timestamp: "t" },
      });

      await analytics.startSession({
        anonymous_id: "anon-1",
        page_location: "/home",
      });

      expect(mockAxios.post).toHaveBeenCalledWith(
        `${baseUrl}/analytics/sgtm`,
        expect.objectContaining({
          anonymous_id: "anon-1",
          page_location: "/home",
          event: "start_session",
          event_name: "start_session",
        }),
        { headers: { "X-TrustID-Service": "analytics:start_session" } }
      );
    });
  });

  describe("endSession", () => {
    it("should POST to {baseUrl}/analytics/sgtm with end_session event", async () => {
      const mockResponse = {
        success: true,
        timestamp: "2025-01-01T00:00:00Z",
      };
      (mockAxios.post as any).mockResolvedValue({ data: mockResponse });

      const result = await analytics.endSession({
        event: "end_session",
        session_id: "sess-abc",
      });

      expect(mockAxios.post).toHaveBeenCalledWith(
        `${baseUrl}/analytics/sgtm`,
        expect.objectContaining({
          session_id: "sess-abc",
          event: "end_session",
          event_name: "end_session",
        }),
        { headers: { "X-TrustID-Service": "analytics:end_session" } }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw if session_id is missing", async () => {
      await expect(
        analytics.endSession({ event: "end_session", session_id: "" } as any)
      ).rejects.toThrow("session_id is required for end_session event");
    });

    it("should include ended_at when provided", async () => {
      (mockAxios.post as any).mockResolvedValue({
        data: { success: true, timestamp: "t" },
      });

      await analytics.endSession({
        event: "end_session",
        session_id: "sess-1",
        ended_at: "2025-01-01T01:00:00Z",
      });

      expect(mockAxios.post).toHaveBeenCalledWith(
        `${baseUrl}/analytics/sgtm`,
        expect.objectContaining({
          ended_at: "2025-01-01T01:00:00Z",
        }),
        { headers: { "X-TrustID-Service": "analytics:end_session" } }
      );
    });
  });
});
