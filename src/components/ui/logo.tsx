
import React from 'react';

export const Logo = ({ className = '', size = 24 }: { className?: string; size?: number }) => (
  <img 
    src="/lovable-uploads/4a579923-e5d9-4127-9625-0437d1ad613a.png" 
    alt="Lockler Logo" 
    width={size} 
    height={size} 
    className={className}
  />
);
