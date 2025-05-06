
import React from 'react';
import { motion } from 'framer-motion';

export const GlowingOrbs = () => {
  // Generate random positions for the orbs
  const orbs = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: `${Math.random() * 80 + 10}%`,
    y: `${Math.random() * 80 + 10}%`,
    size: Math.random() * 250 + 150,
    duration: Math.random() * 25 + 15,
    delay: Math.random() * 5,
    color: i % 3 === 0 ? 'from-purple-600/20' : 
           i % 3 === 1 ? 'from-pink-500/20' : 'from-indigo-500/20',
  }));

  return (
    <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className={`absolute rounded-full bg-gradient-radial ${orb.color} to-transparent`}
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            filter: 'blur(40px)',
          }}
          animate={{
            x: [0, 40, -30, 20, 0],
            y: [0, -40, 30, 15, 0],
            scale: [1, 1.2, 0.9, 1.1, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}
    </div>
  );
};
