package main

import (
	"log"
	"os"

	"github.com/abdu/ethio-guessr/backend/internal/handlers"
	"github.com/abdu/ethio-guessr/backend/internal/repository"
	"github.com/abdu/ethio-guessr/backend/internal/services"
	"github.com/abdu/ethio-guessr/backend/internal/ws"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize repositories
	spotRepo := repository.NewJSONSpotRepository("data/spots.json")
	sessionRepo := repository.NewInMemorySessionRepository()

	// Initialize services
	gameService := services.NewGameService(spotRepo, sessionRepo)

	// Initialize Hub
	hub := ws.NewHub()

	// Initialize handlers
	gameHandler := handlers.NewGameHandler(gameService, hub)

	// Setup router
	r := gin.Default()

	// CORS configuration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Routes
	api := r.Group("/api")
	{
		game := api.Group("/game")
		{
			game.POST("/start", gameHandler.StartGame)
			game.POST("/guess", gameHandler.SubmitGuess)
			game.POST("/create_multiplayer", gameHandler.CreateMultiplayerGame)
			game.GET("/ws", gameHandler.JoinGameWS)
		}
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
