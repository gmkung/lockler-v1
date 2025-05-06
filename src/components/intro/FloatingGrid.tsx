
import React from 'react';
import { motion } from 'framer-motion';

export const FloatingGrid = () => {
  return (
    <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMCAwaDYwdjYwSDB6IiBmaWxsLW9wYWNpdHk9Ii4wNSIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0zMCAzMGgzMHYzMEgzMHoiIGZpbGwtb3BhY2l0eT0iLjA1IiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTAgMzBoMzB2MzBIMHoiIGZpbGwtb3BhY2l0eT0iLjA1IiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTAgMGgzMHYzMEgweiIgZmlsbC1vcGFjaXR5PSIuMDUiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMzAgMGgzMHYzMEgzMHoiIGZpbGwtb3BhY2l0eT0iLjA1IiBmaWxsPSIjZmZmIi8+PC9nPjwvc3ZnPg==')]" style={{ opacity: 0.2 }} />
      
      <motion.div 
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div 
            key={i}
            className="absolute inset-0 border border-pink-500/10"
            initial={{ scale: 0.8 + i * 0.1, opacity: 0.3 - i * 0.1 }}
            animate={{ 
              scale: [0.8 + i * 0.1, 0.9 + i * 0.1, 0.8 + i * 0.1],
              opacity: [0.3 - i * 0.1, 0.4 - i * 0.1, 0.3 - i * 0.1]
            }}
            transition={{ 
              duration: 8 + i * 2,
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};
