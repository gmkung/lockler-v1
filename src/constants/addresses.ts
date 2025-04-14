export const MODULE_PROXY_FACTORY = '0x000000000000aDdB49795b0f9bA5BC298cDda236';
export const REALITY_MASTER_COPY = '0x4e35DA39Fa5893a70A40Ce964F993d891E607cC0';
export const DDH_ADDRESS = '0x0961F418E0B6efaA073004989EF1B2fd1bc4a41c';
export const SAFE_MULTISEND = '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D';
export const DEFAULT_ORACLE = '0x5b7dD1E86623548AF054A4985F7fc8Ccbb554E2c';
export const DEFAULT_ARBITRATOR = '0xf72CfD1B34a91A64f9A98537fe63FBaB7530AdcA';

export const DEFAULT_TEMPLATE_CONTENT = "What is the outcome of this event? Answer with 0 for no, 1 for yes, or 2 for unknown.";

export const DEFAULT_TIMEOUTS = {
    TIMEOUT: 172800, // 2 days in seconds
    COOLDOWN: 172800, // 2 days in seconds
    EXPIRATION: 604800, // 7 days in seconds
} as const;

export const DEFAULT_BOND = '0.1'; // in ETH 