import { ethers } from 'ethers';
import { ERC20_ABI } from '@/abis/erc20';
import { ERC721_ABI } from '@/abis/erc721';
import { getTokenInfo, TokenInfo } from './currency';
import { TOKENS } from './constants';

import { ProposalTransaction, TransactionType} from '@/lib/types';



interface BaseTransactionDetails {
  type: TransactionType;
  to: string;
  value: string; // Always in minor units (wei)
}

interface NativeTransferDetails extends BaseTransactionDetails {
  type: 'native';
  tokenInfo: TokenInfo;
}

interface ERC20TransferDetails extends BaseTransactionDetails {
  type: 'erc20';
  tokenInfo: TokenInfo;
  recipient: string;
  amount: string; // Always in minor units
}

interface ERC721TransferDetails extends BaseTransactionDetails {
  type: 'erc721';
  tokenInfo: TokenInfo;
  recipient: string;
  tokenId: string;
}

interface CustomTransactionDetails extends BaseTransactionDetails {
  type: 'custom';
  data: string;
  decodedCalldata?: {
    functionName: string;
    params: string[];
  };
}

export type TransactionDetails = 
  | NativeTransferDetails 
  | ERC20TransferDetails 
  | ERC721TransferDetails 
  | CustomTransactionDetails;

function isERC20Transfer(data: string): boolean {
  try {
    const iface = new ethers.Interface(ERC20_ABI);
    const functionSig = data.slice(0, 10).toLowerCase();
    return functionSig === iface.getFunction("transfer")?.selector.toLowerCase();
  } catch {
    return false;
  }
}

function isERC721Transfer(data: string): boolean {
  try {
    const iface = new ethers.Interface(ERC721_ABI);
    const functionSig = data.slice(0, 10).toLowerCase();
    return (
      functionSig === iface.getFunction("transferFrom")?.selector.toLowerCase() ||
      functionSig === iface.getFunction("safeTransferFrom(address,address,uint256)")?.selector.toLowerCase()
    );
  } catch {
    return false;
  }
}

function decodeERC20Transfer(data: string): { recipient: string; amount: string } | null {
  try {
    const iface = new ethers.Interface(ERC20_ABI);
    const decoded = iface.parseTransaction({ data });
    if (decoded?.name === 'transfer') {
      return {
        recipient: decoded.args[0],
        amount: decoded.args[1].toString()
      };
    }
    return null;
  } catch {
    return null;
  }
}

function decodeERC721Transfer(data: string): { from: string; to: string; tokenId: string } | null {
  try {
    const iface = new ethers.Interface(ERC721_ABI);
    const decoded = iface.parseTransaction({ data });
    if (decoded?.name === 'transferFrom' || decoded?.name === 'safeTransferFrom(address,address,uint256)') {
      return {
        from: decoded.args[0],
        to: decoded.args[1],
        tokenId: decoded.args[2].toString()
      };
    }
    return null;
  } catch {
    return null;
  }
}

function decodeCustomTransaction(data: string): { functionName: string; params: string[] } | undefined {
  try {
    // Try to decode using ERC20 ABI first
    const erc20Interface = new ethers.Interface(ERC20_ABI);
    const decoded = erc20Interface.parseTransaction({ data });
    if (decoded) {
      return {
        functionName: decoded.name,
        params: decoded.args.map(arg => arg.toString())
      };
    }
  } catch {
    // If ERC20 decoding fails, try ERC721
    try {
      const erc721Interface = new ethers.Interface(ERC721_ABI);
      const decoded = erc721Interface.parseTransaction({ data });
      if (decoded) {
        return {
          functionName: decoded.name,
          params: decoded.args.map(arg => arg.toString())
        };
      }
    } catch {
      // If both fail, return undefined
      return undefined;
    }
  }
}

/**
 * Analyzes a transaction and returns its type and relevant details
 * @param transaction The transaction object containing to, value, and data
 * @param chainId The chain ID for token information
 * @returns Detailed information about the transaction including its type and relevant data
 */
export function analyzeTransaction(
  transaction:ProposalTransaction,
  chainId: number
): TransactionDetails {
  const { to, value, data } = transaction;

  // Case 1: Native transfer (no data or 0x data)
  if (!data || data === '0x' || data === '') {
    return {
      type: 'native',
      to,
      value,
      tokenInfo: getTokenInfo(TOKENS.NATIVE.address, chainId)
    };
  }

  // Case 2: ERC20 Transfer
  if (isERC20Transfer(data)) {
    const decoded = decodeERC20Transfer(data);
    if (decoded) {
      return {
        type: 'erc20',
        to, // Contract address
        value, // Usually 0
        tokenInfo: getTokenInfo(to, chainId),
        recipient: decoded.recipient,
        amount: decoded.amount
      };
    }
  }

  // Case 3: ERC721 Transfer
  if (isERC721Transfer(data)) {
    const decoded = decodeERC721Transfer(data);
    if (decoded) {
      return {
        type: 'erc721',
        to, // Contract address
        value, // Usually 0
        tokenInfo: getTokenInfo(to, chainId),
        recipient: decoded.to,
        tokenId: decoded.tokenId
      };
    }
  }

  // Case 4: Custom transaction
  return {
    type: 'custom',
    to,
    value,
    data,
    decodedCalldata: decodeCustomTransaction(data)
  };
} 