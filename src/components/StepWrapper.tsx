
import React from "react";

/** A rounded, mobile-friendly card container for each step (with nice padding, shadow, and slight slide-in effect) */
export function StepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-md w-full mx-auto p-5 sm:p-6 rounded-3xl shadow-2xl bg-gradient-to-br from-[#23213A] to-[#2D274B] border border-gray-800 animate-fade-in">
      {children}
    </div>
  );
}
