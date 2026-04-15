package main

import (
	"log"
	"os"

	"github.com/abdu/ethio-guessr/backend/internal/repository"
	"github.com/abdu/ethio-guessr/backend/internal/services"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	accessToken := os.Getenv("MAPILLARY_ACCESS_TOKEN")
	if accessToken == "" {
		log.Fatal("MAPILLARY_ACCESS_TOKEN environment variable is required")
	}

	repo := repository.NewJSONSpotRepository("data/spots.json")
	mapillarySvc := services.NewMapillaryService(accessToken, repo)

	// Each bbox: min_lon, min_lat, max_lon, max_lat
	// Area = (max_lon-min_lon) * (max_lat-min_lat) = 0.09 * 0.10 = 0.009 sq deg (under 0.010 limit)
	cities := map[string][]float64{
		// --- Existing (fixed) ---
		"Addis Ababa":  {38.740, 9.000, 38.830, 9.100},
		"Lalibela":     {38.970, 12.020, 39.060, 12.120},
		"Gondar":       {37.440, 12.580, 37.530, 12.680},
		"Bahir Dar":    {37.370, 11.570, 37.460, 11.670},
		"Dire Dawa":    {41.830, 9.570, 41.920, 9.670},
		"Hawassa":      {38.440, 7.030, 38.530, 7.130},
		"Adama":        {39.260, 8.530, 39.350, 8.630},

		// --- New cities ---
		"Mekelle":      {39.430, 13.447, 39.520, 13.547},
		"Axum":         {38.682, 14.070, 38.772, 14.170},
		"Debre Tabor":  {37.965, 11.800, 38.055, 11.900},
		"Woldiya":      {39.555, 11.783, 39.645, 11.883},
		"Dessie":       {39.588, 11.083, 39.678, 11.183},
		"Debre Markos": {37.672, 10.283, 37.762, 10.383},
		"Debre Berhan": {39.488, 9.633, 39.578, 9.733},
		"Jimma":        {36.788, 7.617, 36.878, 7.717},
		"Nekemte":      {36.505, 9.033, 36.595, 9.133},
		"Asella":       {39.088, 7.900, 39.178, 8.000},
		"Ziway":        {38.672, 7.883, 38.762, 7.983},
		"Shashemene":   {38.488, 7.150, 38.578, 7.250},
		"Dilla":        {38.265, 6.362, 38.355, 6.462},
		"Arba Minch":   {37.505, 5.983, 37.595, 6.083},
		"Sodo":         {37.705, 6.800, 37.795, 6.900},
		"Hosaena":      {37.813, 7.500, 37.903, 7.600},
		"Harar":        {42.073, 9.263, 42.163, 9.363},
		"Jijiga":       {42.755, 9.300, 42.845, 9.400},
		"Goba":         {39.938, 6.960, 40.028, 7.060},
		"Gambela":      {34.545, 8.200, 34.635, 8.300},
		"Assosa":       {34.488, 10.017, 34.578, 10.117},
	}

	for city, bbox := range cities {
		log.Printf("Syncing spots for %s...", city)
		if err := mapillarySvc.SyncSpots(city, bbox); err != nil {
			log.Printf("Error syncing %s: %v", city, err)
		} else {
			log.Printf("Successfully synced %s", city)
		}
	}

	log.Println("Sync completed!")
}
