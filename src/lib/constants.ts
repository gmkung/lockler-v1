import { Chain } from "./types";

// Chain configurations
export const SUPPORTED_CHAINS = {
  MAINNET: 1,
  GNOSIS: 100,
} as const;

// Chain-specific configurations
export const CHAIN_CONFIG: Record<number, Chain> = {
  [SUPPORTED_CHAINS.MAINNET]: {
    id: SUPPORTED_CHAINS.MAINNET,
    name: "Ethereum Mainnet",
    rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/your-api-key",
    blockExplorer: "https://etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    contracts: {
      safeProxyFactory: "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67", //verified
      safeSingleton: "0x41675C099F32341bf84BFc5382aF534df5C7461a", //Verified
      fallbackHandler: "0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99", //Verified
      moduleProxyFactory: "0x000000000000aDdB49795b0f9bA5BC298cDda236", //Verified
      realityMasterCopy: "0x4e35DA39Fa5893a70A40Ce964F993d891E607cC0", //Verified
      ddhAddress: "0x0961F418E0B6efaA073004989EF1B2fd1bc4a41c", //Verified
      safeMultisend: "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D", //Verified
      defaultOracle: "0x5b7dD1E86623548AF054A4985F7fc8Ccbb554E2c", //Verified
      defaultArbitrator: "0xf72CfD1B34a91A64f9A98537fe63FBaB7530AdcA", //Verified
    },
  },
  [SUPPORTED_CHAINS.GNOSIS]: {
    id: SUPPORTED_CHAINS.GNOSIS,
    name: "Gnosis Chain",
    rpcUrl: "https://gnosis-rpc.publicnode.com",
    blockExplorer: "https://gnosisscan.io",
    nativeCurrency: {
      name: "xDAI",
      symbol: "xDAI",
      decimals: 18,
    },
    contracts: {
      safeProxyFactory: "0x4e1dcf7ad4e460cfd30791ccc4f9c8a4f820ec67", //verified
      safeSingleton: "0x41675C099F32341bf84BFc5382aF534df5C7461a", //verified
      fallbackHandler: "0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99", //Verified
      moduleProxyFactory: "0x000000000000aDdB49795b0f9bA5BC298cDda236",
      realityMasterCopy: "0x4e35DA39Fa5893a70A40Ce964F993d891E607cC0",
      ddhAddress: "0x0961F418E0B6efaA073004989EF1B2fd1bc4a41c",
      safeMultisend: "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D",
      defaultOracle: "0x5b7dD1E86623548AF054A4985F7fc8Ccbb554E2c",
      defaultArbitrator: "0xf72CfD1B34a91A64f9A98537fe63FBaB7530AdcA",
    },
  },
};

// Default chain
export const DEFAULT_CHAIN_ID = SUPPORTED_CHAINS.MAINNET;

// Chain-agnostic constants
export const DEFAULT_THRESHOLD = 1;
export const DEFAULT_SALT_NONCE = Date.now().toString();
export const DEFAULT_BOND = "0.1";
export const DEFAULT_TIMEOUTS = {
  TIMEOUT: 180, // 3 minutes
  COOLDOWN: 120, // 2 minutes
  EXPIRATION: 300, // 5 minutes
} as const;

// Helper functions to get chain-specific values
export const getChainConfig = (chainId: number = DEFAULT_CHAIN_ID): Chain => {
  const config = CHAIN_CONFIG[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return config;
};

// Export commonly used getters
export const getContractAddresses = (chainId: number = DEFAULT_CHAIN_ID) => {
  return getChainConfig(chainId).contracts;
};

export const getRpcUrl = (chainId: number = DEFAULT_CHAIN_ID) => {
  return getChainConfig(chainId).rpcUrl;
};

export const getBlockExplorer = (chainId: number = DEFAULT_CHAIN_ID) => {
  return getChainConfig(chainId).blockExplorer;
};

export const TOKENS = {
  NATIVE: {
    address: "0x0000000000000000000000000000000000000000",
    symbol: "ETH",
    decimals: 18,
  },
  USDC: {
    [DEFAULT_CHAIN_ID]: {
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum Mainnet
      symbol: "USDC",
      decimals: 6,
    },
    [SUPPORTED_CHAINS.GNOSIS]: {
      address: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83", // Gnosis Chain
      symbol: "USDC",
      decimals: 6,
    },
  },
  PNK: {
    [DEFAULT_CHAIN_ID]: {
      address: "0x93ED3FBe21207Ec2E8f2d3c3de6e058Cb73Bc04d", // Ethereum Mainnet
      symbol: "PNK",
      decimals: 18,
    },
  },
};
