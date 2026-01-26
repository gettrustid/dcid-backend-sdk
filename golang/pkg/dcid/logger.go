package dcid

import "fmt"

// Logger interface for SDK logging
type Logger interface {
	// Debug logs a debug message with optional fields
	Debug(msg string, fields map[string]interface{})
	// Info logs an info message with optional fields
	Info(msg string, fields map[string]interface{})
	// Error logs an error message with optional fields
	Error(msg string, fields map[string]interface{})
}

// NoOpLogger is a logger that does nothing (used in production)
type NoOpLogger struct{}

func (l *NoOpLogger) Debug(msg string, fields map[string]interface{}) {}
func (l *NoOpLogger) Info(msg string, fields map[string]interface{})  {}
func (l *NoOpLogger) Error(msg string, fields map[string]interface{}) {}

// ConsoleLogger is a simple console logger (used in development)
type ConsoleLogger struct {
	verbose bool
}

// NewConsoleLogger creates a new console logger
func NewConsoleLogger(verbose bool) *ConsoleLogger {
	return &ConsoleLogger{verbose: verbose}
}

func (l *ConsoleLogger) Debug(msg string, fields map[string]interface{}) {
	if l.verbose {
		l.log("DEBUG", msg, fields)
	}
}

func (l *ConsoleLogger) Info(msg string, fields map[string]interface{}) {
	l.log("INFO", msg, fields)
}

func (l *ConsoleLogger) Error(msg string, fields map[string]interface{}) {
	l.log("ERROR", msg, fields)
}

func (l *ConsoleLogger) log(level, msg string, fields map[string]interface{}) {
	// Simple console logging - can be enhanced with a proper logging library
	fmt.Printf("[%s] %s", level, msg)
	if len(fields) > 0 {
		fmt.Printf(" %+v", fields)
	}
	fmt.Println()
}

