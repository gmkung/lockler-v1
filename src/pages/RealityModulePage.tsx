
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import MetamaskConnect from "@/components/MetamaskConnect";
import { Button } from "@/components/ui/button";
import RealityModuleForm from "@/components/RealityModuleForm";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const RealityModulePage = () => {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const handleConnect = async (address: string, walletSigner: ethers.Signer) => {
    try {
      // Verify we're on Gnosis Chain
      const network = await walletSigner.provider?.getNetwork();
      if (network?.chainId !== 100) {
        setNetworkError("Please connect to Gnosis Chain (Chain ID: 100)");
        return;
      }
      
      setNetworkError(null);
      setConnectedAddress(address);
      setSigner(walletSigner);
    } catch (error: any) {
      console.error("Connection error:", error);
      setNetworkError(`Connection error: ${error.message || "Unknown error"}`);
    }
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
        
        {networkError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Network Error</AlertTitle>
            <AlertDescription>{networkError}</AlertDescription>
          </Alert>
        )}
        
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Connect Wallet</h2>
          <MetamaskConnect onConnect={handleConnect} />
          
          {connectedAddress && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              Connected: {connectedAddress.substring(0, 6)}...{connectedAddress.substring(connectedAddress.length - 4)}
            </div>
          )}
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-sm text-blue-800">
          <p className="font-medium">Deployment Requirements:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>You must have xDAI in your wallet for gas fees</li>
            <li>The Safe address must be a valid Gnosis Safe on Gnosis Chain</li>
            <li>You can use a small bond amount (0.01 xDAI) for testing</li>
          </ul>
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
