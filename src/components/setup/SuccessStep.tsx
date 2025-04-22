
import { Button } from "../ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SuccessStepProps {
  deployedSafeAddress: string | null;
  handleCopyAddress: () => void;
  transactionData: any;
  selectedChainId: number;
}

export function SuccessStep({ 
  deployedSafeAddress, 
  handleCopyAddress, 
  transactionData,
  selectedChainId
}: SuccessStepProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center text-center animate-fade-in">
      <div className="text-3xl text-white mb-2 font-extrabold tracking-tight text-gradient-primary">
        🎉 Tadaa!
      </div>
      <div className="text-xl text-white font-bold mb-3">
        Your single-purpose Lockler is ready 🚀
      </div>
      <div className="mb-4 text-purple-200 max-w-xs">
        Simply send the tokens any token you want to escrow directly to this Lockler address.
        After that, recipients can go to the Release page to propose the release of the funds.
      </div>
      <div className="w-full flex flex-col gap-2 mb-4">
        <div className="flex flex-col items-center gap-1 rounded-3xl border border-purple-700 bg-[rgba(44,36,71,0.98)] px-5 py-3">
          <span className="text-xs uppercase tracking-widest text-purple-400">Lockler Address</span>
          <div className="flex items-center mt-1 gap-2 select-text">
            <span className="font-mono text-white text-sm break-all">{deployedSafeAddress}</span>
            <button
              aria-label="Copy address"
              onClick={handleCopyAddress}
              className="p-1 hover:bg-fuchsia-700/30 rounded transition"
            >
              <Copy size={18} className="text-pink-300" />
            </button>
            <a
              href={`/release/${selectedChainId}/${deployedSafeAddress}`}
              className="p-1 hover:bg-indigo-700/30 rounded transition"
              target="_blank" rel="noopener noreferrer"
              aria-label="View Lockler"
            >
              <ExternalLink size={18} className="text-indigo-300" />
            </a>
          </div>
          {transactionData?.contractAddress && (
            <div className="mt-2 text-xs text-purple-300">
              <span className="font-semibold">Security Module:</span> {transactionData.contractAddress}
            </div>
          )}
          <div className="flex gap-2 mt-2 w-full">
            <Button
              className="flex-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white"
              onClick={handleCopyAddress}
            >
              Copy Address
            </Button>
            <Button
              className="flex-1 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-600 text-white"
              onClick={() => navigate(`/release/${selectedChainId}/${deployedSafeAddress}`)}
            >
              View Lockler
            </Button>
          </div>
        </div>
      </div>
      <div className="text-purple-200 text-xs mt-2">
        You can now use your Lockler to securely store and release funds!
      </div>
    </div>
  );
}
