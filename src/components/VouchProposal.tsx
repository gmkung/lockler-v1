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
import { ARBITRATOR_PROXY_ABI } from '../abis/arbitratorproxy';
import { parseErrorMessage } from '../lib/utils';

interface VouchProposalProps {
    questionId: string;
    moduleAddress: string;
    chainId: number;
    arbitrator: string;
    disabled?: boolean;
    onVouchComplete?: () => void;
    onArbitrationRequested?: () => void;
}

export function VouchProposal({ questionId, moduleAddress, chainId, arbitrator, disabled, onVouchComplete, onArbitrationRequested }: VouchProposalProps) {
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
    const [isArbitrating, setIsArbitrating] = useState(false);
    const [arbitrationError, setArbitrationError] = useState<string | null>(null);
    const [disputeFee, setDisputeFee] = useState<bigint | null>(null);
    const [isLoadingFee, setIsLoadingFee] = useState(false);

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
        async function fetchData() {
            if (!isOpen || !moduleAddress || !questionId || !chainId || !arbitrator) return;

            setIsLoadingBond(true);
            setIsLoadingFee(true);
            setError(null);
            setArbitrationError(null);

            try {
                const rpcUrl = getRpcUrl(chainId);
                const provider = new ethers.JsonRpcProvider(rpcUrl);

                console.log(`Using RPC URL for chain ${chainId}: ${rpcUrl}`);

                const moduleContract = new ethers.Contract(moduleAddress, REALITY_MODULE_ABI, provider);
                const oracle = await moduleContract.oracle();
                setOracleAddress(oracle);

                const reality = new ethers.Contract(oracle, REALITYV3_ABI, provider);
                setRealityContract(reality);

                const arbitratorContract = new ethers.Contract(arbitrator, ARBITRATOR_PROXY_ABI, provider);

                const [minBondResult, currentBondResult, bestAnswer] = await Promise.all([
                    reality.getMinBond(questionId),
                    reality.getBond(questionId),
                    reality.getBestAnswer(questionId),
                ]);

                setMinBond(minBondResult);
                setCurrentBond(currentBondResult);
                setCurrentAnswer(bestAnswer === '0x0000000000000000000000000000000000000000000000000000000000000000' ? 'false' :
                    bestAnswer === '0x0000000000000000000000000000000000000000000000000000000000000001' ? 'true' : null);

                setIsLoadingBond(false);

                try {
                    const fee = await arbitratorContract.getDisputeFee(questionId);
                    setDisputeFee(fee);
                    console.log("Dispute fee:", ethers.formatEther(fee), nativeCurrency);
                } catch (feeErr) {
                    console.error('Error fetching dispute fee:', feeErr);
                    setArbitrationError('Failed to fetch arbitration fee.');
                } finally {
                    setIsLoadingFee(false);
                }

            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to fetch proposal details or arbitration fee.');
                setIsLoadingBond(false);
                setIsLoadingFee(false);
            }
        }

        fetchData();
    }, [isOpen, moduleAddress, questionId, chainId, arbitrator, nativeCurrency]);

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
            setError(parseErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestArbitration = async () => {
        if (!address || !arbitrator || !questionId || !currentBond || !disputeFee) {
            setArbitrationError("Missing required information for arbitration.");
            return;
        };

        setIsArbitrating(true);
        setArbitrationError(null);
        setError(null);

        try {
            if (walletChainId !== chainId) {
                try {
                    await switchChain(chainId);
                    setChainMismatch(false);
                } catch (err: any) {
                    setChainMismatch(true);
                    setArbitrationError(err.message || 'Failed to switch networks. Please switch manually.');
                    setIsArbitrating(false);
                    return;
                }
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const arbitratorContract = new ethers.Contract(arbitrator, ARBITRATOR_PROXY_ABI, signer);

            console.log("Requesting arbitration with:");
            console.log("  Question ID:", questionId);
            console.log("  Max Previous Bond:", currentBond.toString());
            console.log("  Dispute Fee (value):", disputeFee.toString());

            const tx = await arbitratorContract.requestArbitration(
                questionId,
                currentBond,
                { value: disputeFee }
            );

            await tx.wait();
            setIsOpen(false);
            onArbitrationRequested?.();
        } catch (err: any) {
            console.error('Error requesting arbitration:', err);
            setArbitrationError(parseErrorMessage(err));
        } finally {
            setIsArbitrating(false);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setError(null);
            setArbitrationError(null);
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
                <DialogContent className="bg-gray-900 border-gray-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white">Vouch / Arbitrate Proposal</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {chainMismatch && (
                            <div className="p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-md flex items-start">
                                <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-yellow-300">Wrong Network</p>
                                    <p className="text-sm text-yellow-400/80">
                                        Please switch your wallet to {CHAIN_CONFIG[chainId]?.name || `Chain ID ${chainId}`} to interact.
                                    </p>
                                </div>
                            </div>
                        )}

                        {isLoadingBond ? (
                            <div className="flex items-center justify-center text-sm text-gray-400">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Loading bond details...</span>
                            </div>
                        ) : minBond !== null ? (
                            <div className="text-center p-4 bg-gray-800/50 rounded-lg space-y-2 border border-gray-700/50">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                    <p className="text-gray-400 text-right">Minimum Bond:</p>
                                    <p className="font-medium text-left text-gray-100">{ethers.formatEther(minBond)} {nativeCurrency}</p>

                                    {currentBond !== null && currentBond > 0n && (
                                        <>
                                            <p className="text-gray-400 text-right">Current Bond:</p>
                                            <p className="font-medium text-left text-gray-100">{ethers.formatEther(currentBond)} {nativeCurrency}</p>
                                        </>
                                    )}

                                    {getRequiredBond() !== null && (
                                        <>
                                            <p className="text-gray-400 text-right">Required Bond (Next Vouch):</p>
                                            <p className="font-semibold text-left text-base text-white">{ethers.formatEther(getRequiredBond()!)} {nativeCurrency}</p>
                                        </>
                                    )}

                                    {currentAnswer !== null && (
                                        <>
                                            <p className="text-gray-400 text-right">Current Answer:</p>
                                            <p className={`font-medium text-left ${currentAnswer === 'true' ? 'text-green-400' : 'text-red-400'}`}>
                                                {currentAnswer === 'true' ? 'Yes' : 'No'}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : !isLoadingBond && !error && (
                            <p className="text-center text-sm text-gray-500">Could not load bond details.</p>
                        )}

                        {error && (
                            <div className="text-red-400 text-sm p-3 bg-red-900/20 rounded border border-red-700/30 mt-2">{error}</div>
                        )}

                        {arbitrationError && (
                            <div className="text-red-400 text-sm p-3 bg-red-900/20 rounded border border-red-700/30 mt-2">{arbitrationError}</div>
                        )}

                        <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                            {(() => {
                                const vouchDisabled = isLoadingBond || getRequiredBond() === null || chainMismatch || isSubmitting || isArbitrating || isLoadingFee;
                                const arbitrationDisabled = chainMismatch || isLoading || isSubmitting || isArbitrating || isLoadingBond || isLoadingFee || currentBond === null || disputeFee === null;
                                
                                return (
                                    <>
                                        {currentAnswer === 'true' ? (
                                            <div 
                                                onClick={() => !vouchDisabled && handleVouch(false)}
                                                className={`flex-1 p-4 rounded-lg border text-center transition-all duration-150 flex flex-col items-center justify-center min-h-[120px]
                                                    ${vouchDisabled ? 
                                                        'border-purple-400/20 text-purple-300/50 opacity-50 cursor-not-allowed' : 
                                                        'border-purple-400/50 text-purple-300 hover:bg-purple-900/30 hover:text-purple-200 cursor-pointer'}
                                                `}
                                            >
                                                <div className="h-5 flex items-center justify-center mb-1 w-full text-center">
                                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                                    <span className="font-medium">Vouch Against (No)</span>
                                                </div>
                                                <span className="text-xs text-gray-400 flex-grow text-center flex items-center">Place a bond to vouch for your answer; will be refunded if your answer is unchallenged.</span>
                                            </div>
                                        ) : currentAnswer === 'false' ? (
                                            <div 
                                                onClick={() => !vouchDisabled && handleVouch(true)}
                                                className={`flex-1 p-4 rounded-lg text-center text-white transition-all duration-150 flex flex-col items-center justify-center min-h-[120px]
                                                    ${vouchDisabled ? 
                                                        'bg-gradient-to-r from-emerald-900/50 to-teal-600/50 opacity-50 cursor-not-allowed' : 
                                                        'bg-gradient-to-r from-emerald-800 to-teal-500 hover:from-emerald-700 hover:to-teal-600 cursor-pointer'}
                                                `}
                                            >
                                                <div className="h-5 flex items-center justify-center mb-1 w-full text-center">
                                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                                    <span className="font-medium">Vouch For (Yes)</span>
                                                </div>
                                                <span className="text-xs text-gray-300 flex-grow text-center flex items-center">Place a bond to vouch for your answer; will be refunded if your answer is unchallenged.</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div 
                                                    onClick={() => !vouchDisabled && handleVouch(false)}
                                                    className={`flex-1 p-4 rounded-lg border text-center transition-all duration-150 flex flex-col items-center justify-center min-h-[120px]
                                                        ${vouchDisabled ? 
                                                            'border-purple-400/20 text-purple-300/50 opacity-50 cursor-not-allowed' : 
                                                            'border-purple-400/50 text-purple-300 hover:bg-purple-900/30 hover:text-purple-200 cursor-pointer'}
                                                    `}
                                                >
                                                    <div className="h-5 flex items-center justify-center mb-1 w-full text-center">
                                                        {(isSubmitting && currentAnswer !== 'true') ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                                        <span className="font-medium">Vouch Against (No)</span>
                                                    </div>
                                                    <span className="text-xs text-gray-400 flex-grow text-center flex items-center justify-center">Place a bond to vouch for your answer; will be refunded if your answer is unchallenged.</span>
                                                </div>
                                                <div 
                                                    onClick={() => !vouchDisabled && handleVouch(true)}
                                                    className={`flex-1 p-4 rounded-lg text-center text-white transition-all duration-150 flex flex-col items-center justify-center min-h-[120px]
                                                        ${vouchDisabled ? 
                                                            'bg-gradient-to-r from-emerald-900/50 to-teal-600/50 opacity-50 cursor-not-allowed' : 
                                                            'bg-gradient-to-r from-emerald-800 to-teal-500 hover:from-emerald-700 hover:to-teal-600 cursor-pointer'}
                                                    `}
                                                >
                                                    <div className="h-5 flex items-center justify-center mb-1 w-full text-center">
                                                        {(isSubmitting && currentAnswer !== 'false') ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                                        <span className="font-medium">Vouch For (Yes)</span>
                                                    </div>
                                                    <span className="text-xs text-gray-300 flex-grow text-center flex items-center justify-center">Place a bond to vouch for your answer; will be refunded if your answer is unchallenged.</span>
                                                </div>
                                            </> 
                                        )}

                                        <div 
                                            onClick={() => !arbitrationDisabled && handleRequestArbitration()}
                                            className={`flex-1 p-4 rounded-lg border text-center transition-all duration-150 flex flex-col items-center justify-center min-h-[120px]
                                                ${arbitrationDisabled ? 
                                                    'border-gray-600/50 bg-gray-700/20 text-gray-400/70 opacity-60 cursor-not-allowed' : 
                                                    'border-gray-600/80 bg-gray-700/50 text-gray-200 hover:bg-gray-700/70 hover:border-gray-500 cursor-pointer'}
                                            `}
                                            style={arbitrationDisabled ? { pointerEvents: 'none' } : {}}
                                        >
                                            <div className="h-5 flex items-center justify-center mb-1 w-full text-center">
                                                {isArbitrating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                                <span className="font-medium">Request Arbitration</span>
                                            </div>
                                            <div className="text-xs mt-1 h-4 flex items-center justify-center w-full text-center">
                                                {isLoadingFee ? (
                                                    <span className="text-gray-400 italic">Loading fee...</span>
                                                ) : disputeFee !== null ? (
                                                    <span className="text-gray-300">Fee: {ethers.formatEther(disputeFee)} {nativeCurrency}</span>
                                                ) : (
                                                    <span className="text-gray-500 italic">Fee Unavailable</span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-500 mt-1 px-1 flex-grow text-center flex items-center justify-center">Pay a fee to escalate this to Kleros Court if you are confident that you are right and the Current Bond is equal or higher than the arbitration cost.</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
