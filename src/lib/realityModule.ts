
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

  // Encode the module initialization parameters with the updated structure
  // Including the Reality Oracle address as part of the initialization parameters
  const initParams = ethers.utils.defaultAbiCoder.encode(
    [
      'address',  // owner
      'address',  // avatar
      'address',  // executor
      'address',  // oracle
      'uint32',   // timeout
      'uint32',   // cooldown
      'uint32',   // expiration
      'uint256',  // bond
      'uint256',  // templateId
      'address'   // arbitrator
    ],
    [
      params.safeAddress,    // owner
      params.safeAddress,    // avatar
      params.safeAddress,    // executor (same as avatar)
      REALITY_MODULE_CONTRACTS.REALITY_ORACLE, // oracle address
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
    templateQuestion: params.templateQuestion,
    realityOracle: REALITY_MODULE_CONTRACTS.REALITY_ORACLE
  });

  // Generate a unique salt nonce
  const saltNonce = Date.now().toString();

  try {
    // Set up transaction options with manual gas limit
    const options = {
      gasLimit: 5000000, // Manually setting a high gas limit
    };

    // Deploy the module
    const tx = await deterministicHelper.deployWithEncodedParams(
      REALITY_MODULE_CONTRACTS.MODULE_PROXY_FACTORY,
      REALITY_MODULE_CONTRACTS.REALITY_MODULE_MASTER_COPY,
      initParams,
      saltNonce,
      REALITY_MODULE_CONTRACTS.REALITY_ORACLE,
      templateContent,
      params.safeAddress,  // final owner (the Safe)
      options
    );

    console.log("Transaction sent:", tx.hash);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);

    // Extract the module address from the events
    // For now, we'll return a placeholder and the transaction hash
    return {
      moduleAddress: "0x...", // In a real implementation, this would be parsed from the transaction logs
      txHash: tx.hash
    };
  } catch (error: any) {
    console.error("Error deploying Reality Module:", error);
    
    // Check for specific error codes
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      throw new Error("Failed to estimate gas. This could be due to invalid parameters or an issue with the contract. Please verify the Safe address is valid and you have enough xDAI for gas and bond.");
    }
    
    // Re-throw the error with more context
    throw new Error(`Deployment failed: ${error.message || "Unknown error"}`);
  }
}

// Helper function to format time durations
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  return `${Math.floor(seconds / 86400)} days`;
}
