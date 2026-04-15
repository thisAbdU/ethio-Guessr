import { create } from 'zustand';
import axios from 'axios';

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const API_BASE_URL = `${NEXT_PUBLIC_API_URL}/api`;

const getWsBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  if (typeof window !== 'undefined') {
    return window.location.protocol === 'https:'
      ? `wss://${NEXT_PUBLIC_API_URL.replace(/^https?:\/\//, '')}/api`
      : `ws://localhost:8080/api`;
  }
  return `ws://localhost:8080/api`;
};

const WS_BASE_URL = getWsBaseUrl();

export interface Spot {
  id: string;
  image_id: string;
  lat: number;
  lng: number;
  city: string;
  region: string;
}

export interface WSPlayerState {
  id: string;
  connected: boolean;
  has_guessed: boolean;
  score: number;
}

export interface MultiplayerResult {
  player1: WSPlayerState;
  player2: WSPlayerState;
  actual_lat: number;
  actual_lng: number;
  p1_distance: number;
  p2_distance: number;
  p1_round_score: number;
  p2_round_score: number;
  next_spot?: Spot;
  is_game_over: boolean;
  winner_id?: string;
}

// REST single player result
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
  playerId: string | null;
  currentRound: number;
  maxRounds: number;
  timeLimit: number;
  totalScore: number;
  currentSpot: Spot | null;
  gameState: 'idle' | 'waiting' | 'countdown' | 'playing' | 'result' | 'finished';
  lastResult: MultiplayerResult | GuessResult | null;
  countdown: number;
  opponentGuessed: boolean;
  isLoading: boolean;
  ws: WebSocket | null;
  isMultiplayer: boolean;
  
  createMultiplayerGame: (rounds: number, timeLimit: number) => Promise<string | null>;
  startSinglePlayerGame: (rounds: number, timeLimit: number) => Promise<void>;
  joinGame: (sessionId: string) => void;
  submitGuess: (lat: number, lng: number) => void;
  nextRoundSinglePlayer: (nextSpot: Spot | undefined) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  sessionId: null,
  playerId: null,
  currentRound: 0,
  maxRounds: 5,
  timeLimit: 20,
  totalScore: 0,
  currentSpot: null,
  gameState: 'idle',
  lastResult: null,
  countdown: 0,
  opponentGuessed: false,
  isLoading: false,
  ws: null,
  isMultiplayer: false,

  startSinglePlayerGame: async (rounds: number, timeLimit: number) => {
    set({ isLoading: true, maxRounds: rounds, timeLimit, isMultiplayer: false });
    try {
      const response = await axios.post(`${API_BASE_URL}/game/start`, { rounds, time_limit: timeLimit });
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

  createMultiplayerGame: async (rounds: number, timeLimit: number) => {
    set({ isLoading: true, maxRounds: rounds, timeLimit, isMultiplayer: true });
    try {
      const response = await axios.post(`${API_BASE_URL}/game/create_multiplayer`, { rounds, time_limit: timeLimit });
      set({ isLoading: false });
      return response.data.session_id;
    } catch (error) {
      console.error('Failed to create multi game:', error);
      set({ isLoading: false });
      return null;
    }
  },

  joinGame: (sessionId: string) => {
    set({ sessionId, isLoading: true, isMultiplayer: true });
    const ws = new WebSocket(`${WS_BASE_URL}/game/ws?session_id=${sessionId}`);
    
    ws.onopen = () => {
      set({ ws, isLoading: false, gameState: 'waiting' });
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (!msg.type) return;

      if (msg.type === 'sync') {
        const yourId = msg.payload.your_id;
        const p1 = msg.payload.p1;
        const p2 = msg.payload.p2;
        let myScore = 0;
        if (p1?.id === yourId) myScore = p1?.score || 0;
        if (p2?.id === yourId) myScore = p2?.score || 0;

        set({ 
          gameState: msg.payload.state,
          currentRound: msg.payload.round,
          maxRounds: msg.payload.max,
          timeLimit: msg.payload.time_limit,
          playerId: yourId,
          totalScore: myScore,
        });
      } else if (msg.type === 'countdown') {
        set({ gameState: 'countdown', countdown: msg.payload.seconds });
      } else if (msg.type === 'round_start') {
        set({
          gameState: 'playing',
          currentRound: msg.payload.round,
          currentSpot: msg.payload.spot,
          opponentGuessed: false,
        });
      } else if (msg.type === 'opponent_guessed') {
        const state = get();
        if (msg.payload.player_id !== state.playerId) {
            set({ opponentGuessed: true });
        }
      } else if (msg.type === 'round_result') {
        const result = msg.payload as MultiplayerResult;
        const state = get();
        
        let newScore = state.totalScore;
        if (state.playerId === result.player1?.id) newScore += result.p1_round_score;
        else if (state.playerId === result.player2?.id) newScore += result.p2_round_score;

        set({
          gameState: result.is_game_over ? 'finished' : 'result',
          lastResult: result,
          totalScore: newScore,
        });
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      set({ isLoading: false });
    };

    ws.onclose = () => {
      set({ ws: null });
    };
  },

  submitGuess: async (lat: number, lng: number) => {
    const { ws, isMultiplayer, sessionId, totalScore } = get();
    
    if (isMultiplayer) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'guess', lat, lng }));
      }
    } else {
      // Single player REST fallback
      set({ isLoading: true });
      try {
        const response = await axios.post(`${API_BASE_URL}/game/guess`, {
          session_id: sessionId,
          guessed_lat: lat,
          guessed_lng: lng,
        });
  
        const { result, next_spot } = response.data;
        const r = result as GuessResult;
        // attach next_spot temporarily to result 
        (r as any).next_spot = next_spot;

        set({
          lastResult: r,
          totalScore: totalScore + r.score,
          gameState: r.is_game_over ? 'finished' : 'result',
        });
      } catch (error) {
        console.error('Failed to submit guess:', error);
      } finally {
        set({ isLoading: false });
      }
    }
  },

  nextRoundSinglePlayer: (nextSpot: Spot | undefined) => {
     set((state) => ({
      currentRound: state.currentRound + 1,
      currentSpot: nextSpot || null,
      gameState: 'playing',
      lastResult: null,
    }));
  },

  resetGame: () => {
    const { ws } = get();
    if (ws) ws.close();
    set({
      sessionId: null,
      playerId: null,
      currentRound: 0,
      totalScore: 0,
      currentSpot: null,
      gameState: 'idle',
      lastResult: null,
      countdown: 0,
      opponentGuessed: false,
      ws: null,
      isMultiplayer: false,
    });
  },
}));
