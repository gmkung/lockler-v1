
import React, { useState } from "react";
import { ethers } from "ethers";
import MetamaskConnect from "@/components/MetamaskConnect";
import SafeDeployForm from "@/components/SafeDeployForm";

const Index = () => {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  const handleConnect = (address: string, walletSigner: ethers.Signer) => {
    setConnectedAddress(address);
    setSigner(walletSigner);
  };

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
          <MetamaskConnect onConnect={handleConnect} />
        </div>
        
        {connectedAddress && signer && (
          <div className="flex justify-center">
            <SafeDeployForm
              connectedAddress={connectedAddress}
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
