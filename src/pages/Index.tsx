import React, { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { BrowserProvider, Signer } from "ethers";
import { MetamaskConnect } from "@/components/MetamaskConnect";
import SafeDeployForm from "@/components/SafeDeployForm";

const Index = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [signer, setSigner] = useState<Signer | null>(null);
  
  useEffect(() => {
    const initSigner = async () => {
      if (!walletClient) return;
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      setSigner(signer);
    };
    initSigner();
  }, [walletClient]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800">Gnosis Safe Deployer</h1>
          <p className="mt-2 text-gray-600">
            Connect your Metamask wallet to deploy a new Gnosis Safe on Gnosis Chain (Chain ID: 100)
          </p>
        </header>
        
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Connect Wallet</h2>
          <MetamaskConnect />
        </div>
        
        {address && signer && (
          <div className="flex justify-center">
            <SafeDeployForm
              connectedAddress={address}
              signer={signer}
            />
          </div>
        )}

        <footer className="mt-20 text-center text-sm text-gray-500">
          <p>
            Using SafeProxyFactory at 0x4e1dcf7ad4e460cfd30791ccc4f9c8a4f820ec67 on Gnosis Chain
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
