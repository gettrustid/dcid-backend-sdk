package dcid

import "testing"

func TestNoOpLogger_NoPanic(t *testing.T) {
	l := &NoOpLogger{}
	l.Debug("msg", nil)
	l.Info("msg", map[string]interface{}{"key": "val"})
	l.Error("msg", nil)
}

func TestNewConsoleLogger_Verbose(t *testing.T) {
	l := NewConsoleLogger(true)
	if l == nil {
		t.Fatal("expected non-nil logger")
	}
	if !l.verbose {
		t.Error("expected verbose=true")
	}
}

func TestNewConsoleLogger_NonVerbose(t *testing.T) {
	l := NewConsoleLogger(false)
	if l == nil {
		t.Fatal("expected non-nil logger")
	}
	if l.verbose {
		t.Error("expected verbose=false")
	}
}

func TestConsoleLogger_VerboseDebugDoesNotPanic(t *testing.T) {
	l := NewConsoleLogger(true)
	l.Debug("debug msg", nil)
	l.Debug("debug with fields", map[string]interface{}{"k": "v"})
}

func TestConsoleLogger_NonVerboseDebugSuppressed(t *testing.T) {
	l := NewConsoleLogger(false)
	// Should not panic; Debug is a no-op when not verbose
	l.Debug("debug msg", nil)
}

func TestConsoleLogger_InfoAndError(t *testing.T) {
	l := NewConsoleLogger(false)
	l.Info("info msg", nil)
	l.Info("info with fields", map[string]interface{}{"k": "v"})
	l.Error("error msg", nil)
	l.Error("error with fields", map[string]interface{}{"k": "v"})
}

func TestConsoleLogger_ImplementsLogger(t *testing.T) {
	var _ Logger = NewConsoleLogger(false)
	var _ Logger = &NoOpLogger{}
}
