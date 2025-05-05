import { useState } from "react";
import { BrowserProvider } from "ethers";
import { useToast } from "./use-toast";
import { deploySafeWithOwners, deployRealityModule } from "../lib/deployment";
import { switchChain } from "../lib/utils";
import { uploadContractTerms } from "../lib/ipfs";
import { getContractAddresses } from "../lib/constants";
import { EscrowContractTerms } from "../lib/types";

interface DeploymentConfig {
  escrowMode: "p2p" | "grant";
  p2pRole: "sender" | "receiver";
  counterpartyAddress: string;
  saltNonce: string;
  contractTerms: EscrowContractTerms;
  chainId: number;
}

export function useDeployment({
  escrowMode,
  p2pRole,
  counterpartyAddress,
  saltNonce,
  contractTerms,
  chainId,
}: DeploymentConfig) {
  const [deployedSafeAddress, setDeployedSafeAddress] = useState<string | null>(
    null
  );
  const [moduleDeploymentHash, setModuleDeploymentHash] = useState<
    string | null
  >(null);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deployModalOpen, setDeployModalOpen] = useState(false);

  const { toast } = useToast();

  const handleSafeDeploy = async (): Promise<string> => {
    setError(null);

    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    if (!chainId) {
      throw new Error(
        `Invalid chain ID: ${chainId}. Please select a supported chain.`
      );
    }

    console.log("Deploying to chain ID:", chainId);

    const switchResult = await switchChain(chainId);
    if (!switchResult.success) {
      throw new Error(
        `Failed to switch to chain ${chainId}: ${switchResult.error}`
      );
    }

    const contracts = getContractAddresses(chainId);
    const provider = switchResult.provider as BrowserProvider;
    const safeAddress = await deploySafeWithOwners(
      provider,
      escrowMode,
      p2pRole,
      counterpartyAddress,
      saltNonce,
      contracts,
      chainId
    );

    setDeployedSafeAddress(safeAddress);

    toast({
      title: "Lockler Safe Created!",
      description: `Your new Lockler Safe is: ${safeAddress}`,
    });

    return safeAddress;
  };

  const handleModuleDeploy = async () => {
    if (!deployedSafeAddress) {
      throw new Error("Please deploy a Lockler Safe first");
    }

    setError(null);
    setTransactionData(null);
    setModuleDeploymentHash(null);

    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    if (!chainId) {
      throw new Error(
        `Invalid chain ID: ${chainId}. Please select a supported chain.`
      );
    }

    console.log("Deploying module to chain ID:", chainId);

    const switchResult = await switchChain(chainId);
    if (!switchResult.success) {
      throw new Error(
        `Failed to switch to chain ${chainId}: ${switchResult.error}`
      );
    }

    // Get module parameters from contractTerms with defaults if not specified
    const moduleParams = {
      timeout: contractTerms.timeout || 86400, // 24 hours default
      cooldown: contractTerms.cooldown || 43200, // 12 hours default
      expiration: contractTerms.expiration || 604800, // 7 days default
      bond: contractTerms.bond || "0.01", // 0.01 ETH/xDAI default
    };

    const cid = await uploadContractTerms(contractTerms);
    const contracts = getContractAddresses(chainId);

    const provider = switchResult.provider as BrowserProvider;
    const result = await deployRealityModule(
      provider,
      deployedSafeAddress,
      contracts,
      cid,
      moduleParams
    );

    setModuleDeploymentHash(result.txHash);
    setTransactionData(result.receipt);

    toast({
      title: "Security System Deployed!",
      description:
        "Kleros Reality Module has been deployed and configured successfully",
    });

    return result;
  };

  const handleStartDeployment = () => {
    if (escrowMode === "p2p" && !counterpartyAddress) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide a counterparty address",
      });
      return;
    }

    setDeployModalOpen(true);
  };

  return {
    // State
    deployedSafeAddress,
    moduleDeploymentHash,
    transactionData,
    error,
    loading,
    deployModalOpen,

    // Actions
    setDeployModalOpen,
    handleSafeDeploy,
    handleModuleDeploy,
    handleStartDeployment,
  };
}
