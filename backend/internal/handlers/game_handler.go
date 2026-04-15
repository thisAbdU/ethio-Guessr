package handlers

import (
	"log"
	"net/http"

	"github.com/abdu/ethio-guessr/backend/internal/models"
	"github.com/abdu/ethio-guessr/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type GameHandler struct {
	gameService *services.GameService
}

func NewGameHandler(gameService *services.GameService) *GameHandler {
	return &GameHandler{gameService: gameService}
}

func (h *GameHandler) StartGame(c *gin.Context) {
	session, firstSpot, err := h.gameService.StartGame()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"session_id": session.ID,
		"first_spot": firstSpot,
	})
}

func (h *GameHandler) SubmitGuess(c *gin.Context) {
	var req models.GuessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Error binding guess request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	log.Printf("Received guess: %+v", req)

	result, nextSpot, err := h.gameService.SubmitGuess(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"result":    result,
		"next_spot": nextSpot,
	})
}
