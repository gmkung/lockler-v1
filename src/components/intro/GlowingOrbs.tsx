
import React from 'react';
import { motion } from 'framer-motion';

export const GlowingOrbs = () => {
  // Generate random positions for the orbs
  const orbs = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    x: `${Math.random() * 80 + 10}%`,
    y: `${Math.random() * 80 + 10}%`,
    size: Math.random() * 200 + 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
    color: i % 2 === 0 ? 'from-purple-600/20' : 'from-pink-500/20',
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
            filter: 'blur(30px)',
          }}
          animate={{
            x: [0, 30, -20, 10, 0],
            y: [0, -30, 20, 10, 0],
            scale: [1, 1.1, 0.9, 1.05, 1],
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
