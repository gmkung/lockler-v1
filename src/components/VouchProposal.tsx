import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { REALITY_MODULE_ABI } from '../abis/realityModule';
import { REALITYV3_ABI } from '../abis/realityv3';
import { Loader2 } from 'lucide-react';

interface VouchProposalProps {
    questionId: string;
    moduleAddress: string;
    disabled?: boolean;
    onVouchComplete?: () => void;
}

export function VouchProposal({ questionId, moduleAddress, disabled, onVouchComplete }: VouchProposalProps) {
    const { address } = useAccount();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [minBond, setMinBond] = useState<bigint | null>(null);
    const [currentBond, setCurrentBond] = useState<bigint | null>(null);
    const [currentAnswer, setCurrentAnswer] = useState<string | null>(null);
    const [isLoadingBond, setIsLoadingBond] = useState(false);

    // Fetch minimum bond, current bond, and current answer when dialog opens
    useEffect(() => {
        async function fetchBonds() {
            if (!isOpen || !moduleAddress || !questionId) return;

            setIsLoadingBond(true);
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
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
    }, [isOpen, moduleAddress, questionId]);

    // Calculate required bond based on Reality.eth rules
    const getRequiredBond = (): bigint | null => {
        if (!minBond) return null;
        if (!currentBond || currentBond === 0n) return minBond;
        return currentBond * 2n;
    };

    const handleVouch = async (vouchFor: boolean) => {
        if (!address || !moduleAddress || !questionId) return;

        const requiredBond = getRequiredBond();
        if (!requiredBond) return;

        setIsLoading(true);
        setError(null);

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const moduleContract = new ethers.Contract(moduleAddress, REALITY_MODULE_ABI, provider);
            const oracleAddress = await moduleContract.oracle();
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
            setError('Failed to submit vouch. Please ensure you have enough ETH and try again.');
        } finally {
            setIsLoading(false);
        }
    };

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
                        {isLoadingBond ? (
                            <div className="flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Loading vouch cost...</span>
                            </div>
                        ) : minBond ? (
                            <div className="text-center p-4 bg-gray-50 rounded-lg space-y-2">
                                <div>
                                    <p className="text-sm text-gray-600">Minimum Bond</p>
                                    <p className="text-sm font-medium">{ethers.formatEther(minBond)} ETH</p>
                                </div>
                                {currentBond && currentBond > 0n && (
                                    <div>
                                        <p className="text-sm text-gray-600">Current Bond</p>
                                        <p className="text-sm font-medium">{ethers.formatEther(currentBond)} ETH</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-gray-600">Required Bond</p>
                                    <p className="text-lg font-semibold">{ethers.formatEther(getRequiredBond() || 0n)} ETH</p>
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
                                    disabled={isLoading || !getRequiredBond()}
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
                                    disabled={isLoading || !getRequiredBond()}
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
                                        disabled={isLoading || !getRequiredBond()}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            'Vouch Against'
                                        )}
                                    </Button>
                                    <Button
                                        onClick={() => handleVouch(true)}
                                        disabled={isLoading || !getRequiredBond()}
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
