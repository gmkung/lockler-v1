import { ethers, parseUnits, formatUnits } from 'ethers';
import { TOKENS, CHAIN_CONFIG, SUPPORTED_CHAINS } from './constants';

export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

/**
 * Get token information for a given token address and chain ID
 */
export function getTokenInfo(tokenAddress: string, chainId: number): TokenInfo {
  // Normalize the token address for comparison
  const normalizedAddress = tokenAddress.toLowerCase();

  // Check if it's the native token
  if (normalizedAddress === TOKENS.NATIVE.address.toLowerCase()) {
    const chainConfig = CHAIN_CONFIG[chainId];
    return {
      address: TOKENS.NATIVE.address,
      symbol: chainConfig?.nativeCurrency?.symbol || TOKENS.NATIVE.symbol,
      decimals: chainConfig?.nativeCurrency?.decimals || TOKENS.NATIVE.decimals
    };
  }

  // Check all token configurations for the given chain
  for (const [_, tokenConfig] of Object.entries(TOKENS)) {
    if (typeof tokenConfig === 'object' && tokenConfig !== null) {
      const chainSpecificToken = tokenConfig[chainId as keyof typeof tokenConfig] as TokenInfo;
      if (chainSpecificToken && 
          typeof chainSpecificToken === 'object' && 
          'address' in chainSpecificToken && 
          chainSpecificToken.address.toLowerCase() === normalizedAddress) {
        return chainSpecificToken;
      }
    }
  }

  // Default to 18 decimals for unknown tokens
  return {
    address: tokenAddress,
    symbol: 'UNKNOWN',
    decimals: 18
  };
}

/**
 * Convert an amount from its decimal representation to minor units (wei)
 */
export function toMinorUnits(amount: string, tokenAddress: string, chainId: number): string {
  try {
    const { decimals } = getTokenInfo(tokenAddress, chainId);
    return parseUnits(amount, decimals).toString();
  } catch (e) {
    console.error('Error converting to minor units:', e);
    return '0';
  }
}

/**
 * Convert an amount from minor units (wei) to its decimal representation
 */
export function fromMinorUnits(amount: string, tokenAddress: string, chainId: number): string {
  try {
    const { decimals } = getTokenInfo(tokenAddress, chainId);
    return formatUnits(amount, decimals);
  } catch (e) {
    console.error('Error converting from minor units:', e);
    return '0';
  }
}

/**
 * Format an amount with its symbol
 */
export function formatAmount(amount: string, tokenAddress: string, chainId: number): string {
  try {
    const { symbol, decimals } = getTokenInfo(tokenAddress, chainId);
    return `${formatUnits(amount, decimals)} ${symbol}`;
  } catch (e) {
    console.error('Error formatting amount:', e);
    return `${amount} UNKNOWN`;
  }
}

/**
 * Get the step value for input fields based on token decimals
 */
export function getInputStep(tokenAddress: string, chainId: number): string {
  const { decimals } = getTokenInfo(tokenAddress, chainId);
  return `0.${'0'.repeat(decimals - 1)}1`;
}

/**
 * Get all available tokens for a chain
 */
export function getAvailableTokens(chainId: number): TokenInfo[] {
  const tokens: TokenInfo[] = [];
  
  // Add native token from chain config
  const chainConfig = CHAIN_CONFIG[chainId];
  if (chainConfig?.nativeCurrency) {
    tokens.push({
      address: TOKENS.NATIVE.address,
      symbol: chainConfig.nativeCurrency.symbol,
      decimals: chainConfig.nativeCurrency.decimals
    });
  }

  // Add all other tokens configured for this chain
  Object.entries(TOKENS).forEach(([_, tokenConfig]) => {
    if (typeof tokenConfig === 'object' && tokenConfig !== null) {
      const chainSpecificToken = tokenConfig[chainId as keyof typeof tokenConfig] as TokenInfo;
      if (chainSpecificToken && 
          typeof chainSpecificToken === 'object' && 
          'address' in chainSpecificToken && 
          chainSpecificToken.address !== TOKENS.NATIVE.address) {
        tokens.push(chainSpecificToken);
      }
    }
  });

  return tokens;
} 