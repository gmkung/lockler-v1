
import React from "react";
import { useChainId } from "wagmi";
import { CHAIN_CONFIG } from "@/lib/constants";

interface NetworkStatusProps {
  chainId?: number;
}

export function NetworkStatus({ chainId }: NetworkStatusProps) {
  const connectedChainId = useChainId();
  const displayChainId = chainId || connectedChainId;
  
  if (!displayChainId) return null;
  
  return (
    <span className="text-xs text-purple-300">
      {CHAIN_CONFIG[displayChainId]?.name || `Chain #${displayChainId}`}
    </span>
  );
}
