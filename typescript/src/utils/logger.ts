/**
 * Logger interface for SDK logging
 */
export interface Logger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}

/**
 * Console-based logger implementation
 * Logs to console with appropriate log levels
 */
export class ConsoleLogger implements Logger {
  private enabled: boolean;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  debug(message: string, meta?: any): void {
    if (this.enabled && process.env.NODE_ENV !== 'production') {
      console.debug(`[DCID SDK] ${message}`, meta || '');
    }
  }

  info(message: string, meta?: any): void {
    if (this.enabled) {
      console.info(`[DCID SDK] ${message}`, meta || '');
    }
  }

  warn(message: string, meta?: any): void {
    if (this.enabled) {
      console.warn(`[DCID SDK] ${message}`, meta || '');
    }
  }

  error(message: string, meta?: any): void {
    if (this.enabled) {
      console.error(`[DCID SDK] ${message}`, meta || '');
    }
  }
}

/**
 * No-op logger implementation (disabled logging)
 */
export class NoOpLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

