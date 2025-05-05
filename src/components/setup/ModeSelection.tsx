interface ModeSelectionProps {
  escrowMode: 'p2p' | 'grant';
  setEscrowMode: (mode: 'p2p' | 'grant') => void;
}

export function ModeSelection({ escrowMode, setEscrowMode }: ModeSelectionProps) {
  return (
    <div className="flex mb-5 w-full">
      <button
        type="button"
        onClick={() => setEscrowMode('p2p')}
        className={`w-1/2 transition-all rounded-md flex flex-col items-center justify-center px-4 py-3 border
          ${escrowMode === 'p2p'
            ? "bg-gradient-to-br from-purple-600 via-purple-600/90 to-indigo-600 border-fuchsia-400 text-white"
            : "bg-[#242038] border-purple-700/50 hover:bg-purple-800/30 text-white/85"
          }
          outline-none focus:outline-none`}
      >
        <div className="font-bold text-base mb-1 w-full text-center text-white">
          Transfer Lockler
        </div>
        <div className={`text-xs text-center w-full break-words ${escrowMode === 'p2p' ? "text-purple-100" : "text-purple-300/90"}`}>
          For peer-to-peer transfers needing both parties' agreement.
        </div>
      </button>
      <button
        type="button"
        onClick={() => setEscrowMode('grant')}
        className={`w-1/2 transition-all rounded-md flex flex-col items-center justify-center px-4 py-3 border
          ${escrowMode === 'grant'
            ? "bg-gradient-to-br from-pink-500 via-fuchsia-500 to-pink-400 border-pink-300 text-white"
            : "bg-[#242038] border-purple-700/50 hover:bg-pink-900/20 text-white/85"
          }
          outline-none focus:outline-none`}
      >
        <div className="font-bold text-base mb-1 w-full text-center text-white">
          Grant Lockler
        </div>
        <div className={`text-xs text-center w-full break-words ${escrowMode === 'grant' ? "text-pink-50" : "text-pink-100/80"}`}>
          Distribute funds to recipients with security checks.
        </div>
      </button>
    </div>
  );
}
