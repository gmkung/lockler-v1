import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { connectWallet, getProvider } from "@/lib/web3";
import { DEFAULT_CHAIN_ID, getChainConfig } from "@/lib/constants";

export default function MetamaskConnect() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const provider = getProvider();
        const network = await provider.getNetwork();
        if (network.chainId !== BigInt(DEFAULT_CHAIN_ID)) {
          setError(`Please switch to ${getChainConfig().name}`);
        } else {
          setError(null);
          const signer = await provider.getSigner();
          const addr = await signer.getAddress();
          setAddress(addr);
        }
      } catch (err) {
        console.error("Error checking connection:", err);
      }
    };

    checkConnection();
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const signer = await connectWallet();
      const addr = await signer.getAddress();
      setAddress(addr);
    } catch (err) {
      console.error("Connection error:", err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-red-500">{error}</p>
        <Button onClick={handleConnect} disabled={isConnecting}>
          {isConnecting ? "Connecting..." : "Switch Network"}
        </Button>
      </div>
    );
  }

  if (!address) {
    return (
      <Button onClick={handleConnect} disabled={isConnecting}>
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  const chainConfig = getChainConfig();
  return (
    <div className="flex flex-col items-center gap-2">
      <p>Connected: {address}</p>
      <p>Network: {chainConfig.name} (Chain ID: {chainConfig.id})</p>
    </div>
  );
}
