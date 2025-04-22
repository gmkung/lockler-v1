
interface ModeSelectionProps {
  escrowMode: 'p2p' | 'grant';
  setEscrowMode: (mode: 'p2p' | 'grant') => void;
}

export function ModeSelection({ escrowMode, setEscrowMode }: ModeSelectionProps) {
  return (
    <div className="flex gap-4 mb-5 px-1 flex-col xs:flex-row sm:flex-row justify-center">
      <button
        type="button"
        onClick={() => setEscrowMode('p2p')}
        className={`w-full xs:w-1/2 aspect-square max-w-[180px] transition-all rounded-2xl flex flex-col items-center justify-center px-4 py-5 shadow-lg border-2
          ${escrowMode === 'p2p'
            ? "bg-gradient-to-br from-purple-600 via-purple-600/90 to-indigo-600 ring-2 ring-fuchsia-400 border-transparent scale-105 text-white"
            : "bg-[#242038] border border-purple-700 hover:bg-purple-800/30 text-white/85"
          }
          outline-none focus:outline-none`}
        style={{ minWidth: 0, wordBreak: 'break-word' }}
      >
        <div className="font-bold text-base mb-2 w-full text-center text-white">
          Transfer Lockler
        </div>
        <div className={`text-xs text-center w-full break-words ${escrowMode === 'p2p' ? "text-purple-100" : "text-purple-300/90"}`}>
          For one-to-one transfers needing both parties' agreement.
        </div>
      </button>
      <button
        type="button"
        onClick={() => setEscrowMode('grant')}
        className={`w-full xs:w-1/2 aspect-square max-w-[180px] transition-all rounded-2xl flex flex-col items-center justify-center px-4 py-5 shadow-lg border-2
          ${escrowMode === 'grant'
            ? "bg-gradient-to-br from-pink-500 via-fuchsia-500 to-pink-400 ring-2 ring-pink-300 border-transparent scale-105 text-white"
            : "bg-[#242038] border border-purple-700 hover:bg-pink-900/20 text-white/85"
          }
          outline-none focus:outline-none`}
        style={{ minWidth: 0, wordBreak: 'break-word' }}
      >
        <div className="font-bold text-base mb-2 w-full text-center text-white">
          Grant Lockler
        </div>
        <div className={`text-xs text-center w-full break-words ${escrowMode === 'grant' ? "text-pink-50" : "text-pink-100/80"}`}>
          Distribute funds to recipients with security checks.
        </div>
      </button>
    </div>
  );
}
