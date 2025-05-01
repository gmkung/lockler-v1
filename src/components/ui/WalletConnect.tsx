
import React from "react";
import { useAccount, useConnect, useChainId } from "wagmi";
import { injected } from "wagmi/connectors";
import { Button } from "@/components/ui/button";
import { CHAIN_CONFIG } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { switchChain } from "@/lib/utils";

interface WalletConnectProps {
  requiredChainId?: number;
}

export function WalletConnect({ requiredChainId }: WalletConnectProps) {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const connectedChainId = useChainId();
  const { toast } = useToast();
  
  // Determine if we need to switch chains
  const isCorrectChain = !requiredChainId || 
    (requiredChainId && connectedChainId && requiredChainId === connectedChainId);
  
  const handleConnectWallet = () => {
    connect({ connector: injected() });
  };
  
  const handleSwitchChain = async () => {
    if (!requiredChainId) return;
    
    const result = await switchChain(requiredChainId);
    
    if (result.success) {
      toast({
        title: "Network switched",
        description: `Successfully switched to ${CHAIN_CONFIG[requiredChainId].name}`,
      });
    } else {
      toast({
        title: "Network switch failed",
        description: result.error || "Failed to switch networks",
        variant: "destructive"
      });
    }
  };
  
  if (!isConnected) {
    return (
      <Button
        onClick={handleConnectWallet}
        variant="outline"
        className="bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
      >
        Connect Wallet
      </Button>
    );
  }
  
  if (isConnected && !isCorrectChain && requiredChainId) {
    return (
      <Button
        onClick={handleSwitchChain}
        variant="outline"
        className="bg-yellow-900/30 border-yellow-700 text-yellow-200 hover:bg-yellow-800/50"
      >
        Switch to {CHAIN_CONFIG[requiredChainId]?.name}
      </Button>
    );
  }
  
  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
        <div className="h-3 w-3 bg-green-500 rounded-full" />
        <p className="text-sm font-medium text-gray-200">
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
        </p>
      </div>
      {connectedChainId && (
        <span className="text-xs text-purple-300 mt-1">
          {CHAIN_CONFIG[connectedChainId]?.name || `Chain #${connectedChainId}`}
        </span>
      )}
    </div>
  );
}
