import { vi } from "vitest";
import type { AxiosInstance } from "axios";

/**
 * Creates a mock AxiosInstance with all HTTP methods stubbed.
 */
export function createMockAxios(): AxiosInstance {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    head: vi.fn(),
    options: vi.fn(),
    request: vi.fn(),
    getUri: vi.fn(),
    defaults: { headers: { common: {} } } as any,
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
    },
  } as unknown as AxiosInstance;
}
