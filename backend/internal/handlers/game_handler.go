package handlers

import (
	"log"
	"net/http"

	"github.com/abdu/ethio-guessr/backend/internal/models"
	"github.com/abdu/ethio-guessr/backend/internal/services"
	"github.com/abdu/ethio-guessr/backend/internal/ws"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for dev
	},
}

type GameHandler struct {
	gameService *services.GameService
	hub         *ws.Hub
}

func NewGameHandler(gameService *services.GameService, hub *ws.Hub) *GameHandler {
	return &GameHandler{gameService: gameService, hub: hub}
}

type CreateGameReq struct {
	Rounds    int `json:"rounds"`
	TimeLimit int `json:"time_limit"`
}

func (h *GameHandler) CreateMultiplayerGame(c *gin.Context) {
	var req CreateGameReq
	if err := c.ShouldBindJSON(&req); err != nil {
		req.Rounds = 5
		req.TimeLimit = 20
	}
	
	// Sanitize inputs and ensure we have valid values
	if req.Rounds <= 0 {
		req.Rounds = 5
	}
	if req.TimeLimit <= 0 {
		req.TimeLimit = 20
	}

	sessionID := uuid.New().String()
	
	spots, err := h.gameService.GetRandomSpots(req.Rounds)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	room := ws.NewGameRoom(sessionID, spots, req.Rounds, req.TimeLimit, h.hub)
	h.hub.RegisterRoom(room)

	c.JSON(http.StatusOK, gin.H{
		"session_id": sessionID,
	})
}

func (h *GameHandler) JoinGameWS(c *gin.Context) {
	sessionID := c.Query("session_id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session_id required"})
		return
	}

	room := h.hub.GetRoom(sessionID)
	if room == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Websocket upgrade error: %v", err)
		return
	}

	client := &ws.Client{
		Hub:      h.hub,
		Room:     room,
		PlayerID: uuid.New().String(),
		Conn:     conn,
		Send:     make(chan []byte, 256),
	}

	client.Room.Register <- client

	go client.WritePump()
	go client.ReadPump()
}

func (h *GameHandler) StartGame(c *gin.Context) {
	// Reverted to support standard REST single-player
	var req CreateGameReq
	if err := c.ShouldBindJSON(&req); err != nil {
		req.Rounds = 5
		req.TimeLimit = 20
	}
	
	if req.Rounds <= 0 {
		req.Rounds = 5
	}
	if req.TimeLimit <= 0 {
		req.TimeLimit = 20
	}

	session, firstSpot, err := h.gameService.StartGame(req.Rounds, req.TimeLimit)
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
