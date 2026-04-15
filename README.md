# EthioGuessr

A GeoGuessr-style Ethiopia-only location guessing game.

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, Zustand, Framer Motion, MapillaryJS, Leaflet.
- **Backend**: Go, Gin, JSON (for spot storage).

## Setup

### Backend

1. Navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Copy `.env.example` to `.env` and add your Mapillary Access Token:
   ```bash
   cp .env.example .env
   ```
3. Run the API server:
   ```bash
   go run cmd/api/main.go
   ```
4. (Optional) Sync more spots from Mapillary:
   ```bash
   go run cmd/sync-spots/main.go
   ```

### Frontend

1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Gameplay

- Explore the Ethiopian street view using Mapillary.
- Guess the location on the map of Ethiopia.
- Submit your guess within the time limit.
- Play 5 rounds and see your total score!
