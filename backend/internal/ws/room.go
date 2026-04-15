package ws

import (
	"encoding/json"
	"time"

	"github.com/abdu/ethio-guessr/backend/internal/models"
	"github.com/abdu/ethio-guessr/backend/internal/utils"
)

type RoomAction struct {
	Type     string
	PlayerID string
	Lat      float64
	Lng      float64
}

type GameRoom struct {
	ID           string
	Hub          *Hub
	Clients      map[*Client]bool
	Player1      *models.WSPlayerState
	Player2      *models.WSPlayerState
	SpotIDs      []models.Spot
	CurrentRound int
	MaxRounds    int
	TimeLimit    int

	Register   chan *Client
	Unregister chan *Client
	Action     chan *RoomAction
	State      string // "waiting", "countdown", "playing", "results", "finished"
}

func NewGameRoom(id string, spots []models.Spot, maxRounds int, timeLimit int, hub *Hub) *GameRoom {
	return &GameRoom{
		ID:           id,
		Hub:          hub,
		Clients:      make(map[*Client]bool),
		SpotIDs:      spots,
		CurrentRound: 1,
		MaxRounds:    maxRounds,
		TimeLimit:    timeLimit,
		Register:     make(chan *Client),
		Unregister:   make(chan *Client),
		Action:       make(chan *RoomAction, 10),
		State:        "waiting",
	}
}

func (r *GameRoom) broadcastMsg(msgType string, payload interface{}) {
	msg := models.WSMessage{
		Type:    msgType,
		Payload: payload,
	}
	b, _ := json.Marshal(msg)
	for client := range r.Clients {
		select {
		case client.Send <- b:
		default:
			close(client.Send)
			delete(r.Clients, client)
		}
	}
}

func (r *GameRoom) Run() {
	for {
		select {
		case client := <-r.Register:
			r.Clients[client] = true
			
			// Assign player slot
			if r.Player1 == nil {
				r.Player1 = &models.WSPlayerState{ID: client.PlayerID, Connected: true}
			} else if r.Player2 == nil && r.Player1.ID != client.PlayerID {
				r.Player2 = &models.WSPlayerState{ID: client.PlayerID, Connected: true}
			} else if r.Player1 != nil && r.Player1.ID == client.PlayerID {
                r.Player1.Connected = true
            } else if r.Player2 != nil && r.Player2.ID == client.PlayerID {
                r.Player2.Connected = true
            }

            // Tell the client who they are and state
            client.Send <- r.buildSyncMsg(client.PlayerID)

			// If both players are connected and waiting, start countdown
			if r.State == "waiting" && r.Player1 != nil && r.Player2 != nil && r.Player1.Connected && r.Player2.Connected {
				r.startCountdown()
			}

		case client := <-r.Unregister:
			if _, ok := r.Clients[client]; ok {
				delete(r.Clients, client)
				close(client.Send)
			}
            if r.Player1 != nil && r.Player1.ID == client.PlayerID {
                r.Player1.Connected = false
            }
            if r.Player2 != nil && r.Player2.ID == client.PlayerID {
                r.Player2.Connected = false
            }

		case action := <-r.Action:
            switch action.Type {
            case "start_round":
                r.State = "playing"
                // reset guesses
                if r.Player1 != nil {
                    r.Player1.HasGuessed = false
                }
                if r.Player2 != nil {
                    r.Player2.HasGuessed = false
                }
                r.broadcastMsg("round_start", map[string]interface{}{
                    "round": r.CurrentRound,
                    "spot": r.SpotIDs[r.CurrentRound-1],
                })
                // Start a timeout in a goroutine
                go func(round int, duration int) {
                    time.Sleep(time.Duration(duration) * time.Second)
                    r.Action <- &RoomAction{Type: "timeout", Lat: 0, Lng: 0}
                }(r.CurrentRound, r.TimeLimit)

            case "guess":
                if r.State != "playing" {
                     continue
                }
                var p *models.WSPlayerState
                if r.Player1 != nil && r.Player1.ID == action.PlayerID {
                    p = r.Player1
                } else if r.Player2 != nil && r.Player2.ID == action.PlayerID {
                    p = r.Player2
                }

                if p != nil && !p.HasGuessed {
                    p.HasGuessed = true
                    p.GuessedLat = action.Lat
                    p.GuessedLng = action.Lng
                    r.broadcastMsg("opponent_guessed", map[string]string{"player_id": p.ID})
                }

                // If both guessed, move to results
                if r.Player1 != nil && r.Player2 != nil && r.Player1.HasGuessed && r.Player2.HasGuessed {
                    r.evaluateRound()
                }

            case "timeout":
                if r.State == "playing" {
                    // Forfeit any player who didn't guess
                    if r.Player1 != nil && !r.Player1.HasGuessed {
                         r.Player1.HasGuessed = true
                         r.Player1.GuessedLat = 9.145
                         r.Player1.GuessedLng = 40.489
                    }
                    if r.Player2 != nil && !r.Player2.HasGuessed {
                         r.Player2.HasGuessed = true
                         r.Player2.GuessedLat = 9.145
                         r.Player2.GuessedLng = 40.489
                    }
                    r.evaluateRound()
                }

            case "next_round_countdown":
                r.broadcastMsg("countdown", map[string]int{"seconds": 5})
                go func() {
                    time.Sleep(5 * time.Second)
                    r.Action <- &RoomAction{Type: "start_round"}
                }()
            }
		}
	}
}

func (r *GameRoom) buildSyncMsg(playerID string) []byte {
    msg := models.WSMessage{
        Type: "sync",
        Payload: map[string]interface{}{
            "state": r.State,
            "round": r.CurrentRound,
            "max": r.MaxRounds,
            "time_limit": r.TimeLimit,
            "p1": r.Player1,
            "p2": r.Player2,
            "your_id": playerID,
        },
    }
    b, _ := json.Marshal(msg)
    return b
}

func (r *GameRoom) startCountdown() {
	r.State = "countdown"
	go func() {
		for i := 5; i > 0; i-- {
			r.broadcastMsg("countdown", map[string]int{"seconds": i})
			time.Sleep(1 * time.Second)
		}
		r.Action <- &RoomAction{Type: "start_round"}
	}()
}

func (r *GameRoom) evaluateRound() {
    r.State = "results"
    
    currSpot := r.SpotIDs[r.CurrentRound-1]
    
    // Evaluate Player 1
    p1Dist := utils.Haversine(currSpot.Lat, currSpot.Lng, r.Player1.GuessedLat, r.Player1.GuessedLng)
    p1Score := utils.CalculateScore(p1Dist)
    r.Player1.Score += p1Score

    // Evaluate Player 2
    p2Dist := utils.Haversine(currSpot.Lat, currSpot.Lng, r.Player2.GuessedLat, r.Player2.GuessedLng)
    p2Score := utils.CalculateScore(p2Dist)
    r.Player2.Score += p2Score
    
    isGameOver := r.CurrentRound >= r.MaxRounds
    
    var winnerID *string
    if isGameOver {
        r.State = "finished"
        if r.Player1.Score > r.Player2.Score {
             winnerID = &r.Player1.ID
        } else if r.Player2.Score > r.Player1.Score {
             winnerID = &r.Player2.ID
        }
    } else {
        r.CurrentRound++
    }
    
    var nextSpot *models.Spot
    if !isGameOver {
        nextSpot = &r.SpotIDs[r.CurrentRound-1]
    }
    
    result := models.MultiplayerResult{
        Player1: *r.Player1,
        Player2: *r.Player2,
        ActualLat: currSpot.Lat,
        ActualLng: currSpot.Lng,
        P1Distance: p1Dist,
        P2Distance: p2Dist,
        P1RoundScore: p1Score,
        P2RoundScore: p2Score,
        NextSpot: nextSpot,
        IsGameOver: isGameOver,
        WinnerID: winnerID,
    }
    
    r.broadcastMsg("round_result", result)

    if !isGameOver {
         go func() {
             for i := 5; i > 0; i-- {
                 r.broadcastMsg("countdown", map[string]int{"seconds": i})
                 time.Sleep(1 * time.Second)
             }
             r.Action <- &RoomAction{Type: "start_round"}
         }()
    }
}
