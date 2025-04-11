
import { ethers } from "ethers";
import { REALITY_MODULE_CONTRACTS } from "./constants";

// Helper function to ensure addresses have correct checksum
function toChecksumAddress(address: string): string {
  try {
    return ethers.utils.getAddress(address);
  } catch (error) {
    console.error(`Invalid address format: ${address}`);
    throw new Error(`Invalid address format: ${address}`);
  }
}

// Debug function to verify contract existence
async function verifyContractExists(provider: ethers.providers.Provider, address: string, name: string): Promise<boolean> {
  try {
    const code = await provider.getCode(address);
    const exists = code !== '0x';
    console.log(`${name} contract at ${address}: ${exists ? 'Exists' : 'Does NOT exist'} (code length: ${code.length})`);
    return exists;
  } catch (error) {
    console.error(`Error checking contract existence for ${name}:`, error);
    return false;
  }
}

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

  const provider = signer.provider;
  if (!provider) {
    throw new Error("No provider available");
  }

  // Log the signer address we're using
  const signerAddress = await signer.getAddress();
  console.log(`Using signer: ${signerAddress}`);

  // Ensure all contract addresses have correct checksums
  const deterministicHelperAddress = toChecksumAddress(REALITY_MODULE_CONTRACTS.DETERMINISTIC_DEPLOYMENT_HELPER);
  const moduleProxyFactoryAddress = toChecksumAddress(REALITY_MODULE_CONTRACTS.MODULE_PROXY_FACTORY);
  const realityModuleMasterCopyAddress = toChecksumAddress(REALITY_MODULE_CONTRACTS.REALITY_MODULE_MASTER_COPY);
  const realityOracleAddress = toChecksumAddress(REALITY_MODULE_CONTRACTS.REALITY_ORACLE);
  const klerosArbitratorAddress = toChecksumAddress(REALITY_MODULE_CONTRACTS.KLEROS_ARBITRATOR);
  const safeAddress = toChecksumAddress(params.safeAddress);

  // Verify all required contracts exist
  console.log("Verifying contract existence...");
  
  const helperExists = await verifyContractExists(provider, deterministicHelperAddress, "Deterministic Helper");
  const factoryExists = await verifyContractExists(provider, moduleProxyFactoryAddress, "Module Proxy Factory");
  const masterCopyExists = await verifyContractExists(provider, realityModuleMasterCopyAddress, "Reality Module Master Copy");
  const oracleExists = await verifyContractExists(provider, realityOracleAddress, "Reality Oracle");
  const arbitratorExists = await verifyContractExists(provider, klerosArbitratorAddress, "Kleros Arbitrator");
  const safeExists = await verifyContractExists(provider, safeAddress, "Safe");
  
  if (!helperExists || !factoryExists || !masterCopyExists || !oracleExists || !arbitratorExists) {
    throw new Error("One or more required contracts do not exist. Check console logs for details.");
  }

  if (!safeExists) {
    console.warn("WARNING: Safe contract at the provided address may not exist or may be a different contract type.");
  }

  // Log checksummed addresses for verification
  console.log("Using checksummed addresses:", {
    deterministicHelper: deterministicHelperAddress,
    moduleProxyFactory: moduleProxyFactoryAddress,
    realityModuleMaster: realityModuleMasterCopyAddress,
    realityOracle: realityOracleAddress,
    arbitrator: klerosArbitratorAddress,
    safe: safeAddress
  });

  // Connect to Deterministic Deployment Helper contract
  const deterministicHelper = new ethers.Contract(
    deterministicHelperAddress,
    [
      'function deployWithEncodedParams(address factory, address masterCopy, bytes initParams, uint256 saltNonce, address realityOracle, string templateContent, address finalModuleOwner) returns (address)'
    ],
    signer
  );

  // Parse timeout, cooldown, expiration to ensure they're valid numbers
  const timeout = parseInt(params.timeout);
  const cooldown = parseInt(params.cooldown);
  const expiration = parseInt(params.expiration);
  
  if (isNaN(timeout) || isNaN(cooldown) || isNaN(expiration)) {
    throw new Error("Invalid parameters: timeout, cooldown, and expiration must be valid numbers");
  }

  // CRITICAL FIX: Based on the contract code, the owner in the initParams must be set to the 
  // DeterministicDeploymentHelper contract address, not the Safe address
  
  console.log("Encoding initialization parameters with HELPER as initial owner...");
  const initParams = ethers.utils.defaultAbiCoder.encode(
    [
      'address',  // owner - MUST BE HELPER CONTRACT ADDRESS
      'address',  // avatar
      'address',  // executor
      'address',  // oracle
      'uint32',   // timeout
      'uint32',   // cooldown
      'uint32',   // expiration
      'uint256',  // bond
      'uint256',  // templateId - MUST BE 0
      'address'   // arbitrator
    ],
    [
      deterministicHelperAddress, // CRITICAL: owner must be helper contract initially
      safeAddress,    // avatar
      safeAddress,    // executor (same as avatar)
      realityOracleAddress, // oracle address
      timeout,
      cooldown,
      expiration,
      ethers.utils.parseEther(params.bond), // convert xDAI to wei
      0,              // templateId MUST be 0 initially
      klerosArbitratorAddress
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
    safeAddress: safeAddress,
    timeout: timeout,
    cooldown: cooldown,
    expiration: expiration,
    bond: params.bond,
    templateQuestion: params.templateQuestion
  });

  // Generate a unique salt nonce (use timestamp + random number for extra randomness)
  const saltNonce = Date.now().toString() + Math.floor(Math.random() * 1000000);
  console.log("Using salt nonce:", saltNonce);

  try {
    // Check if the signer has enough balance
    const balance = await signer.provider?.getBalance(signerAddress);
    console.log(`Signer address: ${signerAddress}, Balance: ${ethers.utils.formatEther(balance || '0')} xDAI`);

    // Check minimum required balance (estimate: gas cost + bond)
    const bondInWei = ethers.utils.parseEther(params.bond);
    const estimatedGasCost = ethers.utils.parseEther("0.1"); // Estimate 0.1 xDAI for gas
    const minimumRequired = bondInWei.add(estimatedGasCost);
    
    if (balance && balance.lt(minimumRequired)) {
      throw new Error(`Insufficient balance: You have ${ethers.utils.formatEther(balance)} xDAI but need approximately ${ethers.utils.formatEther(minimumRequired)} xDAI (${params.bond} xDAI bond + gas fees)`);
    }

    // Set up transaction options with manual gas limit and higher gas price
    const gasPrice = await signer.provider?.getGasPrice();
    const adjustedGasPrice = gasPrice ? gasPrice.mul(150).div(100) : undefined; // 50% higher
    
    const options = {
      gasLimit: 8000000, // Increased gas limit further
      gasPrice: adjustedGasPrice
    };

    console.log("Transaction options:", {
      gasLimit: options.gasLimit,
      gasPrice: adjustedGasPrice ? ethers.utils.formatUnits(adjustedGasPrice, 'gwei') + ' gwei' : 'default'
    });

    // Try a dry-run of the transaction (more detailed error handling)
    console.log("Attempting dry-run of transaction to identify potential issues...");
    
    try {
      // First check if we can call the helper contract
      const callData = deterministicHelper.interface.encodeFunctionData("deployWithEncodedParams", [
        moduleProxyFactoryAddress,
        realityModuleMasterCopyAddress,
        initParams,
        saltNonce,
        realityOracleAddress,
        templateContent,
        safeAddress  // Final module owner will be the Safe
      ]);
      
      console.log("Call data length:", callData.length);
      console.log("Call data (first 100 chars):", callData.substring(0, 100) + "...");
      
      // Detailed debug info about parameters
      console.log("Parameter values:", {
        moduleProxyFactory: moduleProxyFactoryAddress,
        masterCopy: realityModuleMasterCopyAddress,
        initParamsLength: initParams.length,
        saltNonce: saltNonce,
        realityOracle: realityOracleAddress,
        templateContent: templateContent,
        finalOwner: safeAddress
      });
      
      // Estimate gas using raw call instead of estimateGas for better error details
      const callResult = await provider.call({
        to: deterministicHelperAddress,
        data: callData,
        from: signerAddress // Add from address to simulate the call exactly
      });
      
      console.log("Dry-run successful, result:", callResult);
    } catch (callError: any) {
      console.error("Dry-run failed:", callError);
      
      // Try to decode the error reason
      if (callError.data) {
        try {
          const decodedError = ethers.utils.toUtf8String('0x' + callError.data.substring(138));
          console.log("Decoded error reason:", decodedError);
          throw new Error(`Contract call would fail: ${decodedError}`);
        } catch (decodeError) {
          // If we can't decode, continue with deployment but warn the user
          console.log("Could not decode error reason, proceeding with actual deployment");
        }
      }
    }

    console.log("Sending transaction...");
    // Deploy the module
    const tx = await deterministicHelper.deployWithEncodedParams(
      moduleProxyFactoryAddress,
      realityModuleMasterCopyAddress,
      initParams,
      saltNonce,
      realityOracleAddress,
      templateContent,
      safeAddress,  // final owner (the Safe)
      options
    );

    console.log("Transaction sent:", tx.hash);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);

    // Check if the transaction was successful
    if (receipt.status === 0) {
      throw new Error("Transaction failed. Check contract addresses and parameters.");
    }

    console.log("Transaction succeeded! Looking for module address in logs...");
    
    // Try to extract the module address from logs 
    let moduleAddress = null;
    
    // Look specifically for the ModuleProxyCreation event
    for (const log of receipt.logs) {
      console.log(`Log address: ${log.address}, Topics length: ${log.topics.length}`);
      
      // The ModuleProxyCreation event has 2 indexed parameters (proxy and masterCopy)
      if (log.topics.length === 3) {
        const proxyAddress = "0x" + log.topics[1].substring(26);
        console.log(`Potential module address found: ${proxyAddress}`);
        moduleAddress = proxyAddress;
        break;
      }
    }
    
    if (!moduleAddress) {
      console.log("Could not find module address in logs, but transaction was successful");
      moduleAddress = "Success (module address not extracted from logs)";
    }
    
    return {
      moduleAddress,
      txHash: tx.hash
    };
  } catch (error: any) {
    console.error("Error deploying Reality Module:", error);
    
    // Enhanced error handling with specific user-friendly messages
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      console.log("Transaction data details:", {
        initParamsLength: initParams.length,
        templateContentLength: templateContent.length
      });
      
      throw new Error("Gas estimation failed. Try with an even lower bond amount (0.001 xDAI) or check if the Safe address is correct.");
    }
    
    // Check if the error is due to insufficient funds
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error("Not enough xDAI in wallet to pay for gas and bond. Please add more xDAI to your wallet.");
    }
    
    // Check if error is related to address checksum
    if (error.message && error.message.includes("bad address checksum")) {
      throw new Error("Address checksum validation failed. Please verify all contract addresses are correct. Error: " + error.message);
    }
    
    // Check if transaction was reverted
    if (error.receipt?.status === 0) {
      throw new Error("Transaction was submitted but reverted by the blockchain. The helper contract might not have permission to deploy modules to this Safe, or the Safe address may be incorrect.");
    }
    
    // Re-throw the error with more context
    throw new Error(`Deployment failed: ${error.message || "Unknown error"}. Try using a much lower bond amount (0.001 xDAI).`);
  }
}

// Helper function to format time durations
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  return `${Math.floor(seconds / 86400)} days`;
}
