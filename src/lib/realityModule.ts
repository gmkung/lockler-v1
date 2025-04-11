
import { ethers } from "ethers";
import { REALITY_MODULE_CONTRACTS } from "./constants";

// Type definition for Reality Module deployment parameters
export interface RealityModuleParams {
  safeAddress: string;
  bond: string;
  timeout: string;
  cooldown: string;
  expiration: string;
  templateQuestion: string;
}

// Function to deploy a Reality Module
export async function deployRealityModule(
  signer: ethers.Signer,
  params: RealityModuleParams
): Promise<{ moduleAddress: string | null; txHash: string }> {
  // Connect to Deterministic Deployment Helper contract
  const deterministicHelper = new ethers.Contract(
    REALITY_MODULE_CONTRACTS.DETERMINISTIC_DEPLOYMENT_HELPER,
    [
      'function deployWithEncodedParams(address factory, address masterCopy, bytes initParams, uint256 saltNonce, address realityOracle, string templateContent, address finalModuleOwner) returns (address)'
    ],
    signer
  );

  // Encode the module initialization parameters
  const initParams = ethers.utils.defaultAbiCoder.encode(
    ['address', 'address', 'address', 'uint32', 'uint32', 'uint32', 'uint256', 'uint256', 'address'],
    [
      params.safeAddress,    // owner
      params.safeAddress,    // avatar
      params.safeAddress,    // executor (same as avatar)
      params.timeout,
      params.cooldown,
      params.expiration,
      ethers.utils.parseEther(params.bond), // convert xDAI to wei
      0,                     // templateId (will be created)
      REALITY_MODULE_CONTRACTS.KLEROS_ARBITRATOR
    ]
  );

  // Prepare template content
  const templateContent = JSON.stringify({
    type: 'bool',
    title: params.templateQuestion,
    category: 'DAO proposal',
    lang: 'en'
  });

  console.log("Deploying Reality Module with parameters:", {
    safeAddress: params.safeAddress,
    timeout: params.timeout,
    cooldown: params.cooldown,
    expiration: params.expiration,
    bond: params.bond,
    templateQuestion: params.templateQuestion
  });

  // Generate a unique salt nonce
  const saltNonce = Date.now().toString();

  // Deploy the module
  const tx = await deterministicHelper.deployWithEncodedParams(
    REALITY_MODULE_CONTRACTS.MODULE_PROXY_FACTORY,
    REALITY_MODULE_CONTRACTS.REALITY_MODULE_MASTER_COPY,
    initParams,
    saltNonce,
    REALITY_MODULE_CONTRACTS.REALITY_ORACLE,
    templateContent,
    params.safeAddress  // final owner (the Safe)
  );

  console.log("Transaction sent:", tx.hash);
  
  // Wait for the transaction to be mined
  const receipt = await tx.wait();
  console.log("Transaction confirmed:", receipt);

  // Try to extract the module address from the events or logs
  // Note: This part depends on the actual events emitted by the contract
  // You might need to adjust this based on the actual implementation
  
  // For now, we'll return a placeholder - in a real implementation, you would parse the log
  // to extract the deployed module address
  return {
    moduleAddress: "0x...", // In a real implementation, extract from logs
    txHash: tx.hash
  };
}

// Helper function to format time durations
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  return `${Math.floor(seconds / 86400)} days`;
}
