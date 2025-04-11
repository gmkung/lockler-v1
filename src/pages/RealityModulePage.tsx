
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import MetamaskConnect from "@/components/MetamaskConnect";
import { Button } from "@/components/ui/button";
import RealityModuleForm from "@/components/RealityModuleForm";
import { ChevronLeft } from "lucide-react";

const RealityModulePage = () => {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  const handleConnect = (address: string, walletSigner: ethers.Signer) => {
    setConnectedAddress(address);
    setSigner(walletSigner);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ChevronLeft size={20} />
          <span>Back to Safe Deployer</span>
        </Link>
        
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800">Reality Module Deployer</h1>
          <p className="mt-2 text-gray-600">
            Deploy a Reality Module for your Gnosis Safe on Gnosis Chain (Chain ID: 100)
          </p>
        </header>
        
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Connect Wallet</h2>
          <MetamaskConnect onConnect={handleConnect} />
        </div>
        
        {connectedAddress && signer && (
          <div className="flex justify-center">
            <RealityModuleForm
              connectedAddress={connectedAddress}
              signer={signer}
            />
          </div>
        )}

        <footer className="mt-20 text-center text-sm text-gray-500">
          <p>
            Using Reality Module at {import.meta.env.DEV ? 
              "0xE78996A233895bE74a66F451f1019cA9734205cc" : 
              "0xE78996A233895bE74a66F451f1019cA9734205cc"} on Gnosis Chain
          </p>
        </footer>
      </div>
    </div>
  );
};

export default RealityModulePage;
