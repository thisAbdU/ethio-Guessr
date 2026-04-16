package main

import (
	"log"
	"os"

	"github.com/abdu/ethio-guessr/backend/internal/repository"
	"github.com/abdu/ethio-guessr/backend/internal/services"
	"github.com/joho/godotenv"
	"time"
	"fmt"
)

func main() {
	_ = godotenv.Load()

	accessToken := os.Getenv("MAPILLARY_ACCESS_TOKEN")
	if accessToken == "" {
		log.Fatal("MAPILLARY_ACCESS_TOKEN environment variable is required")
	}

	repo := repository.NewJSONSpotRepository("data/spots.json")
	mapillarySvc := services.NewMapillaryService(accessToken, repo)

	type CityCoord struct {
		Name string
		Lat  float64
		Lon  float64
	}

	targets := []CityCoord{
		{"Addis_Ababa", 9.032, 38.745},
		{"Nazret_Adama", 8.541, 39.269},
		{"Bishoftu", 8.751, 38.978},
		{"Dire_Dawa", 9.593, 41.866},
		{"Harar", 9.313, 42.118},
		{"Jijiga", 9.351, 42.796},
		{"Bahir_Dar", 11.595, 37.391},
		{"Gondar", 12.607, 37.456},
		{"Mekelle", 13.496, 39.475},
		{"Axum", 14.120, 38.718},
		{"Lalibela", 12.031, 39.041},
		{"Hawassa", 7.062, 38.477},
		{"Arba_Minch", 6.021, 37.551},
		{"Jimma", 7.674, 36.834},
		{"Dessie", 11.131, 39.636},
		{"Sodo", 6.853, 37.755},
		{"Dilla", 6.411, 38.312},
		{"Shashamane", 7.202, 38.597},
		{"Gambela", 8.247, 34.591},
		{"Assosa", 10.063, 34.532},
		{"Semera_Logia", 11.791, 40.923},
		{"Gode", 5.952, 43.551},
	}

	for _, city := range targets {
		log.Printf("Starting Grid Sync for %s...", city.Name)
		// Try a 3x3 grid around the center to find green dots without timing out
		for dx := -1; dx <= 1; dx++ {
			for dy := -1; dy <= 1; dy++ {
				lon := city.Lon + float64(dx)*0.015
				lat := city.Lat + float64(dy)*0.015
				bbox := []float64{lon, lat, lon + 0.01, lat + 0.01}
				
				if err := mapillarySvc.SyncSpots(fmt.Sprintf("%s_%d_%d", city.Name, dx, dy), bbox); err != nil {
					// Ignore "no coverage" for sub-grids
					if err.Error() != "no coverage found in this area" {
						// log.Printf("      [SKIP] Grid %d,%d failed: %v", dx, dy, err)
					}
				}
				time.Sleep(1 * time.Second)
			}
		}
	}

	log.Println("Sync completed!")
}
