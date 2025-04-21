
import React from "react";

/**
 * Props:
 * - step: current step (1-based)
 * - total: number of steps (usually 2)
 */
export function StepProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="w-full mt-6 mb-8 flex items-center justify-center">
      <div className="relative w-full max-w-[340px] flex items-center">
        {[...Array(total)].map((_, idx) => (
          <React.Fragment key={idx}>
            <div
              className={`z-10 rounded-full h-6 w-6 flex items-center justify-center text-sm font-semibold transition-all ${
                idx + 1 <= step
                  ? "bg-gradient-to-br from-indigo-500 to-purple-400 text-white shadow-lg"
                  : "bg-gray-800 text-gray-400 shadow"
              } border-2 border-white`}
            >
              {idx + 1}
            </div>
            {idx < total - 1 && (
              <div
                className={`flex-1 h-2 mx-1 rounded-full transition-all duration-300 ${
                  idx + 1 < step
                    ? "bg-gradient-to-r from-indigo-500 to-purple-400"
                    : "bg-gray-700"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
