
import { useState, useEffect } from "react";
import { BrowserProvider } from "ethers";
import { SUPPORTED_CHAINS, CHAIN_CONFIG } from '../lib/constants';

export function useChainSelection() {
  const [selectedChainId, setSelectedChainId] = useState<number>(SUPPORTED_CHAINS.GNOSIS);
  const [connectedChainId, setConnectedChainId] = useState<number | null>(null);
  const [chainName, setChainName] = useState<string>("");

  useEffect(() => {
    const handleChainChanged = (newChainId: string) => {
      const parsedChainId = parseInt(newChainId, 16);
      setConnectedChainId(parsedChainId);

      const chainConfig = CHAIN_CONFIG[parsedChainId];
      setChainName(chainConfig ? chainConfig.name : `Chain ${parsedChainId}`);
    };

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.request({ method: 'eth_chainId' })
        .then(handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  return {
    selectedChainId,
    setSelectedChainId,
    connectedChainId,
    chainName
  };
}
