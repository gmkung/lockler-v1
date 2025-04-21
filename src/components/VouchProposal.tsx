import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount, usePublicClient } from 'wagmi';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { REALITY_MODULE_ABI } from '../abis/realityModule';
import { REALITYV3_ABI } from '../abis/realityv3';
import { Loader2, AlertTriangle } from 'lucide-react';
import { CHAIN_CONFIG, getRpcUrl } from '../lib/constants';
import { switchChain } from '../lib/utils';

interface VouchProposalProps {
    questionId: string;
    moduleAddress: string;
    chainId: number;
    disabled?: boolean;
    onVouchComplete?: () => void;
}

export function VouchProposal({ questionId, moduleAddress, chainId, disabled, onVouchComplete }: VouchProposalProps) {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const nativeCurrency = CHAIN_CONFIG[chainId]?.nativeCurrency?.symbol || '';
    
    // Debug logs for publicClient and chain detection
    useEffect(() => {
        console.log("VouchProposal Mounted with chainId prop:", chainId);
        console.log("Initial publicClient.chain:", publicClient.chain);
    }, []);
    
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [minBond, setMinBond] = useState<bigint | null>(null);
    const [currentBond, setCurrentBond] = useState<bigint | null>(null);
    const [currentAnswer, setCurrentAnswer] = useState<string | null>(null);
    const [isLoadingBond, setIsLoadingBond] = useState(false);
    const [chainMismatch, setChainMismatch] = useState(false);
    const [walletChainId, setWalletChainId] = useState<number | null>(null);

    // Watch for chain changes using window.ethereum directly
    useEffect(() => {
        if (!isOpen) return;

        const checkChainId = async () => {
            if (window.ethereum) {
                try {
                    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
                    const detectedChainId = parseInt(chainIdHex, 16);
                    console.log("Detected wallet chain ID:", detectedChainId);
                    setWalletChainId(detectedChainId);
                    setChainMismatch(detectedChainId !== chainId);
                    
                    // Clear chain mismatch errors when chains match
                    if (detectedChainId === chainId && error && 
                        (error.includes('switch') || error.includes('network') || error.includes('chain'))) {
                        setError(null);
                    }
                } catch (err) {
                    console.error("Error checking chain ID:", err);
                }
            }
        };

        checkChainId();

        // Listen for chain changes
        const handleChainChanged = (chainIdHex: string) => {
            const newChainId = parseInt(chainIdHex, 16);
            console.log("Chain changed to:", newChainId);
            setWalletChainId(newChainId);
            setChainMismatch(newChainId !== chainId);
            
            // Clear chain mismatch errors when chains match
            if (newChainId === chainId && error && 
                (error.includes('switch') || error.includes('network') || error.includes('chain'))) {
                setError(null);
            }
        };

        if (window.ethereum) {
            window.ethereum.on('chainChanged', handleChainChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, [isOpen, chainId, error]);

    // Fetch minimum bond, current bond, and current answer when dialog opens
    useEffect(() => {
        async function fetchBonds() {
            if (!isOpen || !moduleAddress || !questionId || !chainId) return;

            setIsLoadingBond(true);
            try {
                // Use JsonRpcProvider with the correct chain RPC URL instead of BrowserProvider
                const rpcUrl = getRpcUrl(chainId);
                const provider = new ethers.JsonRpcProvider(rpcUrl);

                console.log(`Using RPC URL for chain ${chainId}: ${rpcUrl}`);

                const moduleContract = new ethers.Contract(moduleAddress, REALITY_MODULE_ABI, provider);
                const oracleAddress = await moduleContract.oracle();
                const realityContract = new ethers.Contract(oracleAddress, REALITYV3_ABI, provider);

                // Get min bond, current bond, and best answer
                const [minBondResult, currentBondResult, bestAnswer] = await Promise.all([
                    realityContract.getMinBond(questionId),
                    realityContract.getBond(questionId),
                    realityContract.getBestAnswer(questionId)
                ]);

                setMinBond(minBondResult);
                setCurrentBond(currentBondResult);
                // Convert bytes32 answer to boolean (1 = true, 0 = false)
                setCurrentAnswer(bestAnswer === '0x0000000000000000000000000000000000000000000000000000000000000000' ? 'false' :
                    bestAnswer === '0x0000000000000000000000000000000000000000000000000000000000000001' ? 'true' : null);
            } catch (err) {
                console.error('Error fetching bonds:', err);
                setError('Failed to fetch bond amounts');
            } finally {
                setIsLoadingBond(false);
            }
        }

        fetchBonds();
    }, [isOpen, moduleAddress, questionId, chainId]);

    // Calculate required bond based on Reality.eth rules
    const getRequiredBond = (): bigint | null => {
        if (!minBond) return null;
        if (!currentBond || currentBond === 0n) return minBond;
        return currentBond * 2n;
    };

    const handleVouch = async (vouchFor: boolean) => {
        if (!address || !moduleAddress || !questionId) return;

        // Check for chain mismatch right before transaction
        if (walletChainId !== chainId) {
            try {
                // Fix parameter to match the expected type
                await switchChain(chainId);
                // Chain switch successful, update state
                setChainMismatch(false);
                setError(null);
            } catch (err: any) {
                setChainMismatch(true);
                setError(err.message || 'Failed to switch networks. Please switch manually.');
                return;
            }
        }

        const requiredBond = getRequiredBond();
        if (!requiredBond) return;

        setIsLoading(true);
        setError(null);

        try {
            // For transaction execution, use the provider from a fresh chain switch
            // This ensures we have the most up-to-date chain state
            const chainSwitchResult = await switchChain(chainId);

            if (!chainSwitchResult.success) {
                throw new Error(chainSwitchResult.error);
            }

            const provider = chainSwitchResult.provider as ethers.BrowserProvider;
            const signer = await provider.getSigner();

            // For contract verification, use JsonRpcProvider with the correct chain RPC URL
            const rpcProvider = new ethers.JsonRpcProvider(getRpcUrl(chainId));
            const moduleContract = new ethers.Contract(moduleAddress, REALITY_MODULE_ABI, rpcProvider);
            const oracleAddress = await moduleContract.oracle();

            // For transaction submission, use the signer
            const realityContract = new ethers.Contract(oracleAddress, REALITYV3_ABI, signer);

            const tx = await realityContract.submitAnswer(
                questionId,
                vouchFor ? '0x0000000000000000000000000000000000000000000000000000000000000001'
                    : '0x0000000000000000000000000000000000000000000000000000000000000000',
                0,
                { value: requiredBond }
            );

            await tx.wait();
            setIsOpen(false);
            onVouchComplete?.();
        } catch (err) {
            console.error('Error submitting vouch:', err);
            setError(err.message || 'Failed to submit vouch. Please ensure you have enough ETH and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Reset state when dialog closes
    useEffect(() => {
        if (!isOpen) {
            // Reset error state when dialog closes
            setError(null);
        }
    }, [isOpen]);

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                disabled={disabled || !address}
                variant="outline"
            >
                Vouch
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Vouch for Proposal</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {chainMismatch && (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-yellow-800">Wrong Network</p>
                                    <p className="text-sm text-yellow-700">
                                        Please switch your wallet to {CHAIN_CONFIG[chainId]?.name || `Chain ID ${chainId}`} to submit a vouch.
                                    </p>
                                </div>
                            </div>
                        )}

                        {isLoadingBond ? (
                            <div className="flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Loading vouch cost...</span>
                            </div>
                        ) : minBond ? (
                            <div className="text-center p-4 bg-gray-50 rounded-lg space-y-2">
                                <div>
                                    <p className="text-sm text-gray-600">Minimum Bond</p>
                                    <p className="text-sm font-medium">{ethers.formatEther(minBond)} {nativeCurrency}</p>
                                </div>
                                {currentBond && currentBond > 0n && (
                                    <div>
                                        <p className="text-sm text-gray-600">Current Bond</p>
                                        <p className="text-sm font-medium">{ethers.formatEther(currentBond)} {nativeCurrency}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-gray-600">Required Bond</p>
                                    <p className="text-lg font-semibold">{ethers.formatEther(getRequiredBond() || 0n)} {nativeCurrency}</p>
                                </div>
                                {currentAnswer && (
                                    <div>
                                        <p className="text-sm text-gray-600">Current Answer</p>
                                        <p className="text-sm font-medium">{currentAnswer === 'true' ? 'Yes' : 'No'}</p>
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {error && (
                            <div className="text-red-500">{error}</div>
                        )}

                        <div className="flex justify-end">
                            {currentAnswer === 'true' ? (
                                <Button
                                    variant="outline"
                                    onClick={() => handleVouch(false)}
                                    disabled={isLoading || !getRequiredBond() || chainMismatch}
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Vouch Against'
                                    )}
                                </Button>
                            ) : currentAnswer === 'false' ? (
                                <Button
                                    onClick={() => handleVouch(true)}
                                    disabled={isLoading || !getRequiredBond() || chainMismatch}
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Vouch For'
                                    )}
                                </Button>
                            ) : (
                                // If no current answer, show both options
                                <div className="flex space-x-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleVouch(false)}
                                        disabled={isLoading || !getRequiredBond() || chainMismatch}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            'Vouch Against'
                                        )}
                                    </Button>
                                    <Button
                                        onClick={() => handleVouch(true)}
                                        disabled={isLoading || !getRequiredBond() || chainMismatch}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            'Vouch For'
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
