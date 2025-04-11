
// Gnosis Chain-specific constants
export const CHAIN_ID = 100;
export const CHAIN_NAME = "Gnosis Chain";
export const RPC_URL = "https://gnosis-rpc.publicnode.com";

// Safe contract addresses on Gnosis Chain
export const SAFE_PROXY_FACTORY_ADDRESS = "0x4e1dcf7ad4e460cfd30791ccc4f9c8a4f820ec67";
export const SAFE_SINGLETON_ADDRESS = "0x41675C099F32341bf84BFc5382aF534df5C7461a";
export const FALLBACK_HANDLER_ADDRESS = "0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99";

// Reality Module constants
export const DEFAULT_BOND = "0.1"; // Default bond amount in xDAI

// Reality Module contract addresses
export const REALITY_MODULE_CONTRACTS = {
  // Deterministic Deployment Helper - verified working contract on Gnosis Chain
  DETERMINISTIC_DEPLOYMENT_HELPER: "0x0961F418E0B6efaA073004989EF1B2fd1bc4a41c",
  
  // Module Proxy Factory - verified working contract
  MODULE_PROXY_FACTORY: "0x000000000000aDdB49795b0f9bA5BC298cDda236",
  
  // Reality Module Master Copy - UPDATED to use actual Reality Module implementation
  REALITY_MODULE_MASTER_COPY: "0x25CE2252E10D1A908bE3E45CF352c8F89596ffAE",
  
  // Reality Oracle - official Reality.eth oracle on Gnosis Chain
  REALITY_ORACLE: "0xE78996A233895bE74a66F451f1019cA9734205cc",
  
  // Kleros Arbitrator - confirmed working Kleros address on Gnosis Chain
  KLEROS_ARBITRATOR: "0x29f39de98d750eb77b5fafb31b2837f079fce222"
};

// Reality Module default parameters
export const REALITY_MODULE_DEFAULTS = {
  BOND: "1", // Reduced to 1 xDAI to make testing easier
  TIMEOUT: "172800",      // 2 days in seconds
  COOLDOWN: "172800",     // 2 days in seconds
  EXPIRATION: "604800",   // 7 days in seconds
  TEMPLATE_QUESTION: "Should the proposal referenced by the ID in the transaction data be executed?"
};

// Useful defaults
export const DEFAULT_THRESHOLD = 1;
export const DEFAULT_SALT_NONCE = "123456789";
