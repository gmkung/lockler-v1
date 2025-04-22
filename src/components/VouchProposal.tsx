
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [realityContract, setRealityContract] = useState<ethers.Contract | null>(null);
    const [oracleAddress, setOracleAddress] = useState<string | null>(null);

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

        const handleChainChanged = (chainIdHex: string) => {
            const newChainId = parseInt(chainIdHex, 16);
            console.log("Chain changed to:", newChainId);
            setWalletChainId(newChainId);
            setChainMismatch(newChainId !== chainId);
            
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

    useEffect(() => {
        async function fetchBonds() {
            if (!isOpen || !moduleAddress || !questionId || !chainId) return;

            setIsLoadingBond(true);
            try {
                const rpcUrl = getRpcUrl(chainId);
                const provider = new ethers.JsonRpcProvider(rpcUrl);

                console.log(`Using RPC URL for chain ${chainId}: ${rpcUrl}`);

                const moduleContract = new ethers.Contract(moduleAddress, REALITY_MODULE_ABI, provider);
                const oracle = await moduleContract.oracle();
                setOracleAddress(oracle);
                
                const reality = new ethers.Contract(oracle, REALITYV3_ABI, provider);
                setRealityContract(reality);

                const [minBondResult, currentBondResult, bestAnswer] = await Promise.all([
                    reality.getMinBond(questionId),
                    reality.getBond(questionId),
                    reality.getBestAnswer(questionId)
                ]);

                setMinBond(minBondResult);
                setCurrentBond(currentBondResult);
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

    const getRequiredBond = (): bigint | null => {
        if (!minBond) return null;
        if (!currentBond || currentBond === 0n) return minBond;
        return currentBond * 2n;
    };

    const handleVouch = async (vouchFor: boolean) => {
        if (!address || !moduleAddress || !questionId || !realityContract || !oracleAddress) return;
        
        setIsSubmitting(true);
        setError(null);

        try {
            if (walletChainId !== chainId) {
                try {
                    await switchChain(chainId);
                    setChainMismatch(false);
                    setError(null);
                } catch (err: any) {
                    setChainMismatch(true);
                    setError(err.message || 'Failed to switch networks. Please switch manually.');
                    setIsSubmitting(false);
                    return;
                }
            }

            const requiredBond = getRequiredBond();
            if (!requiredBond) {
                setError('Could not determine required bond amount');
                setIsSubmitting(false);
                return;
            }

            // Connect to provider with signer for transaction
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const connectedContract = new ethers.Contract(oracleAddress, REALITYV3_ABI, signer);

            const tx = await connectedContract.submitAnswer(
                questionId,
                vouchFor ? '0x0000000000000000000000000000000000000000000000000000000000000001'
                    : '0x0000000000000000000000000000000000000000000000000000000000000000',
                0,
                { value: requiredBond }
            );

            await tx.wait();
            setIsOpen(false);
            onVouchComplete?.();
        } catch (err: any) {
            console.error('Error submitting vouch:', err);
            setError(err.message || 'Failed to submit vouch. Please ensure you have enough ETH and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (!isOpen) {
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
                                    disabled={isLoading || !getRequiredBond() || chainMismatch || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Submitting...
                                        </>
                                    ) : (
                                        'Vouch Against'
                                    )}
                                </Button>
                            ) : currentAnswer === 'false' ? (
                                <Button
                                    onClick={() => handleVouch(true)}
                                    disabled={isLoading || !getRequiredBond() || chainMismatch || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Submitting...
                                        </>
                                    ) : (
                                        'Vouch For'
                                    )}
                                </Button>
                            ) : (
                                <div className="flex space-x-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleVouch(false)}
                                        disabled={isLoading || !getRequiredBond() || chainMismatch || isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Submitting...
                                            </>
                                        ) : (
                                            'Vouch Against'
                                        )}
                                    </Button>
                                    <Button
                                        onClick={() => handleVouch(true)}
                                        disabled={isLoading || !getRequiredBond() || chainMismatch || isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Submitting...
                                            </>
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
