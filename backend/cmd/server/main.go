package main

import (
	"context"
	"log"
	"net/http"

	"thiagoxchange/backend/internal/config"
	"thiagoxchange/backend/internal/features/auth"
	"thiagoxchange/backend/internal/features/rates"
	"thiagoxchange/backend/internal/features/trades"
	"thiagoxchange/backend/internal/platform/database"
	"thiagoxchange/backend/internal/platform/httpx"
	"thiagoxchange/backend/internal/platform/mailer"
)

func main() {
	cfg := config.Load()

	db, disconnect, err := database.Connect(cfg)
	if err != nil {
		log.Fatal(err)
	}
	defer func() {
		if err := disconnect(context.Background()); err != nil {
			log.Printf("mongo disconnect error: %v", err)
		}
	}()

	authRepo := auth.NewRepository(db)
	rateRepo := rates.NewRepository(db)
	tradeRepo := trades.NewRepository(db)
	tradeHub := trades.NewHub()
	mailer := mailer.New(cfg)

	if err := authRepo.EnsureIndexes(context.Background()); err != nil {
		log.Fatal(err)
	}
	if err := rateRepo.SeedDefaults(context.Background()); err != nil {
		log.Fatal(err)
	}

	authHandler := auth.NewHandler(auth.NewService(cfg, authRepo, mailer))
	rateHandler := rates.NewHandler(rateRepo)
	tradeHandler := trades.NewHandler(trades.NewService(tradeRepo, rateRepo, mailer), tradeHub, authRepo, cfg.JWTSecret)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		httpx.JSON(w, http.StatusOK, map[string]string{
			"app":      cfg.AppName,
			"message":  "API is running. Open the web app at http://localhost:3000",
			"frontend": cfg.FrontendURL,
		})
	})
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		httpx.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("POST /api/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/auth/login", authHandler.Login)
	mux.HandleFunc("GET /api/auth/me", auth.Middleware(cfg.JWTSecret, authRepo, authHandler.Me))
	mux.HandleFunc("GET /api/rates", rateHandler.List)
	mux.HandleFunc("POST /api/trades", auth.Middleware(cfg.JWTSecret, authRepo, tradeHandler.Create))
	mux.HandleFunc("GET /api/trades", auth.Middleware(cfg.JWTSecret, authRepo, tradeHandler.List))
	mux.HandleFunc("GET /api/trades/{id}", auth.Middleware(cfg.JWTSecret, authRepo, tradeHandler.Get))
	mux.HandleFunc("PATCH /api/trades/{id}/hash", auth.Middleware(cfg.JWTSecret, authRepo, tradeHandler.AddHash))
	mux.HandleFunc("POST /api/trades/{id}/messages", auth.Middleware(cfg.JWTSecret, authRepo, tradeHandler.AddMessage))
	mux.HandleFunc("PATCH /api/trades/{id}/cancel", auth.Middleware(cfg.JWTSecret, authRepo, tradeHandler.Cancel))
	mux.HandleFunc("GET /api/trades/{id}/ws", tradeHandler.WebSocket)
	mux.HandleFunc("PUT /api/admin/rates/{id}", auth.Admin(cfg.JWTSecret, authRepo, rateHandler.Update))
	mux.HandleFunc("GET /api/admin/trades", auth.Admin(cfg.JWTSecret, authRepo, tradeHandler.AdminList))
	mux.HandleFunc("PATCH /api/admin/trades/{id}/status", auth.Admin(cfg.JWTSecret, authRepo, tradeHandler.SetStatus))

	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: httpx.CORS(mux),
	}

	log.Printf("%s API listening on :%s", cfg.AppName, cfg.Port)
	log.Fatal(server.ListenAndServe())
}
