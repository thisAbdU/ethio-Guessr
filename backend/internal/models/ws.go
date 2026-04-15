package models

type WSMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

type WSIncomingMessage struct {
	Type string  `json:"type"`
	Lat  float64 `json:"lat,omitempty"`
	Lng  float64 `json:"lng,omitempty"`
}

type WSPlayerState struct {
	ID         string  `json:"id"`
	Connected  bool    `json:"connected"`
	HasGuessed bool    `json:"has_guessed"`
	Score      int     `json:"score"`
	GuessedLat float64 `json:"-"`
	GuessedLng float64 `json:"-"`
}

type MultiplayerResult struct {
	Player1      WSPlayerState `json:"player1"`
	Player2      WSPlayerState `json:"player2"`
	ActualLat    float64       `json:"actual_lat"`
	ActualLng    float64       `json:"actual_lng"`
	P1Distance   float64       `json:"p1_distance"`
	P2Distance   float64       `json:"p2_distance"`
	P1RoundScore int           `json:"p1_round_score"`
	P2RoundScore int           `json:"p2_round_score"`
	NextSpot     *Spot         `json:"next_spot,omitempty"`
	IsGameOver   bool          `json:"is_game_over"`
	WinnerID     *string       `json:"winner_id,omitempty"`
}
