import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { motion } from 'framer-motion';
import { Footer } from '@/components/ui/footer';

// Enhanced shiny background effect
const ShinyBackground = () => (
  <div className="absolute inset-0 overflow-hidden z-0">
    {/* Slow large rotation */}
    <motion.div
      className="absolute top-[-60%] left-[-60%] w-[220%] h-[220%] bg-gradient-radial from-purple-900/25 via-transparent to-transparent opacity-80"
      animate={{ rotate: 360 }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
    />
    {/* Faster smaller counter-rotation */}
    <motion.div
      className="absolute bottom-[-40%] right-[-40%] w-[150%] h-[150%] bg-gradient-radial from-pink-900/20 via-transparent to-transparent opacity-70"
      animate={{ rotate: -360 }}
      transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
    />
    {/* Floating Orbs */}
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-gradient-radial from-indigo-500/10 to-transparent opacity-50"
        style={{
          width: `${Math.random() * 150 + 50}px`,
          height: `${Math.random() * 150 + 50}px`,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
        }}
        animate={{
          x: [0, Math.random() * 100 - 50, 0],
          y: [0, Math.random() * 100 - 50, 0],
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: Math.random() * 10 + 10,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

export default function Intro() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-gradient-to-br from-[#1a182d] to-[#23213A] text-white overflow-hidden">
      <ShinyBackground />

      {/* Header - Minimalist for landing page */}
      <header className="relative z-10 py-4 px-6">
        <div className="container mx-auto flex items-center gap-3">
          <Logo className="h-12 w-12 text-pink-400" />
          <h1 className="text-2xl font-bold text-white">Lockler</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex items-center justify-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <motion.h2 
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 [text-shadow:0_0_15px_rgba(0,0,0,0.3)]"
            initial={{ backgroundPosition: '0% 50%' }}
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            Secure, Conditional Fund Release
          </motion.h2>
          
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-xl mx-auto [text-shadow:0_1px_3px_rgba(0,0,0,0.2)]">
            Lockler combines the security of Gnosis Safe with the decentralized Kleros Optimistic Oracle to create robust, condition-based escrow and payment release systems on the blockchain.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button 
              asChild 
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-lg px-8 py-6 w-full sm:w-auto transition-transform duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Link to="/setup">Create New Lockler</Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="border-purple-400/50 text-purple-200 hover:bg-purple-900/30 hover:text-purple-100 text-lg px-8 py-6 w-full sm:w-auto transition-transform duration-200 hover:scale-105 bg-black/10 backdrop-blur-sm shadow-lg hover:shadow-xl"
            >
              <Link to="/myLocklers">View My Locklers</Link>
            </Button>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <div className="relative z-10">
         <Footer />
      </div>
    </div>
  );
} 