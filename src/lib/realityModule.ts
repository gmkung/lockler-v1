
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
  // Validate safe address
  if (!ethers.utils.isAddress(params.safeAddress)) {
    throw new Error("Invalid Safe address format");
  }

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
    type: "bool",
    title: params.templateQuestion,
    category: "DAO proposal",
    lang: "en"
  });

  console.log("Deploying Reality Module with parameters:", {
    safeAddress: params.safeAddress,
    timeout: params.timeout,
    cooldown: params.cooldown,
    expiration: params.expiration,
    bond: params.bond,
    templateQuestion: params.templateQuestion,
    realityOracle: REALITY_MODULE_CONTRACTS.REALITY_ORACLE,
    arbitrator: REALITY_MODULE_CONTRACTS.KLEROS_ARBITRATOR
  });

  // Log contract addresses being used
  console.log("Contract addresses:", {
    deterministicHelper: REALITY_MODULE_CONTRACTS.DETERMINISTIC_DEPLOYMENT_HELPER,
    moduleProxyFactory: REALITY_MODULE_CONTRACTS.MODULE_PROXY_FACTORY,
    realityModuleMaster: REALITY_MODULE_CONTRACTS.REALITY_MODULE_MASTER_COPY,
    realityOracle: REALITY_MODULE_CONTRACTS.REALITY_ORACLE,
    arbitrator: REALITY_MODULE_CONTRACTS.KLEROS_ARBITRATOR
  });

  // Generate a unique salt nonce
  const saltNonce = Date.now().toString();
  console.log("Using salt nonce:", saltNonce);

  try {
    // Check if the signer has enough balance
    const signerAddress = await signer.getAddress();
    const balance = await signer.provider?.getBalance(signerAddress);
    console.log(`Signer address: ${signerAddress}, Balance: ${ethers.utils.formatEther(balance || '0')} xDAI`);

    // Set up transaction options with manual gas limit and higher gas price
    const gasPrice = await signer.provider?.getGasPrice();
    const adjustedGasPrice = gasPrice ? gasPrice.mul(120).div(100) : undefined; // 20% higher
    
    const options = {
      gasLimit: 6000000, // Increased gas limit
      gasPrice: adjustedGasPrice
    };

    console.log("Transaction options:", {
      gasLimit: options.gasLimit,
      gasPrice: adjustedGasPrice ? ethers.utils.formatUnits(adjustedGasPrice, 'gwei') + ' gwei' : 'default'
    });

    // Try to estimate gas first to check if the transaction is likely to succeed
    try {
      const estimatedGas = await deterministicHelper.estimateGas.deployWithEncodedParams(
        REALITY_MODULE_CONTRACTS.MODULE_PROXY_FACTORY,
        REALITY_MODULE_CONTRACTS.REALITY_MODULE_MASTER_COPY,
        initParams,
        saltNonce,
        REALITY_MODULE_CONTRACTS.REALITY_ORACLE,
        templateContent,
        params.safeAddress  // final owner (the Safe)
      );
      
      console.log("Estimated gas:", estimatedGas.toString());
    } catch (estimateError: any) {
      console.error("Gas estimation failed:", estimateError);
      console.log("Full error object:", JSON.stringify(estimateError, null, 2));
      
      // Check if the contract exists and has the expected code
      const realityOracleCode = await signer.provider?.getCode(REALITY_MODULE_CONTRACTS.REALITY_ORACLE);
      console.log(`Reality Oracle code length: ${realityOracleCode?.length}`);
      
      const moduleProxyFactoryCode = await signer.provider?.getCode(REALITY_MODULE_CONTRACTS.MODULE_PROXY_FACTORY);
      console.log(`Module Proxy Factory code length: ${moduleProxyFactoryCode?.length}`);
      
      // Continue with deployment despite estimation failure, using our manual gas limit
      console.log("Continuing with deployment using manual gas limit");
    }

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
    
    // Enhanced error handling
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      console.log("Transaction data:", error.transaction);
      console.log("Error data:", error.error?.data);
      
      // Try to decode the error message if available
      if (error.error && error.error.data) {
        try {
          const errorData = error.error.data;
          console.log("Error signature:", errorData.substring(0, 10));
        } catch (decodeError) {
          console.log("Could not decode error data");
        }
      }
      
      throw new Error("Failed to estimate gas. This could be due to invalid parameters, contract address issues, or insufficient funds. Error details: " + (error.error?.message || error.message));
    }
    
    // Check if the error is due to insufficient funds
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error("Not enough xDAI in wallet to pay for gas and bond. Please add more xDAI to your wallet.");
    }
    
    // Re-throw the error with more context
    throw new Error(`Deployment failed: ${error.message || "Unknown error"}. Check contract addresses and parameters.`);
  }
}

// Helper function to format time durations
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  return `${Math.floor(seconds / 86400)} days`;
}
