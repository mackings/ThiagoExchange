package config

import (
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	AppName     string
	Port        string
	MongoURI    string
	MongoDB     string
	JWTSecret   string
	AdminEmails map[string]bool
	SMTPHost    string
	SMTPPort    string
	SMTPUser    string
	SMTPPass    string
	SMTPFrom    string
	FrontendURL string
	BackendURL  string
}

func Load() Config {
	_ = godotenv.Load()
	admins := map[string]bool{}
	for _, email := range strings.Split(os.Getenv("ADMIN_EMAILS"), ",") {
		email = strings.ToLower(strings.TrimSpace(email))
		if email != "" {
			admins[email] = true
		}
	}

	return Config{
		AppName:     env("APP_NAME", "Thiago Exchange"),
		Port:        env("PORT", "8080"),
		MongoURI:    env("MONGODB_URI", "mongodb://localhost:27017"),
		MongoDB:     env("MONGODB_DATABASE", "thiago_exchange"),
		JWTSecret:   env("JWT_SECRET", "dev-secret"),
		AdminEmails: admins,
		SMTPHost:    env("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:    env("SMTP_PORT", "587"),
		SMTPUser:    os.Getenv("SMTP_USER"),
		SMTPPass:    os.Getenv("SMTP_PASS"),
		SMTPFrom:    env("SMTP_FROM_NAME", "Thiago Exchange"),
		FrontendURL: env("FRONTEND_URL", "http://localhost:3000"),
		BackendURL:  env("BACKEND_URL", os.Getenv("RENDER_EXTERNAL_URL")),
	}
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
