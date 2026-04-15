'use client';

import { useGameStore } from '@/store/useGameStore';
import Home from '@/components/Home';
import Game from '@/components/Game';
import { AnimatePresence, motion } from 'framer-motion';

export default function Page() {
  const gameState = useGameStore((state) => state.gameState);

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <AnimatePresence mode="wait">
        {gameState === 'idle' ? (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Home />
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Game />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
