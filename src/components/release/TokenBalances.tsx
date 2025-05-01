
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getAvailableTokens } from '@/lib/currency';
import { fetchTokenBalances } from '@/lib/web3';
import { Coins } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

interface TokenBalancesProps {
  chainId: number;
  safeAddress?: string;
}

export function TokenBalances({ chainId, safeAddress }: TokenBalancesProps) {
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected } = useAccount();
  
  useEffect(() => {
    const loadBalances = async () => {
      if (!chainId || !safeAddress) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        const tokens = getAvailableTokens(chainId);
        const tokensWithBalances = await fetchTokenBalances(
          tokens.map(t => t.address),
          safeAddress,
          chainId
        );
        
        setBalances(tokensWithBalances);
      } catch (error) {
        console.error("Error fetching token balances:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBalances();
  }, [chainId, safeAddress, isConnected]);
  
  const availableTokens = getAvailableTokens(chainId);
  
  return (
    <Card className="bg-gray-900 rounded-3xl border border-gray-800 p-5 shadow-2xl mb-6">
      <div className="flex items-center mb-4">
        <Coins className="h-5 w-5 text-purple-400 mr-2" />
        <h2 className="text-xl font-semibold text-white">Token Balances</h2>
      </div>
      
      {isLoading ? (
        <div className="flex flex-wrap gap-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex-1 min-w-[150px]">
              <Skeleton className="h-16 bg-gray-800 rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {availableTokens.map(token => {
            const balance = balances[token.address] || '0';
            return (
              <div 
                key={token.address} 
                className="flex-1 min-w-[150px] bg-gray-800/50 p-4 rounded-lg border border-gray-700"
              >
                <div className="text-gray-400 text-sm">{token.symbol}</div>
                <div className="text-white font-mono text-lg mt-1">{balance}</div>
              </div>
            );
          })}
          
          {availableTokens.length === 0 && (
            <div className="text-gray-400 text-center w-full p-4">
              No tokens configured for this chain
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
