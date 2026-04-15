'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/button';
import { MapPin, Globe, Play, ChevronRight, Terminal, User, Users } from 'lucide-react';

export default function Home() {
    const createMultiplayerGame = useGameStore((state) => state.createMultiplayerGame);
    const startSinglePlayerGame = useGameStore((state) => state.startSinglePlayerGame);
    const joinGame = useGameStore((state) => state.joinGame);
    const isLoading = useGameStore((state) => state.isLoading);

    const [rounds, setRounds] = useState(5);
    const [timeLimit, setTimeLimit] = useState(20);

    useEffect(() => {
        // Auto-join if session_id is present
        const params = new URLSearchParams(window.location.search);
        const sid = params.get('session_id');
        if (sid) {
            joinGame(sid);
        }
    }, [joinGame]);

    const handleCreateMultiplayer = async () => {
        const sid = await createMultiplayerGame(rounds, timeLimit);
        if (sid) {
            window.history.pushState(null, '', `?session_id=${sid}`);
            joinGame(sid);
        }
    };

    const handleSinglePlayer = async () => {
        await startSinglePlayerGame(rounds, timeLimit);
    };

    return (
        <div className="min-h-screen bg-zinc-50 bg-noise text-zinc-900 flex flex-col relative font-sans selection:bg-zinc-900 selection:text-white overflow-x-hidden">
            {/* Grid Pattern Foreground */}
            <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            {/* Top Bar for vibes */}
            <div className="absolute top-0 w-full border-b border-zinc-200 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-zinc-900" />
                    <span className="font-mono text-sm font-bold tracking-tight">ETHIO_GUESSR</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono uppercase text-zinc-500">
                    <span>Beta v1.0.0</span>
                    <span className="hidden md:inline border-l border-zinc-200 pl-4">System: Online</span>
                </div>
            </div>

            <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 relative z-10 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 text-center max-w-2xl w-full"
            >
                {/* Minimal Header Badge */}
                <div className="flex justify-center mb-8">
                    <div className="border border-zinc-200 bg-white px-3 py-1 flex items-center gap-2 shadow-sm text-xs font-mono uppercase tracking-widest text-zinc-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Guess Ethiopia
                    </div>
                </div>

                <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter text-zinc-900 drop-shadow-sm">
                    EthioGuessr.
                </h1>

                <p className="text-lg md:text-xl text-zinc-600 mb-12 leading-relaxed max-w-xl mx-auto border-l-2 border-zinc-300 pl-4 text-left">
                    Explore the beauty of Ethiopia. From the bustling streets of Addis to the historical castles of Gondar.
                    <br/><br/>
                    <span className="font-mono text-sm text-zinc-400 uppercase tracking-widest">Can you guess where you are?</span>
                </p>

                <div className="flex flex-col gap-6 max-w-sm mx-auto mb-10 w-full text-left">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                         <span className="font-mono text-sm tracking-widest text-zinc-500 uppercase">ROUNDS</span>
                         <div className="flex gap-2">
                             {[3, 5, 10].map(r => (
                                 <button key={r} onClick={() => setRounds(r)} className={`px-2 py-0.5 text-xs font-mono font-bold border transition-colors ${rounds === r ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-transparent border-zinc-300 text-zinc-500 hover:border-zinc-500'}`}>{r}</button>
                             ))}
                         </div>
                    </div>
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                         <span className="font-mono text-sm tracking-widest text-zinc-500 uppercase">TIME LIMIT</span>
                         <div className="flex gap-2">
                             {[10, 20, 30].map(t => (
                                 <button key={t} onClick={() => setTimeLimit(t)} className={`px-2 py-0.5 text-xs font-mono font-bold border transition-colors ${timeLimit === t ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-transparent border-zinc-300 text-zinc-500 hover:border-zinc-500'}`}>{t}s</button>
                             ))}
                         </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button
                        size="lg"
                        onClick={handleSinglePlayer}
                        disabled={isLoading}
                        className="brutalist-border rounded-sm bg-white hover:bg-zinc-100 px-6 py-6 text-sm text-black font-mono uppercase tracking-widest w-full sm:w-auto flex items-center justify-between group"
                    >
                        {isLoading ? (
                            "INITIALIZING..."
                        ) : (
                            <>
                                <span className="flex items-center gap-2"><User className="w-4 h-4" /> SOLO MODE</span>
                            </>
                        )}
                    </Button>
                    <Button
                        size="lg"
                        onClick={handleCreateMultiplayer}
                        disabled={isLoading}
                        className="brutalist-button px-6 py-6 text-sm font-mono uppercase tracking-widest w-full sm:w-auto flex items-center justify-between group"
                    >
                        {isLoading ? (
                            "INITIALIZING..."
                        ) : (
                            <>
                                <span className="flex items-center gap-2"><Users className="w-4 h-4" /> MULTIPLAYER</span>
                                <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </Button>
                </div>

                {/* Tech-styled stats layout */}
                <div className="mt-16 border border-zinc-200 bg-white shadow-sm flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
                    <div className="flex-1 p-6 text-left flex flex-col justify-center">
                        <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-2 border-b border-zinc-200 pb-2 inline-block">TARGET_REGION</div>
                        <div className="text-2xl font-black text-zinc-900 tracking-tighter">ALL_ZONES</div>
                    </div>
                    <div className="flex-1 p-6 text-left flex flex-col justify-center">
                        <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-2 border-b border-zinc-200 pb-2 inline-block">THREAT_LEVEL</div>
                        <div className={`text-2xl font-black tracking-tighter ${timeLimit === 10 ? 'text-red-600' : timeLimit === 20 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {timeLimit === 10 ? 'CRITICAL' : timeLimit === 20 ? 'ELEVATED' : 'NOMINAL'}
                        </div>
                    </div>
                    <div className="flex-1 p-6 text-left flex flex-col justify-center bg-zinc-50 w-full sm:w-auto">
                        <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-2 border-b border-zinc-200 pb-2 inline-block">MAX_YIELD</div>
                        <div className="text-2xl font-black text-zinc-900 tracking-tighter">{(rounds * 5000).toLocaleString()} PTS</div>
                    </div>
                </div>
            </motion.div>
            </main>

            <div className="w-full border-t border-dashed border-zinc-300 p-4 z-10 bg-zinc-50/80 backdrop-blur-sm relative mt-auto">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs font-mono uppercase text-zinc-500 tracking-widest">
                    <span>Built for Ethiopia • 2026</span>
                    <span className="mt-2 md:mt-0">Powered by Mapillary Imagery</span>
                </div>
            </div>
        </div>
    );
}
