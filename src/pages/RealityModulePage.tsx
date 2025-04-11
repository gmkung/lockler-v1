
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import MetamaskConnect from "@/components/MetamaskConnect";
import { Button } from "@/components/ui/button";
import RealityModuleForm from "@/components/RealityModuleForm";
import { ChevronLeft, AlertTriangle, Info, HelpCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  Popover,
  PopoverTrigger,
  PopoverContent 
} from "@/components/ui/popover";

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
        
        <Alert className="mb-8">
          <Info className="h-4 w-4" />
          <AlertTitle>Deployment Instructions</AlertTitle>
          <AlertDescription>
            <p className="mb-2">Based on Solidity code analysis, please follow these guidelines:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use a very small bond amount (0.001 xDAI) for testing</li>
              <li>Ensure the Safe address is valid and exists on Gnosis Chain</li>
              <li>You must have sufficient xDAI for gas fees</li>
              <li>If deployment fails, check console logs for detailed error information</li>
            </ul>
          </AlertDescription>
        </Alert>
        
        <Alert className="mb-8 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Common Deployment Issues</AlertTitle>
          <AlertDescription className="text-amber-700">
            <p className="mb-2">If your deployment fails, it may be due to one of these common issues:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li className="font-medium">
                Invalid Safe Address
                <p className="font-normal mt-1">Ensure the Safe address is correct and exists on Gnosis Chain. The address must be checksummed properly.</p>
              </li>
              <li className="font-medium">
                Permission Issues
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="link" className="h-auto p-0 ml-1">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <p className="text-sm">
                      The Safe needs to have the helper contract as an enabled module before deployment.
                      This typically happens if the Safe was not originally deployed with the correct configuration.
                    </p>
                  </PopoverContent>
                </Popover>
                <p className="font-normal mt-1">The deployment helper contract may not have permission to deploy modules to this Safe. Try using a newly deployed Safe.</p>
              </li>
              <li className="font-medium">
                Transaction Reverted
                <p className="font-normal mt-1">If the blockchain reverts the transaction, it might be because the Safe doesn't recognize the operation. Try with a lower bond amount (0.0001 xDAI).</p>
              </li>
            </ul>
          </AlertDescription>
        </Alert>
        
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
              "0x25CE2252e10d1a908be3e45CF352c8f89596ffae" : 
              "0x25CE2252e10d1a908be3e45CF352c8f89596ffae"} on Gnosis Chain
          </p>
        </footer>
      </div>
    </div>
  );
};

export default RealityModulePage;
