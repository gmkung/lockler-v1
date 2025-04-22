
import React from 'react';

export const Logo = ({ className = '', size = 24 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 500 500" 
    fill="currentColor"
    className={className}
  >
    <path d="M250 26.8L433.7 125v196.4L250 419.8 66.3 321.4V125L250 26.8zm0-26.8L48.1 110.7v224.9L250 447l201.9-111.4V110.7L250 0z"/>
  </svg>
);
