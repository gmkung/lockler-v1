import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { BrowserProvider, ethers } from 'ethers';
import { CHAIN_CONFIG, getRpcUrl } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Attempts to switch the user's wallet to the specified chain ID
 * @param targetChainId - The chain ID to switch to
 * @returns An object with the result of the operation
 */
export async function switchChain(targetChainId: number): Promise<{
  success: boolean;
  provider?: BrowserProvider;
  error?: string;
}> {
  try {
    if (!window.ethereum) {
      return { 
        success: false, 
        error: "No Ethereum provider found. Please install a wallet like MetaMask." 
      };
    }
    
    // Create a provider to check current chain
    const provider = new BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    const currentChainId = network.chainId;
    
    // If already on the correct chain, just return success
    if (currentChainId.toString() === targetChainId.toString()) {
      return { success: true, provider };
    }
    
    console.log(`Chain mismatch detected. Attempting to switch to ${CHAIN_CONFIG[targetChainId]?.name || `Chain ID ${targetChainId}`}...`);
    
    // Attempt to switch the chain
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${targetChainId.toString(16)}` }], // Convert to hex string
    });
    
    // Wait a bit for the chain switch to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify the chain was switched
    const updatedProvider = new BrowserProvider(window.ethereum);
    const updatedNetwork = await updatedProvider.getNetwork();
    
    if (updatedNetwork.chainId.toString() !== targetChainId.toString()) {
      throw new Error("Failed to switch network automatically.");
    }
    
    console.log(`Successfully switched to ${CHAIN_CONFIG[targetChainId]?.name || `Chain ID ${targetChainId}`}`);
    return { success: true, provider: updatedProvider };
    
  } catch (switchError) {
    console.error("Error switching chain:", switchError);
    
    // If the chain is not added to MetaMask, try to add it
    if ((switchError as any).code === 4902) {
      try {
        const rpcUrl = getRpcUrl(targetChainId);
        const chainConfig = CHAIN_CONFIG[targetChainId];
        
        if (!chainConfig) {
          return { 
            success: false, 
            error: `Chain configuration not found for chain ID ${targetChainId}` 
          };
        }
        
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: chainConfig.name,
              nativeCurrency: chainConfig.nativeCurrency,
              rpcUrls: [rpcUrl],
              blockExplorerUrls: [chainConfig.blockExplorer],
            },
          ],
        });
        
        // Wait a bit more for the chain to be added and switched
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Verify again after adding the chain
        const finalProvider = new BrowserProvider(window.ethereum);
        const finalNetwork = await finalProvider.getNetwork();
        
        if (finalNetwork.chainId.toString() !== targetChainId.toString()) {
          return { 
            success: false, 
            error: `Please switch to ${chainConfig.name} manually.` 
          };
        }
        
        return { success: true, provider: finalProvider };
        
      } catch (addChainError) {
        console.error("Error adding chain:", addChainError);
        return { 
          success: false, 
          error: `Could not add ${CHAIN_CONFIG[targetChainId]?.name || `Chain ID ${targetChainId}`} to your wallet. Please add it manually.` 
        };
      }
    } else {
      return { 
        success: false, 
        error: `Please switch your wallet to ${CHAIN_CONFIG[targetChainId]?.name || `Chain ID ${targetChainId}`} manually.` 
      };
    }
  }
}

// Helper function to parse error messages (Moved from VouchProposal)
export function parseErrorMessage(error: any): string {
    console.error("Raw error:", error); // Log the raw error for debugging

    // Check for user rejection patterns
    if (error?.code === 4001 || error?.code === 'ACTION_REJECTED' || error?.message?.includes('User rejected') || error?.message?.includes('user denied')) {
        return "Transaction rejected by user.";
    }

    // Check for revert reasons (similar to TransactionList)
    if (error?.reason) {
        return `Error: ${error.reason}`;
    }
    if (error?.message?.includes('reason=')) {
        // Adjusted regex to handle potential escapes inside the reason string if needed
        const reasonMatch = error.message.match(/reason="([^"\\]*(?:\\.[^"\\]*)*)"/); 
        if (reasonMatch && reasonMatch[1]) {
            return `Error: ${reasonMatch[1]}`;
        }
    }
    
    // Check for short message
    if (error?.shortMessage) {
        // Avoid overly technical short messages if possible
        if (!error.shortMessage.includes('{') && !error.shortMessage.includes('(')){
             return error.shortMessage;
        }
    }
    
    // Fallback generic messages
    if (error?.message?.includes('insufficient funds')) {
        return "Error: Insufficient funds for transaction.";
    }

    // More generic fallback
    return "Transaction failed. Please check console for details."; 
}
