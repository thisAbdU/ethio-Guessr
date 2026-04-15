package models

import "time"

type Spot struct {
	ID        string    `json:"id" db:"id"`
	ImageID   string    `json:"image_id" db:"image_id"`
	Lat       float64   `json:"lat" db:"lat"`
	Lng       float64   `json:"lng" db:"lng"`
	City      string    `json:"city" db:"city"`
	Region    string    `json:"region" db:"region"`
	Difficulty string   `json:"difficulty" db:"difficulty"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type GameSession struct {
	ID           string   `json:"id"`
	CurrentRound int      `json:"current_round"`
	TotalScore   int      `json:"total_score"`
	SpotIDs      []string `json:"spot_ids"`
	StartTime    time.Time `json:"start_time"`
}

type GuessRequest struct {
	SessionID  string  `json:"session_id" binding:"required"`
	GuessedLat float64 `json:"guessed_lat"`
	GuessedLng float64 `json:"guessed_lng"`
}

type GuessResult struct {
	ActualLat  float64 `json:"actual_lat"`
	ActualLng  float64 `json:"actual_lng"`
	GuessedLat float64 `json:"guessed_lat"`
	GuessedLng float64 `json:"guessed_lng"`
	Distance   float64 `json:"distance"`
	Score      int     `json:"score"`
	Round      int     `json:"round"`
	IsGameOver bool    `json:"is_game_over"`
}
