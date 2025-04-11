
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { connectWallet, getProvider } from "@/lib/web3";
import { CHAIN_ID, CHAIN_NAME } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

type MetamaskConnectProps = {
  onConnect: (address: string, signer: ethers.Signer) => void;
};

const MetamaskConnect: React.FC<MetamaskConnectProps> = ({ onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      if (window.ethereum) {
        const provider = getProvider();
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const signer = provider.getSigner();
          const address = await signer.getAddress();
          setWalletAddress(address);
          onConnect(address, signer);
        }
      }
    };
    
    checkConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          const provider = getProvider();
          onConnect(accounts[0], provider.getSigner());
        } else {
          setWalletAddress(null);
        }
      });

      // Listen for chain changes
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
    
    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged");
        window.ethereum.removeAllListeners("chainChanged");
      }
    };
  }, [onConnect]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const signer = await connectWallet();
      const address = await signer.getAddress();
      setWalletAddress(address);
      onConnect(address, signer);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${CHAIN_NAME} with account ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
      });
    } catch (error) {
      console.error("Connection error:", error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!walletAddress ? (
        <Button 
          onClick={handleConnect} 
          disabled={isConnecting}
          size="lg"
        >
          {isConnecting ? "Connecting..." : "Connect Metamask"}
        </Button>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-md">
            Connected: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
          </div>
          <div className="text-sm text-gray-500">
            Network: {CHAIN_NAME} (Chain ID: {CHAIN_ID})
          </div>
        </div>
      )}
    </div>
  );
};

export default MetamaskConnect;
