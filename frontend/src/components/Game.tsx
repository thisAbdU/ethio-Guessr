'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, MultiplayerResult, GuessResult } from '@/store/useGameStore';
import MapillaryViewer from './MapillaryViewer';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Timer, MapPin, Trophy, ArrowRight, CheckCircle2, Copy } from 'lucide-react';

const GuessMap = dynamic(() => import('./GuessMap'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-zinc-100 animate-pulse rounded-sm border border-zinc-200" />
});

export default function Game() {
    const {
        sessionId,
        playerId,
        currentSpot,
        currentRound,
        maxRounds,
        timeLimit,
        totalScore,
        gameState,
        lastResult,
        countdown,
        opponentGuessed,
        submitGuess,
        resetGame,
        isLoading,
        isMultiplayer,
        nextRoundSinglePlayer
    } = useGameStore();

    const [timeLeft, setTimeLeft] = useState(timeLimit);
    const [currentGuess, setCurrentGuess] = useState<{ lat: number; lng: number } | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);

    // Round Timer logic
    useEffect(() => {
        if (gameState !== 'playing') return;

        setTimeLeft(timeLimit);
        setCurrentGuess(null);

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState, currentRound]);

    const handleSubmit = () => {
        if (!currentGuess) return;
        submitGuess(currentGuess.lat, currentGuess.lng);
    };

    const copyLink = () => {
        const url = `${window.location.origin}/?session_id=${sessionId}`;
        navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    if (gameState === 'waiting') {
        return (
            <div className="min-h-screen bg-zinc-50 bg-noise text-zinc-900 flex flex-col items-center justify-center p-4 relative font-sans selection:bg-zinc-900 selection:text-white">
                <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white border border-zinc-200 p-8 rounded-sm text-left max-w-md w-full shadow-sm relative z-10"
                >
                    <div className="mb-6 cursor-pointer" onClick={copyLink}>
                        <div className="text-xs uppercase tracking-widest text-zinc-500 font-mono mb-2">SESSION_INVITE_LINK</div>
                        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-sm font-mono text-xs overflow-hidden text-ellipsis flex justify-between items-center hover:bg-zinc-100 transition-colors">
                            <span className="truncate">{`${window.location.origin}/?session_id=${sessionId}`}</span>
                            <Copy className="w-4 h-4 text-zinc-400 ml-2 flex-shrink-0" />
                        </div>
                        {linkCopied && <div className="text-emerald-500 text-xs font-mono mt-1 text-right">COPIED TO CLIPBOARD</div>}
                    </div>

                    <div className="flex items-center gap-3 border-t border-zinc-200 pt-6">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                        <h2 className="text-sm font-bold font-mono tracking-tight text-zinc-900 uppercase">WAITING FOR OPERATIVE...</h2>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (gameState === 'finished' && lastResult) {
        let iWon = true; // For single player logic
        let isTie = false;
        let p1Score = totalScore;
        let p2Score = 0;

        if (isMultiplayer) {
            const mr = lastResult as MultiplayerResult;
            iWon = mr.winner_id === playerId;
            isTie = !mr.winner_id;
            p2Score = playerId === mr.player1.id ? mr.player2.score : mr.player1.score;
        }

        return (
            <div className="min-h-screen bg-zinc-50 bg-noise text-zinc-900 flex flex-col items-center justify-center p-4 relative font-sans selection:bg-zinc-900 selection:text-white">
                <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white border border-zinc-200 p-8 rounded-sm text-left max-w-md w-full shadow-sm relative z-10"
                >
                    <div className="flex items-center gap-3 mb-6 border-b border-zinc-200 pb-4">
                        <div className={`w-10 h-10 rounded-sm flex items-center justify-center border ${iWon && isMultiplayer ? 'bg-emerald-50 border-emerald-200' : isTie ? 'bg-amber-50 border-amber-200' : !isMultiplayer ? 'bg-zinc-50 border-zinc-200' : 'bg-red-50 border-red-200'}`}>
                            <Trophy className={`w-5 h-5 ${iWon && isMultiplayer ? 'text-emerald-600' : isTie ? 'text-amber-600' : !isMultiplayer ? 'text-zinc-600' : 'text-red-600'}`} />
                        </div>
                        <div>
                            <div className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Status</div>
                            <h2 className={`text-xl font-bold font-mono tracking-tight ${iWon && isMultiplayer ? 'text-emerald-700' : isTie ? 'text-amber-700' : !isMultiplayer ? 'text-zinc-900' : 'text-red-700'}`}>
                                {!isMultiplayer ? 'MISSION ACCOMPLISHED' : iWon ? 'VICTORY ACHIEVED' : isTie ? 'STALEMATE' : 'MISSION FAILED'}
                            </h2>
                        </div>
                    </div>

                    <div className="border border-zinc-200 rounded-sm overflow-hidden mb-8 flex divide-x divide-zinc-200">
                        <div className={`flex-1 bg-zinc-50 p-4 flex flex-col items-center ${isMultiplayer ? 'border-b border-zinc-200' : ''}`}>
                            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-1">SCORE</span>
                            <span className="text-2xl font-black font-mono text-zinc-900">{totalScore}</span>
                        </div>
                        {isMultiplayer && (
                        <div className="flex-1 bg-zinc-50 p-4 border-b border-zinc-200 flex flex-col items-center">
                            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-1">OPP_SCORE</span>
                            <span className="text-2xl font-black font-mono text-zinc-900">
                                {p2Score}
                            </span>
                        </div>
                        )}
                    </div>

                    <Button
                        onClick={() => { window.location.href = '/'; }}
                        className="w-full brutalist-button h-14"
                    >
                        RETURN TO BASE
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-zinc-50 text-zinc-900 flex flex-col overflow-hidden">
            {/* Countdown Overlay */}
            <AnimatePresence>
                {gameState === 'countdown' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center font-mono"
                    >
                        <motion.div
                            key={countdown}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            className="text-[12rem] font-black text-white"
                        >
                            {countdown}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="h-16 border-b border-zinc-200 flex items-center justify-between px-6 bg-white z-20 font-mono">
                <div className="flex items-center gap-6">
                    <h2 className="text-lg font-bold tracking-tight">ETHIO_GUESSR</h2>
                    <div className="h-4 w-px bg-zinc-300"></div>
                    <div className="flex items-center gap-4 text-xs font-bold uppercase text-zinc-600">
                        <span className="bg-zinc-100 px-2 py-1 rounded-sm border border-zinc-200">RND {currentRound}/{maxRounds}</span>
                        <div className="flex items-center gap-2">
                            <Trophy className="w-3.5 h-3.5" />
                            <span>{totalScore}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1 w-48">
                    <div className={`flex items-center justify-between w-full px-3 py-1 rounded-sm border transition-all text-sm font-bold uppercase font-mono shadow-[2px_2px_0_0_rgba(0,0,0,0.1)] ${timeLeft <= 5 ? 'bg-red-600 border-red-700 text-white animate-pulse' : 'bg-zinc-900 border-zinc-900 text-zinc-50'
                        }`}>
                        <div className="flex items-center gap-2">
                            <Timer className="w-4 h-4" />
                            <span>TIME</span>
                        </div>
                        <span className="text-lg leading-none">{timeLeft}s</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-200 rounded-sm overflow-hidden border border-zinc-300 transform translate-y-0.5">
                        <motion.div 
                            className={`h-full ${timeLeft <= 5 ? 'bg-red-500' : 'bg-zinc-900'}`}
                            initial={{ width: '100%' }}
                            animate={{ width: `${(timeLeft / timeLimit) * 100}%` }}
                            transition={{ ease: "linear", duration: 1 }}
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 flex relative">
                <div className="flex-1 relative">
                    {currentSpot && gameState !== 'countdown' && (
                        <MapillaryViewer imageId={currentSpot.image_id} />
                    )}

                    <AnimatePresence>
                        {gameState === 'result' && lastResult && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-8"
                            >
                                <motion.div
                                    initial={{ scale: 0.95, y: 10 }}
                                    animate={{ scale: 1, y: 0 }}
                                    className="bg-white border border-zinc-200 p-8 rounded-sm max-w-md w-full shadow-sm font-mono"
                                >
                                    <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-6">
                                        <h3 className="text-lg font-bold text-zinc-900">ROUND_RESULT</h3>
                                        <div className="bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-sm text-xs font-bold text-emerald-700">
                                            +{isMultiplayer ? (playerId === (lastResult as MultiplayerResult).player1.id ? (lastResult as MultiplayerResult).p1_round_score : (lastResult as MultiplayerResult).p2_round_score) : (lastResult as GuessResult).score} PTS
                                        </div>
                                    </div>

                                    <div className="border border-zinc-200 rounded-sm overflow-hidden mb-6 text-sm">
                                        <div className="flex items-center justify-between bg-zinc-50 p-3 border-b border-zinc-200">
                                            <span className="text-zinc-500">{isMultiplayer ? 'YOUR_DIST' : 'DISTANCE'}</span>
                                            <span className="text-zinc-900 font-bold">
                                                {(isMultiplayer ? (playerId === (lastResult as MultiplayerResult).player1.id ? (lastResult as MultiplayerResult).p1_distance : (lastResult as MultiplayerResult).p2_distance) : (lastResult as GuessResult).distance).toFixed(2)} KM
                                            </span>
                                        </div>
                                        {isMultiplayer && (
                                        <div className="flex items-center justify-between bg-white p-3 border-b border-zinc-200">
                                            <span className="text-zinc-500">OPP_DIST</span>
                                            <span className="text-zinc-900 font-bold">
                                                {(playerId === (lastResult as MultiplayerResult).player1.id ? (lastResult as MultiplayerResult).p2_distance : (lastResult as MultiplayerResult).p1_distance).toFixed(2)} KM
                                            </span>
                                        </div>
                                        )}
                                        <div className="flex items-center justify-between bg-zinc-50 p-3">
                                            <span className="text-zinc-500">LOCATION</span>
                                            <span className="text-zinc-900 font-bold">{currentSpot?.city || "UNKNOWN"}</span>
                                        </div>
                                    </div>

                                    {isMultiplayer ? (
                                        <div className="w-full brutalist-button h-12 flex items-center justify-center bg-zinc-200 text-zinc-500 border-zinc-300 pointer-events-none">
                                            SYNCING NEXT ROUND...
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={() => nextRoundSinglePlayer((lastResult as any).next_spot)}
                                            className="w-full brutalist-button h-12 flex items-center justify-center gap-2"
                                        >
                                            NEXT ROUND <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="w-[450px] border-l border-zinc-200 bg-white p-4 flex flex-col gap-4 z-10 shadow-[-4px_0_15px_rgba(0,0,0,0.03)] bg-noise">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-2 mb-2">
                        <span className="text-xs font-mono font-bold tracking-widest text-zinc-400">MAP_TARGET</span>
                        {opponentGuessed ? (
                            <span className="text-xs font-mono font-bold tracking-widest text-amber-500 animate-pulse">OPPONENT CONFIRMED</span>
                        ) : (
                            <MapPin className="w-4 h-4 text-zinc-400" />
                        )}
                    </div>
                    <div className="flex-1 border border-zinc-200 rounded-sm overflow-hidden bg-white">
                        <GuessMap
                            onGuess={(lat, lng) => setCurrentGuess({ lat, lng })}
                            reveal={gameState === 'result' && lastResult ? {
                                actual: [lastResult.actual_lat, lastResult.actual_lng],
                                guessed: isMultiplayer 
                                    ? (playerId === (lastResult as MultiplayerResult).player1.id 
                                        ? [(lastResult as MultiplayerResult).player1.guessed_lat || 0, (lastResult as MultiplayerResult).player1.guessed_lng || 0] 
                                        : [(lastResult as MultiplayerResult).player2.guessed_lat || 0, (lastResult as MultiplayerResult).player2.guessed_lng || 0])
                                    : [(lastResult as GuessResult).guessed_lat, (lastResult as GuessResult).guessed_lng]
                            } : null}
                            disabled={gameState === 'result' || opponentGuessed && false} 
                        />
                    </div>

                    <Button
                        disabled={!currentGuess || gameState === 'result' || isLoading}
                        onClick={handleSubmit}
                        className={`brutalist-button h-14 w-full flex items-center justify-center transition-all ${!currentGuess ? 'opacity-50 cursor-not-allowed bg-zinc-100 text-zinc-400 border-zinc-200' : ''
                            }`}
                    >
                        {gameState === 'result' ? (
                            <span className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                GUESS SUBMITTED
                            </span>
                        ) : (
                            'SUBMIT GUESS'
                        )}
                    </Button>
                </div>
            </main>
        </div>
    );
}
