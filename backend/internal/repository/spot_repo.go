package repository

import (
	"encoding/json"
	"errors"
	"math/rand"
	"os"
	"sync"
	"time"

	"github.com/abdu/ethio-guessr/backend/internal/models"
)

type SpotRepository interface {
	GetRandomSpots(count int) ([]models.Spot, error)
	AddSpots(spots []models.Spot) error
	GetAllSpots() ([]models.Spot, error)
}

type JSONSpotRepository struct {
	filePath string
	mu       sync.RWMutex
}

func NewJSONSpotRepository(filePath string) *JSONSpotRepository {
	return &JSONSpotRepository{filePath: filePath}
}

func (r *JSONSpotRepository) loadSpots() ([]models.Spot, error) {
	if _, err := os.Stat(r.filePath); os.IsNotExist(err) {
		return []models.Spot{}, nil
	}

	data, err := os.ReadFile(r.filePath)
	if err != nil {
		return nil, err
	}

	var spots []models.Spot
	if err := json.Unmarshal(data, &spots); err != nil {
		return nil, err
	}

	return spots, nil
}

func (r *JSONSpotRepository) saveSpots(spots []models.Spot) error {
	data, err := json.MarshalIndent(spots, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(r.filePath, data, 0644)
}

func (r *JSONSpotRepository) GetRandomSpots(count int) ([]models.Spot, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	allSpots, err := r.loadSpots()
	if err != nil {
		return nil, err
	}

	if len(allSpots) < count {
		return nil, errors.New("not enough spots in the pool")
	}

	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(allSpots), func(i, j int) {
		allSpots[i], allSpots[j] = allSpots[j], allSpots[i]
	})

	return allSpots[:count], nil
}

func (r *JSONSpotRepository) AddSpots(newSpots []models.Spot) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	allSpots, err := r.loadSpots()
	if err != nil {
		return err
	}

	// Simple duplicate check by ImageID
	existingIDs := make(map[string]bool)
	for _, s := range allSpots {
		existingIDs[s.ImageID] = true
	}

	for _, s := range newSpots {
		if !existingIDs[s.ImageID] {
			allSpots = append(allSpots, s)
			existingIDs[s.ImageID] = true
		}
	}

	return r.saveSpots(allSpots)
}

func (r *JSONSpotRepository) GetAllSpots() ([]models.Spot, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.loadSpots()
}
