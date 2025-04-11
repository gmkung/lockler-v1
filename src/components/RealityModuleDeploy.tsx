
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  REALITY_MODULE_CONTRACTS,
  DEFAULT_BOND,
  DEFAULT_TIMEOUT,
  DEFAULT_COOLDOWN,
  DEFAULT_EXPIRATION,
  DEFAULT_TEMPLATE_QUESTION
} from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { getProvider } from "@/lib/web3";

// ABI for the DeterministicDeploymentHelper
const DETERMINISTIC_HELPER_ABI = [
  "function deployWithEncodedParams(address moduleProxyFactory, address moduleMasterCopy, bytes memory initParams, uint256 saltNonce, address oracle, string memory templateContent, address finalOwner) returns (address)"
];

type RealityModuleDeployProps = {
  safeAddress: string | null;
  signer: ethers.Signer;
};

const RealityModuleDeploy: React.FC<RealityModuleDeployProps> = ({ safeAddress, signer }) => {
  // Form state
  const [executor, setExecutor] = useState<string>("");
  const [bond, setBond] = useState<string>(DEFAULT_BOND);
  const [timeout, setTimeout] = useState<string>(DEFAULT_TIMEOUT);
  const [cooldown, setCooldown] = useState<string>(DEFAULT_COOLDOWN);
  const [expiration, setExpiration] = useState<string>(DEFAULT_EXPIRATION);
  const [templateQuestion, setTemplateQuestion] = useState<string>(DEFAULT_TEMPLATE_QUESTION);
  const [saltNonce, setSaltNonce] = useState<string>(Math.floor(Math.random() * 1000000).toString());
  
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deployedModuleAddress, setDeployedModuleAddress] = useState<string | null>(null);
  const [xdaiBalance, setXdaiBalance] = useState<string>("0");
  
  const { toast } = useToast();
  
  // Set executor to connected wallet address by default
  useEffect(() => {
    const setDefaultExecutor = async () => {
      if (signer) {
        const address = await signer.getAddress();
        setExecutor(address);
      }
    };
    
    setDefaultExecutor();
  }, [signer]);
  
  // Fetch xDAI balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (signer) {
        try {
          const address = await signer.getAddress();
          const balance = await signer.provider.getBalance(address);
          setXdaiBalance(ethers.utils.formatEther(balance));
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      }
    };
    
    fetchBalance();
    
    // Refresh balance every 30 seconds
    const intervalId = setInterval(fetchBalance, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [signer]);

  // Validate inputs before deployment
  const validateInputs = () => {
    if (!safeAddress) {
      toast({
        variant: "destructive",
        title: "No Safe Address",
        description: "Please deploy a Safe first or provide a Safe address.",
      });
      return false;
    }
    
    if (!ethers.utils.isAddress(executor)) {
      toast({
        variant: "destructive",
        title: "Invalid Executor Address",
        description: "Please enter a valid Ethereum address for the executor.",
      });
      return false;
    }
    
    const bondValue = parseFloat(bond);
    if (isNaN(bondValue) || bondValue <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Bond Amount",
        description: "Please enter a valid bond amount greater than 0.",
      });
      return false;
    }
    
    if (parseFloat(xdaiBalance) < bondValue) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: `You need at least ${bond} xDAI for the bond. Current balance: ${xdaiBalance} xDAI.`,
      });
      return false;
    }
    
    if (!templateQuestion || templateQuestion.trim() === "") {
      toast({
        variant: "destructive",
        title: "Invalid Template Question",
        description: "Please enter a valid template question.",
      });
      return false;
    }
    
    return true;
  };

  const deployRealityModule = async () => {
    if (!validateInputs()) return;
    
    setIsDeploying(true);
    
    try {
      const deterministicHelper = new ethers.Contract(
        REALITY_MODULE_CONTRACTS.DETERMINISTIC_DEPLOYMENT_HELPER,
        DETERMINISTIC_HELPER_ABI,
        signer
      );
      
      // Convert bond from xDAI to wei
      const bondInWei = ethers.utils.parseEther(bond);
      
      // Create template content (JSON string)
      const templateContent = JSON.stringify({
        title: "Reality Module Question",
        type: "bool",
        content: templateQuestion
      });
      
      // Encode initialization parameters
      const initParams = ethers.utils.defaultAbiCoder.encode(
        ['address', 'address', 'address', 'uint32', 'uint32', 'uint32', 'uint256', 'uint256', 'address'],
        [
          safeAddress,
          safeAddress,
          executor,
          parseInt(timeout),
          parseInt(cooldown),
          parseInt(expiration),
          bondInWei,
          0, // templateId (set to 0, will be created)
          REALITY_MODULE_CONTRACTS.KLEROS_ARBITRATOR
        ]
      );

      console.log("Deploying Reality Module with params:", {
        moduleProxyFactory: REALITY_MODULE_CONTRACTS.MODULE_PROXY_FACTORY,
        moduleMasterCopy: REALITY_MODULE_CONTRACTS.REALITY_MODULE_MASTER_COPY,
        initParams,
        saltNonce,
        oracle: REALITY_MODULE_CONTRACTS.REALITY_ORACLE,
        templateContent,
        finalOwner: safeAddress
      });
      
      // Deploy the module
      const tx = await deterministicHelper.deployWithEncodedParams(
        REALITY_MODULE_CONTRACTS.MODULE_PROXY_FACTORY,
        REALITY_MODULE_CONTRACTS.REALITY_MODULE_MASTER_COPY,
        initParams,
        saltNonce,
        REALITY_MODULE_CONTRACTS.REALITY_ORACLE,
        templateContent,
        safeAddress
      );
      
      console.log("Transaction sent:", tx.hash);
      
      // Wait for transaction to be confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      
      // Extract the deployed module address from events
      // This depends on the event structure from the contracts
      // We'll use a placeholder and improve this later if needed
      const moduleAddress = "0x" + receipt.logs[0].topics[2].slice(26);
      setDeployedModuleAddress(moduleAddress);
      
      toast({
        title: "Reality Module Deployed!",
        description: `Your Reality Module has been deployed at address: ${moduleAddress}`,
      });
    } catch (error: any) {
      console.error("Deployment error:", error);
      toast({
        variant: "destructive",
        title: "Deployment Failed",
        description: error.message || "Failed to deploy Reality Module",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Deploy Reality Module</h2>
      
      {/* Safe Address Display */}
      <div className="mb-6">
        <Label htmlFor="safeAddress">Safe Address</Label>
        <div className="mt-1">
          {safeAddress ? (
            <div className="p-3 bg-gray-50 rounded flex items-center justify-between">
              <span className="text-sm font-mono">{safeAddress}</span>
            </div>
          ) : (
            <div className="p-3 bg-red-50 text-red-600 rounded">
              Please deploy a Safe first or enter a Safe address
            </div>
          )}
        </div>
      </div>
      
      {/* xDAI Balance */}
      <div className="mb-6">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">xDAI Balance:</span>
          <span className="font-semibold">{parseFloat(xdaiBalance).toFixed(4)} xDAI</span>
        </div>
      </div>
      
      {/* Executor Address */}
      <div className="mb-6">
        <Label htmlFor="executor">Executor Address</Label>
        <div className="mt-1">
          <Input
            id="executor"
            value={executor}
            onChange={(e) => setExecutor(e.target.value)}
            placeholder="0x..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Address that can execute proposals
          </p>
        </div>
      </div>
      
      {/* Bond Amount */}
      <div className="mb-6">
        <Label htmlFor="bond">Bond Amount (xDAI)</Label>
        <div className="mt-1">
          <Input
            id="bond"
            type="text"
            value={bond}
            onChange={(e) => setBond(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Bond required to create proposals (in xDAI)
          </p>
        </div>
      </div>
      
      {/* Advanced Options Section */}
      <div className="mb-6 space-y-4">
        <h3 className="text-lg font-semibold">Advanced Options</h3>
        
        {/* Timeout */}
        <div>
          <Label htmlFor="timeout">Timeout (seconds)</Label>
          <Input
            id="timeout"
            type="number"
            value={timeout}
            onChange={(e) => setTimeout(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Time in seconds before a proposal can be executed (default: 2 days)
          </p>
        </div>
        
        {/* Cooldown */}
        <div>
          <Label htmlFor="cooldown">Cooldown (seconds)</Label>
          <Input
            id="cooldown"
            type="number"
            value={cooldown}
            onChange={(e) => setCooldown(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Time in seconds between proposal creation and execution (default: 2 days)
          </p>
        </div>
        
        {/* Expiration */}
        <div>
          <Label htmlFor="expiration">Expiration (seconds)</Label>
          <Input
            id="expiration"
            type="number"
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Time in seconds before a proposal expires (default: 7 days)
          </p>
        </div>
        
        {/* Salt Nonce */}
        <div>
          <Label htmlFor="saltNonce">Salt Nonce</Label>
          <Input
            id="saltNonce"
            type="text"
            value={saltNonce}
            onChange={(e) => setSaltNonce(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Random number used for deterministic deployment
          </p>
        </div>
      </div>
      
      {/* Template Question */}
      <div className="mb-6">
        <Label htmlFor="templateQuestion">Question Template</Label>
        <div className="mt-1">
          <Textarea
            id="templateQuestion"
            value={templateQuestion}
            onChange={(e) => setTemplateQuestion(e.target.value)}
            rows={3}
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Template question for Reality.eth (use %s for proposal ID)
          </p>
        </div>
      </div>
      
      {/* Deploy Button */}
      <Button 
        className="w-full" 
        onClick={deployRealityModule} 
        disabled={isDeploying || !safeAddress}
      >
        {isDeploying ? "Deploying..." : "Deploy Reality Module"}
      </Button>
      
      {/* Display Result */}
      {deployedModuleAddress && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-semibold text-green-800">Reality Module Deployed!</h3>
          <p className="text-sm mt-1 break-all font-mono">{deployedModuleAddress}</p>
          <a 
            href={`https://gnosisscan.io/address/${deployedModuleAddress}`}
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

export default RealityModuleDeploy;
