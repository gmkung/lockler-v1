
import React, { useState } from "react";
import { Copy as CopyIcon, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NetworkStatus } from "./NetworkStatus";

interface AddressDisplayProps {
  address?: string;
  label: string;
  blockExplorerUrl?: string | null;
  className?: string;
  showNetworkStatus?: boolean;
  chainId?: number;
}

export function AddressDisplay({ 
  address, 
  label, 
  blockExplorerUrl, 
  className,
  showNetworkStatus,
  chainId
}: AddressDisplayProps) {
  const [copying, setCopying] = useState(false);
  const { toast } = useToast();
  
  const handleCopy = async () => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      setCopying(true);
      toast({
        title: "Copied!",
        description: `${label} address copied to clipboard.`,
      });
      setTimeout(() => setCopying(false), 1200);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to copy address.", 
        variant: "destructive" 
      });
    }
  };
  
  return (
    <div className={`flex items-center ${className || ''}`}>
      <span className="flex items-center gap-1">
        <span className="text-xs text-gray-400">{label}:</span>
        <button
          onClick={() => address && handleCopy()}
          className="text-xs font-mono bg-[#2D274B] px-2 py-1 rounded-l text-gray-300 truncate max-w-[116px] border border-transparent hover:border-pink-400/70 transition-colors outline-none"
          title={`Copy ${label} address`}
          style={{ cursor: "pointer" }}
          type="button"
        >
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "--"}
        </button>
        
        {showNetworkStatus && chainId && (
          <div className="bg-purple-900/50 px-2 py-1 rounded-r border-l border-gray-700">
            <NetworkStatus chainId={chainId} />
          </div>
        )}
        
        <CopyIcon className={`h-4 w-4 ml-0.5 text-pink-300 transition ${copying ? "opacity-100" : "opacity-50 hover:opacity-90"}`} />
        {blockExplorerUrl && address && (
          <a
            href={`${blockExplorerUrl}/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-300"
            aria-label={`${label} on block explorer`}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </span>
    </div>
  );
}
