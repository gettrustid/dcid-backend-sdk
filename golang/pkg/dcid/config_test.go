package dcid

import (
	"os"
	"testing"
)

func TestGetEnvironmentConfig_Dev(t *testing.T) {
	os.Unsetenv("DCID_BASE_URL")
	cfg := getEnvironmentConfig(EnvironmentDev)
	if cfg.BaseURL != "http://krakend.dev-external.trustid.life/api" {
		t.Errorf("expected dev URL, got %s", cfg.BaseURL)
	}
}

func TestGetEnvironmentConfig_Prod(t *testing.T) {
	os.Unsetenv("DCID_BASE_URL")
	cfg := getEnvironmentConfig(EnvironmentProd)
	if cfg.BaseURL != "https://gateway.trustid.life/api" {
		t.Errorf("expected prod URL, got %s", cfg.BaseURL)
	}
}

func TestGetEnvironmentConfig_DefaultFallback(t *testing.T) {
	os.Unsetenv("DCID_BASE_URL")
	cfg := getEnvironmentConfig("unknown")
	if cfg.BaseURL != "http://krakend.dev-external.trustid.life/api" {
		t.Errorf("expected default (dev) URL, got %s", cfg.BaseURL)
	}
}

func TestGetEnvironmentConfig_EmptyStringFallback(t *testing.T) {
	os.Unsetenv("DCID_BASE_URL")
	cfg := getEnvironmentConfig("")
	if cfg.BaseURL != "http://krakend.dev-external.trustid.life/api" {
		t.Errorf("expected default (dev) URL, got %s", cfg.BaseURL)
	}
}

func TestGetEnvironmentConfig_EnvOverride(t *testing.T) {
	os.Setenv("DCID_BASE_URL", "http://custom:8080/api")
	defer os.Unsetenv("DCID_BASE_URL")

	for _, env := range []Environment{EnvironmentDev, EnvironmentProd, "unknown"} {
		cfg := getEnvironmentConfig(env)
		if cfg.BaseURL != "http://custom:8080/api" {
			t.Errorf("env=%s: expected override URL, got %s", env, cfg.BaseURL)
		}
	}
}

func TestEnvironmentConstants(t *testing.T) {
	if EnvironmentDev != "dev" {
		t.Errorf("expected dev, got %s", EnvironmentDev)
	}
	if EnvironmentProd != "prod" {
		t.Errorf("expected prod, got %s", EnvironmentProd)
	}
}
