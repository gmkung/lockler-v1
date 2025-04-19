import { useState, useEffect } from "react";
import {
    BrowserProvider,
    parseEther,
} from "ethers";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { deploySafeWithOwners, deployRealityModule } from '../lib/deployment';
import { getDefaultContractTerms } from '../lib/templates';

import {
    DEFAULT_SALT_NONCE,
    DEFAULT_TIMEOUTS,
    DEFAULT_BOND,
    DEFAULT_CHAIN_ID,
    getContractAddresses,
    getBlockExplorer,
} from '../lib/constants';

import { EscrowContractTerms, Payment } from '../lib/types';
import { uploadContractTerms, } from '../lib/ipfs';
import { NetworkInfo } from "../components/NetworkInfo";
import { ContractTermsForm } from "../components/ContractTermsForm";
import { DeploymentStatus } from "../components/DeploymentStatus";


type EscrowMode = 'p2p' | 'grant';
type P2PRole = 'sender' | 'receiver';

export default function SeancesSetup() {
    // Mode and role selection
    const [escrowMode, setEscrowMode] = useState<EscrowMode>('p2p');
    const [p2pRole, setP2PRole] = useState<P2PRole>('sender');
    const [counterpartyAddress, setCounterpartyAddress] = useState<string>("");

    // Chain state
    const [chainId, setChainId] = useState<number>(DEFAULT_CHAIN_ID);

    // Safe deployment state
    const [saltNonce, setSaltNonce] = useState(DEFAULT_SALT_NONCE);
    const [deployedSafeAddress, setDeployedSafeAddress] = useState<string | null>(null);
    const [existingSafeAddress, setExistingSafeAddress] = useState("");

    // Module deployment state
    const [moduleDeploymentHash, setModuleDeploymentHash] = useState<string | null>(null);
    const [transactionData, setTransactionData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Contract terms state
    const [contractTerms, setContractTerms] = useState<EscrowContractTerms>(() =>
        getDefaultContractTerms('p2p', '', '')
    );

    const { toast } = useToast();

    // Listen for chain changes
    useEffect(() => {
        const handleChainChanged = (newChainId: string) => {
            setChainId(parseInt(newChainId, 16));
        };

        if (window.ethereum) {
            window.ethereum.on('chainChanged', handleChainChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, []);

    // Get current chain contracts
    const contracts = getContractAddresses(chainId);
    const blockExplorer = getBlockExplorer(chainId);

    // Update contract terms when mode changes or addresses are set
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_requestAccounts' })
                .then((accounts: string[]) => {
                    if (accounts[0]) {
                        setContractTerms(getDefaultContractTerms(
                            escrowMode,
                            accounts[0],
                            counterpartyAddress,
                            p2pRole
                        ));
                    }
                });
        }
    }, [escrowMode, counterpartyAddress, p2pRole]);

    const handleSafeDeploy = async () => {
        setLoading(true);
        setError(null);

        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed');
            }

            const provider = new BrowserProvider(window.ethereum);
            const safeAddress = await deploySafeWithOwners(
                provider,
                escrowMode,
                p2pRole,
                counterpartyAddress,
                saltNonce,
                contracts
            );

            setDeployedSafeAddress(safeAddress);

            toast({
                title: "Safe Deployed!",
                description: `Your new Safe has been deployed at: ${safeAddress}`,
            });
        } catch (error: any) {
            console.error("Safe deployment error:", error);
            toast({
                variant: "destructive",
                title: "Safe Deployment Failed",
                description: error.message || "Failed to deploy Safe",
            });
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleModuleDeploy = async () => {
        if (!deployedSafeAddress) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please deploy a Safe first",
            });
            return;
        }

        setLoading(true);
        setError(null);
        setTransactionData(null);
        setModuleDeploymentHash(null);

        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed');
            }

            // Upload contract terms to IPFS first
            const cid = await uploadContractTerms(contractTerms);

            const provider = new BrowserProvider(window.ethereum);
            const result = await deployRealityModule(
                provider,
                deployedSafeAddress,
                contracts,
                cid,
                {
                    timeout: DEFAULT_TIMEOUTS.TIMEOUT,
                    cooldown: DEFAULT_TIMEOUTS.COOLDOWN,
                    expiration: DEFAULT_TIMEOUTS.EXPIRATION,
                    bond: parseEther(DEFAULT_BOND).toString()
                }
            );

            setModuleDeploymentHash(result.txHash);
            setTransactionData(result.receipt);

            toast({
                title: "Module Deployed!",
                description: "Reality module has been deployed, enabled, and added as an owner",
            });
        } catch (err: any) {
            console.error("Module deployment error:", err);
            setError(err.message);
            toast({
                variant: "destructive",
                title: "Module Deployment Failed",
                description: err.message || "Failed to deploy module",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <NetworkInfo chainId={chainId} />

            {/* Step 1: Safe Deployment */}
            <Card>
                <CardHeader>
                    <h2 className="text-2xl font-bold">Step 1: Configure Escrow Type</h2>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Mode Selection */}
                        <div className="space-y-4">
                            <Label>Escrow Type</Label>
                            <div className="flex space-x-4">
                                <Button
                                    variant={escrowMode === 'p2p' ? 'default' : 'outline'}
                                    onClick={() => setEscrowMode('p2p')}
                                >
                                    P2P Escrow
                                </Button>
                                <Button
                                    variant={escrowMode === 'grant' ? 'default' : 'outline'}
                                    onClick={() => setEscrowMode('grant')}
                                >
                                    Grant Escrow
                                </Button>
                            </div>
                        </div>

                        {/* P2P Role Selection */}
                        {escrowMode === 'p2p' && (
                            <div className="space-y-4">
                                <Label>Your Role</Label>
                                <div className="flex space-x-4">
                                    <Button
                                        variant={p2pRole === 'sender' ? 'default' : 'outline'}
                                        onClick={() => setP2PRole('sender')}
                                    >
                                        I am the Sender
                                    </Button>
                                    <Button
                                        variant={p2pRole === 'receiver' ? 'default' : 'outline'}
                                        onClick={() => setP2PRole('receiver')}
                                    >
                                        I am the Receiver
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Counterparty Address Input - Only show in P2P mode */}
                        {escrowMode === 'p2p' && (
                            <div>
                                <Label>
                                    {p2pRole === 'sender' ? 'Receiver' : 'Sender'} Address
                                </Label>
                                <div className="mt-1">
                                    <Input
                                        value={counterpartyAddress}
                                        onChange={(e) => setCounterpartyAddress(e.target.value)}
                                        placeholder={`Enter ${p2pRole === 'sender' ? 'receiver' : 'sender'} address`}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Deploy button */}
                        <Button
                            className="w-full"
                            onClick={handleSafeDeploy}
                            disabled={loading || !!deployedSafeAddress || (escrowMode === 'p2p' && !counterpartyAddress)}
                        >
                            {loading ? "Deploying..." : deployedSafeAddress ? "Safe Deployed ✓" : "Deploy Safe"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Step 2: Reality Module Deployment */}
            <Card>
                <CardHeader>
                    <h2 className="text-2xl font-bold">Step 2: Deploy Reality Module</h2>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Display Active Safe Address */}
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                            <h3 className="font-semibold text-blue-800">Active Safe Address</h3>
                            <p className="text-sm mt-1">{deployedSafeAddress || existingSafeAddress}</p>
                            <a
                                href={`${blockExplorer}/address/${deployedSafeAddress || existingSafeAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                            >
                                View on Block Explorer →
                            </a>
                        </div>

                        <ContractTermsForm
                            contractTerms={contractTerms}
                            setContractTerms={setContractTerms}
                            escrowMode={escrowMode}
                            chainId={chainId}
                        />

                        {/* Module Deployment Button */}
                        <Button
                            onClick={handleModuleDeploy}
                            disabled={!(deployedSafeAddress || existingSafeAddress) || loading}
                            className="w-full"
                        >
                            {loading ? 'Deploying...' : moduleDeploymentHash ? 'Module Deployed ✓' : 'Deploy Reality Module'}
                        </Button>

                        <DeploymentStatus
                            moduleDeploymentHash={moduleDeploymentHash}
                            transactionData={transactionData}
                            error={error}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 