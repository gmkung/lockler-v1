
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Zap, Shield, Globe } from 'lucide-react';
import { ChatBubbles } from './ChatBubbles';

const iconVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const HeroSection = () => {
  return (
    <div className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
      {/* Add ChatBubbles in the background */}
      <ChatBubbles />
      
      <motion.div
        className="flex flex-col items-center text-center max-w-5xl z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div
          className="mb-6"
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, -2, 0, 2, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <Logo className="h-20 w-20 text-pink-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]" />
        </motion.div>

        <motion.h1
          className="text-5xl sm:text-7xl lg:text-8xl font-extrabold mb-6 tracking-tighter"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400 text-transparent bg-clip-text [text-shadow:0_0_20px_rgba(219,39,119,0.2)]">
            LOCKLER
          </span>
        </motion.h1>

        <motion.div
          className="bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400 h-1 w-40 rounded-full mb-8"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 160, opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
        />

        <motion.h2
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-white [text-shadow:0_0_15px_rgba(255,255,255,0.3)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Single-purpose smart escrow addresses
        </motion.h2>

        <motion.p
          className="text-lg sm:text-xl md:text-2xl text-purple-100/90 mb-10 max-w-3xl mx-auto font-light leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          Next-gen decentralized escrow, powered by Safe and the Kleros Optimistic Oracle.
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-purple-700 to-pink-700 hover:from-purple-800 hover:to-pink-800 text-white text-xl px-10 py-7 transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(219,39,119,0.5)] hover:shadow-[0_0_30px_rgba(219,39,119,0.7)]"
          >
            <Link to="/setup">Create New Lockler</Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-2 border-indigo-500/70 bg-indigo-900/40 text-white hover:bg-indigo-800/50 hover:text-white text-xl px-10 py-7 transition-all duration-300 hover:scale-105 backdrop-blur-sm hover:border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.4)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)]"
          >
            <Link to="/myLocklers">View My Locklers</Link>
          </Button>
        </motion.div>

        <motion.div
          className="flex flex-wrap justify-center gap-10 md:gap-16 mt-6"
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.2, delayChildren: 1.2 }}
        >
          <motion.div className="flex flex-col items-center" variants={iconVariants}>
            <div className="bg-purple-900/50 p-4 rounded-full mb-3 border border-purple-400/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <Shield className="h-8 w-8 text-purple-300" />
            </div>
            <span className="text-purple-200 font-medium">Secure by Design</span>
          </motion.div>

          <motion.div className="flex flex-col items-center" variants={iconVariants}>
            <div className="bg-pink-900/50 p-4 rounded-full mb-3 border border-pink-400/30 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
              <Zap className="h-8 w-8 text-pink-300" />
            </div>
            <span className="text-pink-200 font-medium">Conditional Release</span>
          </motion.div>

          <motion.div className="flex flex-col items-center" variants={iconVariants}>
            <div className="bg-indigo-900/50 p-4 rounded-full mb-3 border border-indigo-400/30 shadow-[0_0_15px_rgba(129,140,248,0.3)]">
              <Globe className="h-8 w-8 text-indigo-300" />
            </div>
            <span className="text-indigo-200 font-medium">Fully Decentralized</span>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <div className="text-purple-300/70 text-sm mb-2">Scroll to discover</div>
        <motion.div
          className="w-1 h-8 bg-gradient-to-b from-purple-500 to-transparent rounded-full"
          animate={{ height: [16, 32, 16] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
    </div>
  );
};
