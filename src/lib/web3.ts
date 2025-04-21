import {
  ethers,
  JsonRpcProvider,
  BrowserProvider,
  Contract,
  Interface,
  ZeroAddress,
  Signer,
} from "ethers";
import {
  getChainConfig,
  getContractAddresses,
  getRpcUrl,
} from "./constants";
import { SAFE_ABI, MODULE_PROXY_FACTORY_ABI } from "../abis/contracts";

// ABI for SafeProxyFactory contract's createProxyWithNonce function
export const SAFE_PROXY_FACTORY_ABI = [
  "function createProxyWithNonce(address singleton, bytes memory initializer, uint256 saltNonce) public returns (address proxy)",
  "event ProxyCreation(address indexed proxy, address singleton)",
];

// ABI fragment for Gnosis Safe setup function
export const SAFE_SETUP_ABI = [
  "function setup(address[] calldata _owners, uint256 _threshold, address to, bytes calldata data, address fallbackHandler, address paymentToken, uint256 payment, address payable paymentReceiver) external",
];

// Add proxy interface
export const PROXY_ABI = [
  "function masterCopy() external view returns (address)"
];

// Connect to provider
export const getProvider = (chainId: number) => {
  if (window.ethereum) {
    return new BrowserProvider(window.ethereum);
  }
  // Fallback to read-only provider
  return new JsonRpcProvider(getRpcUrl(chainId));
};

// Connect wallet and ensure correct chain
export const connectWallet = async (chainId: number) => {
  if (!window.ethereum) {
    throw new Error(
      "Metamask not detected! Please install Metamask extension."
    );
  }

  const provider = new BrowserProvider(window.ethereum);

  // Request accounts
  await provider.send("eth_requestAccounts", []);

  // Check if we're on the correct chain
  const network = await provider.getNetwork();
  if (network.chainId !== BigInt(chainId)) {
    try {
      // Try to switch to the correct chain
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error) {
      // If the chain is not added to MetaMask, let's add it
      if (error.code === 4902) {
        const chainConfig = getChainConfig(chainId);
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${chainId.toString(16)}`,
              chainName: chainConfig.name,
              nativeCurrency: chainConfig.nativeCurrency,
              rpcUrls: [chainConfig.rpcUrl],
              blockExplorerUrls: [chainConfig.blockExplorer],
            },
          ],
        });
      } else {
        throw error;
      }
    }
  }

  return provider.getSigner();
};

// Create Safe setup initializer payload
export const createSafeSetupInitializer = (
  owners: string[],
  threshold: number,
  fallbackHandler: string
) => {
  const safeInterface = new Interface(SAFE_SETUP_ABI);

  return safeInterface.encodeFunctionData("setup", [
    owners,
    threshold,
    ZeroAddress, // to
    "0x", // data
    fallbackHandler, // fallbackHandler
    ZeroAddress, // paymentToken
    0, // payment
    ZeroAddress, // paymentReceiver
  ]);
};

// Deploy a new Safe via factory
export const deploySafe = async (
  signer: Signer,
  owners: string[],
  threshold: number,
  fallbackHandler: string,
  saltNonce: string,
  chainId: number
) => {
  const contractAddresses = getContractAddresses(chainId);
  const factory = new Contract(
    contractAddresses.safeProxyFactory,
    SAFE_PROXY_FACTORY_ABI,
    signer
  );

  const initializer = createSafeSetupInitializer(
    owners,
    threshold,
    fallbackHandler
  );

  console.log("Deploying Safe with:", {
    owners,
    threshold,
    fallbackHandler,
    saltNonce: saltNonce,
    chainId
  });

  const tx = await factory.createProxyWithNonce(
    contractAddresses.safeSingleton,
    initializer,
    saltNonce
  );

  console.log("Transaction sent:", tx.hash);
  const receipt = await tx.wait();
  console.log("Transaction confirmed:", receipt);

  // Extract the deployed Safe address from events
  // Find ProxyCreation event which has the proxy address as the first indexed parameter
  const proxyCreationEvent = receipt.logs?.find(
    (event) => event.fragment?.name === "ProxyCreation"
  );

  // If we found the event, extract the proxy address from its args
  if (proxyCreationEvent && proxyCreationEvent.args) {
    // The proxy address is the first argument in the ProxyCreation event
    const safeAddress = proxyCreationEvent.args[0];
    console.log("Safe deployed at address:", safeAddress);
    return safeAddress;
  }

  // If we couldn't find the event or extract the address, look at the logs directly
  for (const log of receipt.logs || []) {
    // Check if this log is from our factory contract
    if (
      log.address.toLowerCase() ===
      contractAddresses.safeProxyFactory.toLowerCase()
    ) {
      try {
        // Try to parse the log as a ProxyCreation event
        const parsedLog = factory.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });
        if (parsedLog?.name === "ProxyCreation") {
          const safeAddress = parsedLog.args[0];
          console.log("Safe deployed at address (from logs):", safeAddress);
          return safeAddress;
        }
      } catch (error) {
        console.error("Error parsing log:", error);
      }
    }
  }

  console.error("Could not extract Safe address from transaction receipt");
  return null;
};

export async function getRealityModulesForSafe(
  provider: JsonRpcProvider | BrowserProvider,
  safeAddress: string,
  chainId: number
): Promise<{
  address: string;
  isEnabled: boolean;
  isRealityModule: boolean;
  templateId: string;
  oracle: string;
  validationChecks: {
    isMinimalProxy: boolean;
    implementationMatches: boolean;
    isOwner: boolean;
    hasValidThreshold: boolean;
    hasValidOwnerCount: boolean;
    isOnlyEnabledModule: boolean;
  };
}[]> {
  console.log("Getting Reality Modules for Safe with chainId:", chainId);
  
  // Validate chain ID
  if (!chainId) {
    console.error("Invalid chain ID provided:", chainId);
    throw new Error("Invalid chain ID");
  }

  const contracts = getContractAddresses(chainId);
  console.log("Using contract addresses for chainId:", chainId, contracts);
  
  // First check if the Safe exists
  console.log("Checking if Safe exists at:", safeAddress);
  try {
    const code = await provider.getCode(safeAddress);
    console.log("Safe code length:", code.length);
    if (code === '0x' || !code) {
      console.error("Safe does not exist on this chain");
      throw new Error("Safe does not exist on chain " + chainId);
    }
  } catch (error) {
    console.error("Failed to check if Safe exists:", error);
    throw error;
  }
  
  // First verify that this is a valid Safe proxy
  console.log("Verifying Safe proxy at address:", safeAddress);
  
  // Use masterCopy() function to verify Safe proxy
  const MASTER_COPY_ABI = ["function masterCopy() external view returns (address)"];
  const safeProxy = new Contract(safeAddress, MASTER_COPY_ABI, provider);
  
  try {
    console.log("Calling masterCopy() function...");
    const implementationAddress = await safeProxy.masterCopy();
    console.log("Implementation address from masterCopy():", implementationAddress);
    console.log("Expected singleton address:", contracts.safeSingleton);
    
    const implementationCode = await provider.getCode(implementationAddress);
    const singletonCode = await provider.getCode(contracts.safeSingleton);
    
    console.log("Implementation code length:", implementationCode.length);
    console.log("Singleton code length:", singletonCode.length);
    console.log("Implementation matches singleton:", implementationCode === singletonCode);
    
    if (implementationCode !== singletonCode) {
      console.log("Implementation mismatch - not pointing to correct Safe singleton");
      throw new Error("Safe implementation does not match expected singleton");
    }
    
    console.log("Safe proxy verification successful");
  } catch (error) {
    console.log("Failed to verify Safe proxy:", error);
    throw new Error("Invalid Safe proxy address");
  }
  
  const safe = new Contract(safeAddress, SAFE_ABI, provider);
  
  const PAGE_SIZE = 10;
  const modules: {
    address: string;
    isEnabled: boolean;
    isRealityModule: boolean;
    templateId: string;
    oracle: string;
    validationChecks: {
      isMinimalProxy: boolean;
      implementationMatches: boolean;
      isOwner: boolean;
      hasValidThreshold: boolean;
      hasValidOwnerCount: boolean;
      isOnlyEnabledModule: boolean;
    };
  }[] = [];
  let hasMore = true;
  let start = "0x0000000000000000000000000000000000000001"; // SENTINEL_MODULES

  // Get Safe threshold and owners
  const threshold = await safe.getThreshold();
  console.log("Safe threshold:", threshold.toString());
  
  const owners = await safe.getOwners();
  console.log("Safe owners:", owners);
  console.log("Number of owners:", owners.length);

  // Check if threshold and owner count are valid
  const hasValidThreshold = threshold.toString() === "2";
  const hasValidOwnerCount = owners.length <= 3;
  console.log("Has valid threshold:", hasValidThreshold);
  console.log("Has valid owner count:", hasValidOwnerCount);

  // Keep track of enabled modules count
  let enabledModulesCount = 0;

  // ABI for Reality Module
  const REALITY_MODULE_ABI = [
    "function template() view returns (uint256)",
    "function oracle() view returns (address)"
  ];

  while (hasMore) {
    try {
      const [array, next] = await safe.getModulesPaginated(start, PAGE_SIZE);
      
      // Check enablement and Reality Module status for each module
      for (const address of array) {
        let isEnabled = false;
        let isRealityModule = false;
        let isMinimalProxy = false;
        let implementationMatches = false;
        let isOwner = false;
        let templateId = "0";
        let oracle = "0x0000000000000000000000000000000000000000";

        try {
          isEnabled = await safe.isModuleEnabled(address);
          if (isEnabled) {
            enabledModulesCount++;
            console.log("Checking module:", address);
            const bytecode = await provider.getCode(address);
            
            // Check for EIP-1167 minimal proxy pattern
            const prefix = "0x363d3d373d3d3d363d73";
            const suffix = "5af43d82803e903d91602b57fd5bf3";
            
            isMinimalProxy = bytecode.startsWith(prefix) && bytecode.endsWith(suffix);
            
            if (isMinimalProxy) {
              const implementationAddress = ethers.getAddress("0x" + bytecode.slice(prefix.length, prefix.length + 40));
              console.log("Implementation address:", implementationAddress);
              console.log("Against master copy:", contracts.realityMasterCopy);
              
              // Compare implementation bytecode with master copy
              const implementationCode = await provider.getCode(implementationAddress);
              const masterCode = await provider.getCode(contracts.realityMasterCopy);
              console.log("Implementation code length:", implementationCode.length);
              console.log("Master code length:", masterCode.length);
              implementationMatches = implementationCode === masterCode;
              isRealityModule = implementationMatches;
              console.log("Is Reality Module:", isRealityModule);

              // Check if module is also an owner
              isOwner = owners.includes(address);
              console.log("Module is owner:", isOwner);

              // Get template and oracle if it's a Reality Module
              if (isRealityModule) {
                const moduleContract = new Contract(address, REALITY_MODULE_ABI, provider);
                templateId = (await moduleContract.template()).toString();
                oracle = await moduleContract.oracle();
                console.log("Template ID:", templateId);
                console.log("Oracle:", oracle);
              }
            } else {
              console.log("Not a minimal proxy or pattern not recognized");
            }
          }
        } catch (error) {
          console.error("Error checking module:", error);
        }

        modules.push({
          address,
          isEnabled,
          isRealityModule,
          templateId,
          oracle,
          validationChecks: {
            isMinimalProxy,
            implementationMatches,
            isOwner,
            hasValidThreshold,
            hasValidOwnerCount,
            isOnlyEnabledModule: false // Will be updated after all modules are processed
          }
        });
      }

      start = next;
      hasMore = next !== "0x0000000000000000000000000000000000000001" && array.length > 0;
    } catch (error) {
      console.error("Error fetching modules page:", error);
      break;
    }
  }

  // Update isOnlyEnabledModule check for all modules
  const hasValidModuleCount = enabledModulesCount === 1;
  console.log("Total enabled modules:", enabledModulesCount);
  console.log("Has valid module count:", hasValidModuleCount);

  return modules.map(module => ({
    ...module,
    validationChecks: {
      ...module.validationChecks,
      isOnlyEnabledModule: hasValidModuleCount
    }
  }));
}
