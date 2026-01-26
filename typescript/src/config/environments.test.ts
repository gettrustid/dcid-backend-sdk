import { describe, it, expect } from "vitest";
import { ENVIRONMENTS, getEnvironmentConfig } from "./environments";

describe("environments", () => {
  describe("ENVIRONMENTS", () => {
    it("should have dev configuration", () => {
      expect(ENVIRONMENTS.dev).toBeDefined();
      expect(ENVIRONMENTS.dev.baseUrl).toBe(
        "http://krakend.dev-external.trustid.life/api"
      );
    });

    it("should have prod configuration", () => {
      expect(ENVIRONMENTS.prod).toBeDefined();
      expect(ENVIRONMENTS.prod.baseUrl).toBe(
        "https://gateway.trustid.life/api"
      );
    });

    it("should use HTTPS for prod", () => {
      expect(ENVIRONMENTS.prod.baseUrl).toMatch(/^https:\/\//);
    });

    it("should use HTTP for dev", () => {
      expect(ENVIRONMENTS.dev.baseUrl).toMatch(/^http:\/\//);
    });
  });

  describe("getEnvironmentConfig", () => {
    it("should return dev config for 'dev'", () => {
      const config = getEnvironmentConfig("dev");
      expect(config).toEqual(ENVIRONMENTS.dev);
    });

    it("should return prod config for 'prod'", () => {
      const config = getEnvironmentConfig("prod");
      expect(config).toEqual(ENVIRONMENTS.prod);
    });

    it("should throw for invalid environment", () => {
      expect(() =>
        getEnvironmentConfig("staging" as any)
      ).toThrow("Invalid environment: staging. Must be 'dev' or 'prod'.");
    });

    it("should return an object with baseUrl property", () => {
      const config = getEnvironmentConfig("dev");
      expect(config).toHaveProperty("baseUrl");
      expect(typeof config.baseUrl).toBe("string");
    });
  });
});
