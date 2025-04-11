
import React, { useState } from "react";
import { ethers } from "ethers";
import MetamaskConnect from "@/components/MetamaskConnect";
import SafeDeployForm from "@/components/SafeDeployForm";
import RealityModuleDeploy from "@/components/RealityModuleDeploy";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [deployedSafeAddress, setDeployedSafeAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("safe");

  const handleConnect = (address: string, walletSigner: ethers.Signer) => {
    setConnectedAddress(address);
    setSigner(walletSigner);
  };

  const handleSafeDeployed = (safeAddress: string | null) => {
    setDeployedSafeAddress(safeAddress);
    
    // Automatically switch to Reality Module tab after Safe deployment
    if (safeAddress) {
      setActiveTab("reality");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800">Gnosis Safe & Reality Module Deployer</h1>
          <p className="mt-2 text-gray-600">
            Connect your Metamask wallet to deploy a new Gnosis Safe and Reality Module on Gnosis Chain (Chain ID: 100)
          </p>
        </header>
        
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Connect Wallet</h2>
          <MetamaskConnect onConnect={handleConnect} />
        </div>
        
        {connectedAddress && signer && (
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="safe">Safe Deployment</TabsTrigger>
                <TabsTrigger value="reality" disabled={!connectedAddress}>
                  Reality Module
                </TabsTrigger>
              </TabsList>
              <div className="mt-6">
                <TabsContent value="safe" className="flex justify-center">
                  <SafeDeployForm
                    connectedAddress={connectedAddress}
                    signer={signer}
                    onSafeDeployed={handleSafeDeployed}
                  />
                </TabsContent>
                <TabsContent value="reality" className="flex justify-center">
                  <RealityModuleDeploy
                    safeAddress={deployedSafeAddress}
                    signer={signer}
                  />
                </TabsContent>
              </div>
            </Tabs>
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
