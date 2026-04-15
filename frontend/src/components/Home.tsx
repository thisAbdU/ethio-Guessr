'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/button';
import { MapPin, Globe, Play } from 'lucide-react';

export default function Home() {
    const startGame = useGameStore((state) => state.startGame);
    const isLoading = useGameStore((state) => state.isLoading);

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col items-center justify-center p-4 overflow-hidden relative">
            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center max-w-2xl"
            >
                <div className="flex justify-center mb-6">
                    <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xl">
                        <Globe className="w-12 h-12 text-blue-600 animate-pulse" />
                    </div>
                </div>

                <h1 className="text-7xl font-black mb-4 tracking-tighter text-zinc-900">
                    EthioGuessr
                </h1>

                <p className="text-xl text-zinc-500 mb-10 leading-relaxed">
                    Explore the beauty of Ethiopia. From the streets of Addis to the mountains of Gondar.
                    Can you guess where you are?
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        size="lg"
                        onClick={startGame}
                        disabled={isLoading}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white px-10 py-8 text-xl font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(0,0,0,0.1)]"
                    >
                        {isLoading ? (
                            "Loading..."
                        ) : (
                            <>
                                <Play className="mr-2 h-6 w-6 fill-current" />
                                Start Adventure
                            </>
                        )}
                    </Button>
                </div>

                <div className="mt-16 grid grid-cols-3 gap-8">
                    <div className="flex flex-col items-center">
                        <div className="text-3xl font-bold text-zinc-900 mb-1">5</div>
                        <div className="text-zinc-500 text-sm uppercase tracking-widest">Rounds</div>
                    </div>
                    <div className="flex flex-col items-center border-x border-zinc-200 px-8">
                        <div className="text-3xl font-bold text-zinc-900 mb-1">20s</div>
                        <div className="text-zinc-500 text-sm uppercase tracking-widest">Timer</div>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="text-3xl font-bold text-zinc-900 mb-1">25k</div>
                        <div className="text-zinc-500 text-sm uppercase tracking-widest">Max Score</div>
                    </div>
                </div>
            </motion.div>

            <div className="absolute bottom-8 text-zinc-400 text-sm font-medium tracking-widest uppercase">
                Built for Ethiopia • Powered by Mapillary
            </div>
        </div>
    );
}
