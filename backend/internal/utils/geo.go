package utils

import (
	"math"
)

const earthRadiusKm = 6371.0

// Haversine calculates the distance between two points on Earth in kilometers
func Haversine(lat1, lon1, lat2, lon2 float64) float64 {
	dLat := (lat2 - lat1) * math.Pi / 180.0
	dLon := (lon2 - lon1) * math.Pi / 180.0

	lat1Rad := lat1 * math.Pi / 180.0
	lat2Rad := lat2 * math.Pi / 180.0

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Sin(dLon/2)*math.Sin(dLon/2)*math.Cos(lat1Rad)*math.Cos(lat2Rad)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadiusKm * c
}

// CalculateScore calculates the score based on distance in kilometers
func CalculateScore(distanceKm float64) int {
	if distanceKm <= 1 {
		return 5000
	}
	if distanceKm <= 5 {
		return 4500
	}
	if distanceKm <= 20 {
		return 3500
	}
	if distanceKm <= 50 {
		return 2000
	}
	if distanceKm <= 100 {
		return 1000
	}

	score := 1000 - int((distanceKm-100)*5)
	if score < 0 {
		return 0
	}
	return score
}
