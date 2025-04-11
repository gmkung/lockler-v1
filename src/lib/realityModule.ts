
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

  // Encode the module initialization parameters
  console.log("Encoding initialization parameters...");
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
      safeAddress,    // owner
      safeAddress,    // avatar
      safeAddress,    // executor (same as avatar)
      realityOracleAddress, // oracle address
      timeout,
      cooldown,
      expiration,
      ethers.utils.parseEther(params.bond), // convert xDAI to wei
      0,                     // templateId (will be created)
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
    const signerAddress = await signer.getAddress();
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
      gasLimit: 7000000, // Increased gas limit
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
        safeAddress
      ]);
      
      console.log("Call data length:", callData.length);
      console.log("Call data (first 100 chars):", callData.substring(0, 100) + "...");
      
      // Estimate gas using raw call instead of estimateGas for better error details
      const callResult = await provider.call({
        to: deterministicHelperAddress,
        data: callData
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

    // If we're here, the transaction succeeded. Look for events to extract the module address
    // In a real scenario, we'd parse the ProxyCreation event
    // For now, use a placeholder as a successful result
    return {
      moduleAddress: receipt.logs && receipt.logs.length > 0 ? 
        "0x" + receipt.logs[0].topics[1].substring(26) : "Success (module address not parsed)",
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
      
      throw new Error("Gas estimation failed. This could be due to invalid parameters or contract requirements not being met. Try with a lower bond amount (0.01 xDAI) or check if the Safe address is correct.");
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
      throw new Error("Transaction was submitted but reverted by the blockchain. Verify that the Safe address is correct and you have permission to deploy modules to it.");
    }
    
    // Re-throw the error with more context
    throw new Error(`Deployment failed: ${error.message || "Unknown error"}. Try using a lower bond amount (0.01 xDAI) or check if your Safe address is correct.`);
  }
}

// Helper function to format time durations
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  return `${Math.floor(seconds / 86400)} days`;
}
