package services

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"

	"github.com/abdu/ethio-guessr/backend/internal/models"
	"github.com/abdu/ethio-guessr/backend/internal/repository"
	"github.com/google/uuid"
)

type MapillaryService struct {
	accessToken string
	spotRepo    repository.SpotRepository
}

func NewMapillaryService(accessToken string, spotRepo repository.SpotRepository) *MapillaryService {
	return &MapillaryService{
		accessToken: accessToken,
		spotRepo:    spotRepo,
	}
}

type MapillaryFeature struct {
	ID       string `json:"id"`
	Geometry struct {
		Coordinates []float64 `json:"coordinates"`
	} `json:"geometry"`
}

type MapillaryResponse struct {
	Data []MapillaryFeature `json:"data"`
}

func (s *MapillaryService) SyncSpots(city string, bbox []float64) error {
	if s.accessToken == "" {
		return fmt.Errorf("Mapillary access token is missing")
	}

	// Mapillary Graph API URL for images in a bounding box
	// bbox format: min_lon,min_lat,max_lon,max_lat
	url := fmt.Sprintf("https://graph.mapillary.com/images?access_token=%s&fields=id,geometry&bbox=%f,%f,%f,%f&limit=50",
		s.accessToken, bbox[0], bbox[1], bbox[2], bbox[3])

	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		return fmt.Errorf("Mapillary API error: %s", string(body))
	}

	var mResp MapillaryResponse
	if err := json.NewDecoder(resp.Body).Decode(&mResp); err != nil {
		return err
	}

	var newSpots []models.Spot
	for _, f := range mResp.Data {
		newSpots = append(newSpots, models.Spot{
			ID:         uuid.New().String(),
			ImageID:    f.ID,
			Lat:        f.Geometry.Coordinates[1],
			Lng:        f.Geometry.Coordinates[0],
			City:       city,
			Region:     "Ethiopia",
			Difficulty: "medium",
			CreatedAt:  time.Now(),
		})
	}

	return s.spotRepo.AddSpots(newSpots)
}
