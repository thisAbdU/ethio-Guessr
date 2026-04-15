import { create } from 'zustand';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export interface Spot {
  id: string;
  image_id: string;
  lat: number;
  lng: number;
  city: string;
  region: string;
}

export interface GuessResult {
  actual_lat: number;
  actual_lng: number;
  guessed_lat: number;
  guessed_lng: number;
  distance: number;
  score: number;
  round: number;
  is_game_over: boolean;
}

interface GameState {
  sessionId: string | null;
  currentRound: number;
  totalScore: number;
  currentSpot: Spot | null;
  gameState: 'idle' | 'playing' | 'result' | 'finished';
  lastResult: GuessResult | null;
  isLoading: boolean;
  
  startGame: () => Promise<void>;
  submitGuess: (lat: number, lng: number) => Promise<void>;
  nextRound: (nextSpot: Spot | null) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  sessionId: null,
  currentRound: 0,
  totalScore: 0,
  currentSpot: null,
  gameState: 'idle',
  lastResult: null,
  isLoading: false,

  startGame: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_BASE_URL}/game/start`);
      set({
        sessionId: response.data.session_id,
        currentSpot: response.data.first_spot,
        currentRound: 1,
        totalScore: 0,
        gameState: 'playing',
        lastResult: null,
      });
    } catch (error) {
      console.error('Failed to start game:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  submitGuess: async (lat: number, lng: number) => {
    const { sessionId } = get();
    if (!sessionId) return;

    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_BASE_URL}/game/guess`, {
        session_id: sessionId,
        guessed_lat: lat,
        guessed_lng: lng,
      });

      const { result, next_spot } = response.data;
      set((state) => ({
        lastResult: result,
        totalScore: state.totalScore + result.score,
        gameState: 'result',
        // We don't update currentSpot yet, we wait for nextRound
      }));

      // Store next_spot in a temporary way or just pass it to nextRound
      // For simplicity, we'll handle nextRound call from the UI
    } catch (error) {
      console.error('Failed to submit guess:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  nextRound: (nextSpot: Spot | null) => {
    const { lastResult } = get();
    if (lastResult?.is_game_over) {
      set({ gameState: 'finished' });
    } else {
      set((state) => ({
        currentRound: state.currentRound + 1,
        currentSpot: nextSpot,
        gameState: 'playing',
        lastResult: null,
      }));
    }
  },

  resetGame: () => {
    set({
      sessionId: null,
      currentRound: 0,
      totalScore: 0,
      currentSpot: null,
      gameState: 'idle',
      lastResult: null,
    });
  },
}));
