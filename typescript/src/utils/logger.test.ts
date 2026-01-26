import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConsoleLogger, NoOpLogger } from "./logger";

describe("ConsoleLogger", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  describe("when enabled", () => {
    const logger = new ConsoleLogger(true);

    it("should log info messages", () => {
      logger.info("test message");
      expect(console.info).toHaveBeenCalledWith("[DCID SDK] test message", "");
    });

    it("should log info with meta", () => {
      const meta = { key: "value" };
      logger.info("test", meta);
      expect(console.info).toHaveBeenCalledWith("[DCID SDK] test", meta);
    });

    it("should log warn messages", () => {
      logger.warn("warning");
      expect(console.warn).toHaveBeenCalledWith("[DCID SDK] warning", "");
    });

    it("should log error messages", () => {
      logger.error("error");
      expect(console.error).toHaveBeenCalledWith("[DCID SDK] error", "");
    });

    it("should log debug messages when NODE_ENV is not production", () => {
      process.env.NODE_ENV = "development";
      logger.debug("debug msg");
      expect(console.debug).toHaveBeenCalledWith("[DCID SDK] debug msg", "");
    });

    it("should NOT log debug messages when NODE_ENV is production", () => {
      process.env.NODE_ENV = "production";
      logger.debug("debug msg");
      expect(console.debug).not.toHaveBeenCalled();
    });
  });

  describe("when disabled", () => {
    const logger = new ConsoleLogger(false);

    it("should not log info messages", () => {
      logger.info("test");
      expect(console.info).not.toHaveBeenCalled();
    });

    it("should not log warn messages", () => {
      logger.warn("test");
      expect(console.warn).not.toHaveBeenCalled();
    });

    it("should not log error messages", () => {
      logger.error("test");
      expect(console.error).not.toHaveBeenCalled();
    });

    it("should not log debug messages", () => {
      logger.debug("test");
      expect(console.debug).not.toHaveBeenCalled();
    });
  });

  describe("default constructor", () => {
    it("should default to enabled", () => {
      const logger = new ConsoleLogger();
      logger.info("test");
      expect(console.info).toHaveBeenCalled();
    });
  });
});

describe("NoOpLogger", () => {
  const logger = new NoOpLogger();

  it("should not throw on debug", () => {
    expect(() => logger.debug("test")).not.toThrow();
  });

  it("should not throw on info", () => {
    expect(() => logger.info("test")).not.toThrow();
  });

  it("should not throw on warn", () => {
    expect(() => logger.warn("test")).not.toThrow();
  });

  it("should not throw on error", () => {
    expect(() => logger.error("test")).not.toThrow();
  });

  it("should not log anything to console", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    logger.info("test");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
