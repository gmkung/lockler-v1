
import React from "react";

interface StepWrapperProps {
  children: React.ReactNode;
  wide?: boolean;
}

/** A rounded, mobile-friendly card container for each step (with nice padding, shadow, and slight slide-in effect) */
export function StepWrapper({ children, wide = false }: StepWrapperProps) {
  return (
    <div className={`w-full mx-auto p-5 sm:p-6 rounded-3xl shadow-2xl bg-gradient-to-br from-[#23213A] to-[#2D274B] border border-gray-800 animate-fade-in ${wide ? 'max-w-6xl' : 'max-w-md'}`}>
      {children}
    </div>
  );
}
