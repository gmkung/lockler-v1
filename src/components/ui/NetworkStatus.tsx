
import React from "react";
import { useChainId } from "wagmi";
import { CHAIN_CONFIG } from "@/lib/constants";
import { Wifi, WifiOff } from "lucide-react";

interface NetworkStatusProps {
  chainId?: number;
}

export function NetworkStatus({ chainId }: NetworkStatusProps) {
  const connectedChainId = useChainId();
  const displayChainId = chainId || connectedChainId;
  
  if (!displayChainId) return null;
  
  const networkConfig = CHAIN_CONFIG[displayChainId];
  const networkName = networkConfig?.name || `Chain #${displayChainId}`;
  const networkSupported = !!networkConfig;
  
  return (
    <div className="flex items-center gap-1.5 bg-purple-900/30 px-2.5 py-1 rounded-full border border-purple-800">
      {networkSupported ? (
        <Wifi className="h-3.5 w-3.5 text-purple-300" />
      ) : (
        <WifiOff className="h-3.5 w-3.5 text-orange-300" />
      )}
      <span className={`text-xs font-medium ${networkSupported ? 'text-purple-300' : 'text-orange-300'}`}>
        {networkName}
      </span>
    </div>
  );
}
