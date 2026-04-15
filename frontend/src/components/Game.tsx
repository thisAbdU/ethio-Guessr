'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import MapillaryViewer from './MapillaryViewer';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Timer, MapPin, Trophy, ArrowRight, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const GuessMap = dynamic(() => import('./GuessMap'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-zinc-100 animate-pulse rounded-xl" />
});

export default function Game() {
    const {
        currentSpot,
        currentRound,
        totalScore,
        gameState,
        lastResult,
        submitGuess,
        nextRound,
        resetGame,
        isLoading
    } = useGameStore();

    const [timeLeft, setTimeLeft] = useState(20);
    const [currentGuess, setCurrentGuess] = useState<{ lat: number; lng: number } | null>(null);
    const [nextSpotData, setNextSpotData] = useState<any>(null);

    // Timer logic
    useEffect(() => {
        if (gameState !== 'playing') return;

        if (timeLeft <= 0) {
            handleAutoSubmit();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, gameState]);

    // Reset timer on new round
    useEffect(() => {
        if (gameState === 'playing') {
            setTimeLeft(20);
            setCurrentGuess(null);
        }
    }, [currentRound, gameState]);

    const handleAutoSubmit = () => {
        if (currentGuess) {
            handleSubmit();
        } else {
            // No guess placed — submit Ethiopia's geographic center as a forfeit
            submitGuess(9.145, 40.489);
        }
    };

    const handleSubmit = async () => {
        if (!currentGuess) return;

        // We need to get the next spot from the backend response
        // Our store's submitGuess currently doesn't return the next_spot to the UI easily
        // Let's modify the store or handle it here. 
        // Actually, let's just use axios here to get the full response for the UI.
        const sessionId = useGameStore.getState().sessionId;
        try {
            const response = await axios.post(`http://localhost:8080/api/game/guess`, {
                session_id: sessionId,
                guessed_lat: currentGuess.lat,
                guessed_lng: currentGuess.lng,
            });

            setNextSpotData(response.data.next_spot);
            // Still call the store to update state
            useGameStore.setState({
                lastResult: response.data.result,
                totalScore: useGameStore.getState().totalScore + response.data.result.score,
                gameState: 'result'
            });
        } catch (error) {
            console.error(error);
        }
    };

    if (gameState === 'finished') {
        return (
            <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white border border-zinc-200 p-12 rounded-[3rem] text-center max-w-md w-full shadow-2xl"
                >
                    <div className="bg-emerald-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                        <Trophy className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="text-4xl font-black mb-2">Game Over!</h2>
                    <p className="text-zinc-500 mb-8">You've explored Ethiopia!</p>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                            <div className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Total Score</div>
                            <div className="text-3xl font-bold text-zinc-900">{totalScore}</div>
                        </div>
                        <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                            <div className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Rounds</div>
                            <div className="text-3xl font-bold text-zinc-900">5/5</div>
                        </div>
                    </div>

                    <Button
                        onClick={resetGame}
                        className="w-full bg-zinc-900 text-white hover:bg-zinc-800 h-16 text-xl font-bold rounded-2xl"
                    >
                        Play Again
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-zinc-50 text-zinc-900 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="h-20 border-b border-zinc-200 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md z-20">
                <div className="flex items-center gap-8">
                    <h2 className="text-2xl font-black tracking-tighter">EthioGuessr</h2>
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="px-4 py-1.5 rounded-full border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-700">
                            Round {currentRound} / 5
                        </Badge>
                        <div className="flex items-center gap-2 text-zinc-500">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            <span className="font-mono font-bold text-zinc-900">{totalScore}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className={`flex items-center gap-3 px-6 py-2 rounded-full border transition-all ${timeLeft <= 5 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                        }`}>
                        <Timer className="w-5 h-5" />
                        <span className="text-2xl font-mono font-bold">{timeLeft}s</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex relative">
                {/* Left: Mapillary Viewer */}
                <div className="flex-1 relative">
                    {currentSpot && (
                        <MapillaryViewer imageId={currentSpot.image_id} />
                    )}

                    {/* Overlay for result */}
                    <AnimatePresence>
                        {gameState === 'result' && lastResult && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-8"
                            >
                                <motion.div
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    className="bg-white border border-zinc-200 p-10 rounded-[2.5rem] max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.1)]"
                                >
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-3xl font-black text-zinc-900">Round Result</h3>
                                        <div className="bg-blue-600 px-4 py-1 rounded-full text-sm font-bold text-white">
                                            +{lastResult.score}
                                        </div>
                                    </div>

                                    <div className="space-y-6 mb-10">
                                        <div className="flex items-center justify-between text-zinc-500">
                                            <span>Distance</span>
                                            <span className="text-zinc-900 font-bold">{lastResult.distance.toFixed(2)} km</span>
                                        </div>
                                        <div className="h-px bg-zinc-100" />
                                        <div className="flex items-center justify-between text-zinc-500">
                                            <span>Location</span>
                                            <span className="text-zinc-900 font-bold">{currentSpot?.city}</span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => nextRound(nextSpotData)}
                                        className="w-full bg-blue-600 hover:bg-blue-500 h-16 text-xl font-bold rounded-2xl flex items-center justify-center gap-2"
                                    >
                                        {lastResult.is_game_over ? 'Finish Game' : 'Next Round'}
                                        <ArrowRight className="w-6 h-6" />
                                    </Button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right: Guess Map */}
                <div className="w-[450px] border-l border-zinc-200 bg-white p-6 flex flex-col gap-6 z-10">
                    <div className="flex-1">
                        <GuessMap
                            onGuess={(lat, lng) => setCurrentGuess({ lat, lng })}
                            reveal={gameState === 'result' && lastResult ? {
                                actual: [lastResult.actual_lat, lastResult.actual_lng],
                                guessed: [lastResult.guessed_lat, lastResult.guessed_lng]
                            } : null}
                            disabled={gameState === 'result'}
                        />
                    </div>

                    <Button
                        disabled={!currentGuess || gameState === 'result' || isLoading}
                        onClick={handleSubmit}
                        className={`h-20 text-xl font-black rounded-2xl transition-all ${!currentGuess ? 'bg-zinc-100 text-zinc-400' : 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-[0_0_30px_rgba(0,0,0,0.1)]'
                            }`}
                    >
                        {gameState === 'result' ? (
                            <span className="flex items-center gap-2">
                                <CheckCircle2 className="w-6 h-6" />
                                Guess Submitted
                            </span>
                        ) : (
                            'Submit Guess'
                        )}
                    </Button>
                </div>
            </main>
        </div>
    );
}
