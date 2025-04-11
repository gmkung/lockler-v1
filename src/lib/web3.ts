
import { ethers } from "ethers";
import { 
  CHAIN_ID, 
  CHAIN_NAME, 
  RPC_URL, 
  SAFE_PROXY_FACTORY_ADDRESS, 
  SAFE_SINGLETON_ADDRESS,
  FALLBACK_HANDLER_ADDRESS 
} from "./constants";

// ABI for SafeProxyFactory contract's createProxyWithNonce function
export const SAFE_PROXY_FACTORY_ABI = [
  "function createProxyWithNonce(address singleton, bytes memory initializer, uint256 saltNonce) public returns (address proxy)",
  "event ProxyCreation(address indexed proxy, address singleton)"
];

// ABI fragment for Gnosis Safe setup function
export const SAFE_SETUP_ABI = [
  "function setup(address[] calldata _owners, uint256 _threshold, address to, bytes calldata data, address fallbackHandler, address paymentToken, uint256 payment, address payable paymentReceiver) external"
];

// Connect to provider
export const getProvider = () => {
  if (window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  // Fallback to read-only provider
  return new ethers.providers.JsonRpcProvider(RPC_URL);
};

// Connect wallet and ensure correct chain
export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error("Metamask not detected! Please install Metamask extension.");
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  
  // Request accounts
  await provider.send("eth_requestAccounts", []);
  
  // Check if we're on the correct chain
  const network = await provider.getNetwork();
  if (network.chainId !== CHAIN_ID) {
    try {
      // Try to switch to Gnosis Chain
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
      });
    } catch (error) {
      // If the chain is not added to MetaMask, let's add it
      if (error.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${CHAIN_ID.toString(16)}`,
              chainName: CHAIN_NAME,
              nativeCurrency: {
                name: "xDAI",
                symbol: "xDAI",
                decimals: 18,
              },
              rpcUrls: [RPC_URL],
              blockExplorerUrls: ["https://gnosisscan.io/"],
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
  const safeInterface = new ethers.utils.Interface(SAFE_SETUP_ABI);
  
  return safeInterface.encodeFunctionData("setup", [
    owners,
    threshold,
    ethers.constants.AddressZero, // to
    "0x", // data
    fallbackHandler, // fallbackHandler
    ethers.constants.AddressZero, // paymentToken
    0, // payment
    ethers.constants.AddressZero, // paymentReceiver
  ]);
};

// Deploy a new Safe via factory
export const deploySafe = async (
  signer: ethers.Signer,
  owners: string[],
  threshold: number,
  fallbackHandler: string,
  saltNonce: string
) => {
  const factory = new ethers.Contract(
    SAFE_PROXY_FACTORY_ADDRESS,
    SAFE_PROXY_FACTORY_ABI,
    signer
  );
  
  const initializer = createSafeSetupInitializer(owners, threshold, fallbackHandler);
  
  console.log("Deploying Safe with:", {
    owners,
    threshold,
    fallbackHandler,
    saltNonce: saltNonce
  });
  
  const tx = await factory.createProxyWithNonce(
    SAFE_SINGLETON_ADDRESS,
    initializer,
    saltNonce
  );
  
  console.log("Transaction sent:", tx.hash);
  const receipt = await tx.wait();
  console.log("Transaction confirmed:", receipt);
  
  // Extract the deployed Safe address from events
  // Find ProxyCreation event which has the proxy address as the first indexed parameter
  const proxyCreationEvent = receipt.events?.find(
    (event) => event.event === "ProxyCreation"
  );
  
  // If we found the event, extract the proxy address from its args
  if (proxyCreationEvent && proxyCreationEvent.args) {
    // The proxy address is the first argument in the ProxyCreation event
    const safeAddress = proxyCreationEvent.args.proxy;
    console.log("Safe deployed at address:", safeAddress);
    return safeAddress;
  }
  
  // If we couldn't find the event or extract the address, look at the logs directly
  for (const log of receipt.logs || []) {
    // Check if this log is from our factory contract
    if (log.address.toLowerCase() === SAFE_PROXY_FACTORY_ADDRESS.toLowerCase()) {
      try {
        // Try to parse the log as a ProxyCreation event
        const parsedLog = factory.interface.parseLog(log);
        if (parsedLog.name === "ProxyCreation") {
          const safeAddress = parsedLog.args.proxy;
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

// Add typings for window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}
