import React, { useState } from "react";
import { ethers, isAddress } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deploySafe } from "@/lib/web3";
import { 
  DEFAULT_THRESHOLD,
  DEFAULT_SALT_NONCE,
  getContractAddresses
} from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

type SafeDeployFormProps = {
  connectedAddress: string;
  signer: ethers.Signer;
};

const SafeDeployForm: React.FC<SafeDeployFormProps> = ({ connectedAddress, signer }) => {
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD.toString());
  const [saltNonce, setSaltNonce] = useState(DEFAULT_SALT_NONCE);
  const [additionalOwners, setAdditionalOwners] = useState<string[]>([]);
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedSafeAddress, setDeployedSafeAddress] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { fallbackHandler } = getContractAddresses();

  const addOwner = () => {
    if (isAddress(newOwnerAddress) && !additionalOwners.includes(newOwnerAddress)) {
      setAdditionalOwners([...additionalOwners, newOwnerAddress]);
      setNewOwnerAddress("");
    } else if (!isAddress(newOwnerAddress)) {
      toast({
        variant: "destructive",
        title: "Invalid address",
        description: "Please enter a valid Ethereum address",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Duplicate owner",
        description: "This address is already added as an owner",
      });
    }
  };

  const removeOwner = (index: number) => {
    const updatedOwners = [...additionalOwners];
    updatedOwners.splice(index, 1);
    setAdditionalOwners(updatedOwners);
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    
    try {
      // Include the connected address and additional owners
      const allOwners = [connectedAddress, ...additionalOwners];
      const thresholdValue = parseInt(threshold, 10);
      
      // Validate
      if (thresholdValue <= 0 || thresholdValue > allOwners.length) {
        throw new Error(`Threshold must be between 1 and ${allOwners.length}`);
      }
      
      const safeAddress = await deploySafe(
        signer,
        allOwners,
        thresholdValue,
        fallbackHandler,
        saltNonce
      );
      
      setDeployedSafeAddress(safeAddress);
      
      toast({
        title: "Safe Deployed!",
        description: `Your new Gnosis Safe has been deployed at: ${safeAddress}`,
      });
    } catch (error) {
      console.error("Deployment error:", error);
      toast({
        variant: "destructive",
        title: "Deployment Failed",
        description: error.message || "Failed to deploy Safe",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Deploy New Gnosis Safe</h2>
      
      {/* Owner section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Owners</h3>
        <div className="p-3 bg-gray-50 rounded mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Your address (owner)</span>
            <span className="text-xs text-gray-500">
              {connectedAddress.substring(0, 8)}...{connectedAddress.substring(connectedAddress.length - 6)}
            </span>
          </div>
        </div>
        
        {additionalOwners.map((owner, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded mb-2 flex justify-between items-center">
            <span className="text-xs text-gray-800">
              {owner.substring(0, 8)}...{owner.substring(owner.length - 6)}
            </span>
            <Button variant="ghost" size="sm" onClick={() => removeOwner(index)}>
              Remove
            </Button>
          </div>
        ))}
        
        <div className="flex gap-2 mt-2">
          <div className="flex-1">
            <Input
              placeholder="Add another owner address"
              value={newOwnerAddress}
              onChange={(e) => setNewOwnerAddress(e.target.value)}
            />
          </div>
          <Button onClick={addOwner}>Add</Button>
        </div>
      </div>
      
      {/* Threshold setting */}
      <div className="mb-6">
        <Label htmlFor="threshold">Confirmation threshold</Label>
        <div className="mt-1">
          <Input
            id="threshold"
            type="number"
            min="1"
            max={1 + additionalOwners.length}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Number of required confirmations for transactions ({threshold} out of {1 + additionalOwners.length} owners)
          </p>
        </div>
      </div>
      
      {/* Salt Nonce */}
      <div className="mb-6">
        <Label htmlFor="saltNonce">Salt Nonce</Label>
        <div className="mt-1">
          <Input
            id="saltNonce"
            type="text"
            value={saltNonce}
            onChange={(e) => setSaltNonce(e.target.value)}
            placeholder="Salt nonce for deterministic address"
          />
          <p className="text-xs text-gray-500 mt-1">
            Unique value used to determine the Safe address
          </p>
        </div>
      </div>
      
      {/* Deploy button */}
      <Button 
        className="w-full" 
        onClick={handleDeploy} 
        disabled={isDeploying}
      >
        {isDeploying ? "Deploying..." : "Deploy Safe"}
      </Button>
      
      {/* Display result */}
      {deployedSafeAddress && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-semibold text-green-800">Safe Deployed!</h3>
          <p className="text-sm mt-1">Address: {deployedSafeAddress}</p>
          <a 
            href={`https://gnosisscan.io/address/${deployedSafeAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline mt-2 inline-block"
          >
            View on GnosisScan →
          </a>
        </div>
      )}
    </div>
  );
};

export default SafeDeployForm;
