
// Gnosis Chain-specific constants
export const CHAIN_ID = 100;
export const CHAIN_NAME = "Gnosis Chain";
export const RPC_URL = "https://gnosis-rpc.publicnode.com";

// Safe contract addresses on Gnosis Chain
export const SAFE_PROXY_FACTORY_ADDRESS = "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67";
export const SAFE_SINGLETON_ADDRESS = "0x41675C099F32341bf84BFc5382aF534df5C7461a";
export const FALLBACK_HANDLER_ADDRESS = "0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99";

// Reality Module constants
export const DEFAULT_BOND = "0.0001"; // Further reduced bond amount to 0.0001 xDAI for testing

// Reality Module contract addresses - using checksummed addresses
export const REALITY_MODULE_CONTRACTS = {
  // Deterministic Deployment Helper - verified address on Gnosis Chain
  DETERMINISTIC_DEPLOYMENT_HELPER: "0x0961F418E0B6efaA073004989EF1B2fd1bc4a41c",
  
  // Module Proxy Factory - official verified address
  MODULE_PROXY_FACTORY: "0x000000000000aDdB49795b0f9bA5BC298cDda236",
  
  // Reality Module Master Copy - verified implementation
  REALITY_MODULE_MASTER_COPY: "0xAba53Da6b68DA1D4FB00419691dCe6518E7fBd58", // 0xAba53Da6b68DA1D4FB00419691dCe6518E7fBd58 is a copy made from bytecode from ETH, so we still need a proper master copy some day.
  
  // Reality Oracle - official Reality.eth oracle on Gnosis Chain
  REALITY_ORACLE: "0xE78996A233895bE74a66F451f1019cA9734205cc",
  
  // Kleros Arbitrator - verified Kleros address on Gnosis Chain
  KLEROS_ARBITRATOR: "0x29F39dE98D750eb77b5FAfb31B2837f079FcE222"
};

// Reality Module default parameters - reduced for easier testing
export const REALITY_MODULE_DEFAULTS = {
  BOND: "0.0001", // Reduced to 0.0001 xDAI for easier testing
  TIMEOUT: "86400",      // 1 day in seconds
  COOLDOWN: "86400",     // 1 day in seconds
  EXPIRATION: "604800",  // 7 days in seconds
  TEMPLATE_QUESTION: "Should the proposal referenced by the ID in the transaction data be executed?"
};

// Useful defaults
export const DEFAULT_THRESHOLD = 1;
export const DEFAULT_SALT_NONCE = "123456789";
