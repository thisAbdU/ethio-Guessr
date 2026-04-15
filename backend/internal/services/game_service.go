package services

import (
	"errors"
	"time"

	"github.com/abdu/ethio-guessr/backend/internal/models"
	"github.com/abdu/ethio-guessr/backend/internal/repository"
	"github.com/abdu/ethio-guessr/backend/internal/utils"
	"github.com/google/uuid"
)

type GameService struct {
	spotRepo    repository.SpotRepository
	sessionRepo repository.SessionRepository
}

func NewGameService(spotRepo repository.SpotRepository, sessionRepo repository.SessionRepository) *GameService {
	return &GameService{
		spotRepo:    spotRepo,
		sessionRepo: sessionRepo,
	}
}

func (s *GameService) StartGame() (*models.GameSession, *models.Spot, error) {
	spots, err := s.spotRepo.GetRandomSpots(5)
	if err != nil {
		return nil, nil, err
	}

	spotIDs := make([]string, len(spots))
	for i, spot := range spots {
		spotIDs[i] = spot.ID
	}

	session := &models.GameSession{
		ID:           uuid.New().String(),
		CurrentRound: 1,
		TotalScore:   0,
		SpotIDs:      spotIDs,
		StartTime:    time.Now(),
	}

	if err := s.sessionRepo.CreateSession(session); err != nil {
		return nil, nil, err
	}

	return session, &spots[0], nil
}

func (s *GameService) SubmitGuess(req models.GuessRequest) (*models.GuessResult, *models.Spot, error) {
	session, err := s.sessionRepo.GetSession(req.SessionID)
	if err != nil {
		return nil, nil, err
	}

	if session.CurrentRound > 5 {
		return nil, nil, errors.New("game already finished")
	}

	// Get current spot
	allSpots, err := s.spotRepo.GetAllSpots()
	if err != nil {
		return nil, nil, err
	}

	currentSpotID := session.SpotIDs[session.CurrentRound-1]
	var currentSpot models.Spot
	for _, spot := range allSpots {
		if spot.ID == currentSpotID {
			currentSpot = spot
			break
		}
	}

	distance := utils.Haversine(currentSpot.Lat, currentSpot.Lng, req.GuessedLat, req.GuessedLng)
	score := utils.CalculateScore(distance)

	session.TotalScore += score
	session.CurrentRound++

	var nextSpot *models.Spot
	isGameOver := session.CurrentRound > 5

	if !isGameOver {
		nextSpotID := session.SpotIDs[session.CurrentRound-1]
		for _, spot := range allSpots {
			if spot.ID == nextSpotID {
				nextSpot = &spot
				break
			}
		}
	}

	if err := s.sessionRepo.UpdateSession(session); err != nil {
		return nil, nil, err
	}

	result := &models.GuessResult{
		ActualLat:  currentSpot.Lat,
		ActualLng:  currentSpot.Lng,
		GuessedLat: req.GuessedLat,
		GuessedLng: req.GuessedLng,
		Distance:   distance,
		Score:      score,
		Round:      session.CurrentRound - 1,
		IsGameOver: isGameOver,
	}

	return result, nextSpot, nil
}
