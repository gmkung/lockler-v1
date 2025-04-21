import { useState } from 'react';
import { useAccount, useConnect, useChainId } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { getChainConfig, SUPPORTED_CHAINS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { connectWallet, getProvider } from "@/lib/web3";

export function MetamaskConnect() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const chainId = useChainId() || SUPPORTED_CHAINS.MAINNET;
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      const chainConfig = getChainConfig(chainId);
      const provider = getProvider(chainId);
      await connectWallet(chainId);
      await connect({ connector: injected() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-red-500">{error}</p>
        <Button onClick={handleConnect}>
          Connect Wallet
        </Button>
      </div>
    );
  }

  if (!address) {
    return (
      <Button onClick={handleConnect}>
        Connect Wallet
      </Button>
    );
  }

  const chainConfig = getChainConfig(chainId);
  return (
    <div className="flex flex-col items-center gap-2">
      <p>Connected: {address}</p>
      <p>Network: {chainConfig.name} (Chain ID: {chainId})</p>
    </div>
  );
}
