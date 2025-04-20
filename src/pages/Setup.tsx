
import { useState, useEffect } from "react";
import {
    BrowserProvider,
    parseEther,
    formatEther,
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
import { useNavigate } from "react-router-dom";
import { Lock, Shield, Wallet, ArrowDown, CircleCheck, ExternalLink } from "lucide-react";


type EscrowMode = 'p2p' | 'grant';
type P2PRole = 'sender' | 'receiver';

interface ModuleConfig {
    timeout: number;
    cooldown: number;
    expiration: number;
    bond: string;
}

export default function Setup() {
    const navigate = useNavigate();
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

    // Module configuration state
    const [moduleConfig, setModuleConfig] = useState<ModuleConfig>({
        timeout: DEFAULT_TIMEOUTS.TIMEOUT,
        cooldown: DEFAULT_TIMEOUTS.COOLDOWN,
        expiration: DEFAULT_TIMEOUTS.EXPIRATION,
        bond: DEFAULT_BOND
    });

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
                title: "Lockler Safe Deployed!",
                description: `Your new Safe has been deployed at: ${safeAddress}`,
            });
        } catch (error: any) {
            console.error("Safe deployment error:", error);
            toast({
                variant: "destructive",
                title: "Lockler Deployment Failed",
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
                description: "Please deploy a Lockler Safe first",
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
                    timeout: moduleConfig.timeout,
                    cooldown: moduleConfig.cooldown,
                    expiration: moduleConfig.expiration,
                    bond: parseEther(moduleConfig.bond).toString()
                }
            );

            setModuleDeploymentHash(result.txHash);
            setTransactionData(result.receipt);

            toast({
                title: "Security System Deployed!",
                description: "Kleros Reality Module has been deployed and configured successfully",
            });
        } catch (err: any) {
            console.error("Module deployment error:", err);
            setError(err.message);
            toast({
                variant: "destructive",
                title: "Security System Deployment Failed",
                description: err.message || "Failed to deploy Kleros Reality Module",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <Lock className="h-10 w-10 text-indigo-600" />
                    <h1 className="text-4xl font-bold text-gray-800">Lockler</h1>
                </div>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                    Secure smart contract wallet with Kleros-powered verification for safe fund management
                </p>
            </div>
            
            <NetworkInfo chainId={chainId} />

            <div className="space-y-8">
                {/* Step 1: Lockler Type Configuration */}
                <Card className="border-0 shadow-lg rounded-xl overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardHeader className="bg-white border-b border-gray-100 p-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold">1</div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Configure Lockler Type</h2>
                                <p className="text-gray-600 mt-1">Choose the type of Lockler and configure basic settings</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-8">
                            {/* Lockler Type Selection */}
                            <div className="space-y-4">
                                <Label className="text-lg font-medium text-gray-700">Lockler Type</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Button
                                        variant={escrowMode === 'p2p' ? 'default' : 'outline'}
                                        onClick={() => setEscrowMode('p2p')}
                                        className={`h-auto py-6 flex flex-col items-center ${escrowMode === 'p2p' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                                    >
                                        <div className="text-2xl mb-2">🔄</div>
                                        <span className="font-bold text-lg">Transfer Lockler</span>
                                        <p className="text-sm mt-2 text-center">
                                            For secure transfers between two parties
                                        </p>
                                    </Button>
                                    <Button
                                        variant={escrowMode === 'grant' ? 'default' : 'outline'}
                                        onClick={() => setEscrowMode('grant')}
                                        className={`h-auto py-6 flex flex-col items-center ${escrowMode === 'grant' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                                    >
                                        <div className="text-2xl mb-2">🏆</div>
                                        <span className="font-bold text-lg">Grant Lockler</span>
                                        <p className="text-sm mt-2 text-center">
                                            For distributing funds to multiple recipients
                                        </p>
                                    </Button>
                                </div>
                            </div>

                            {/* P2P Role Selection */}
                            {escrowMode === 'p2p' && (
                                <div className="space-y-4">
                                    <Label className="text-lg font-medium text-gray-700">Your Role</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Button
                                            variant={p2pRole === 'sender' ? 'default' : 'outline'}
                                            onClick={() => setP2PRole('sender')}
                                            className={`h-auto py-4 flex items-center justify-center gap-3 ${p2pRole === 'sender' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                                        >
                                            <ArrowDown className="h-5 w-5 rotate-45" />
                                            <span className="font-medium">I am the Sender</span>
                                        </Button>
                                        <Button
                                            variant={p2pRole === 'receiver' ? 'default' : 'outline'}
                                            onClick={() => setP2PRole('receiver')}
                                            className={`h-auto py-4 flex items-center justify-center gap-3 ${p2pRole === 'receiver' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                                        >
                                            <ArrowDown className="h-5 w-5 -rotate-135" />
                                            <span className="font-medium">I am the Receiver</span>
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Counterparty Address Input - Only show in P2P mode */}
                            {escrowMode === 'p2p' && (
                                <div className="space-y-2">
                                    <Label className="text-lg font-medium text-gray-700">
                                        {p2pRole === 'sender' ? 'Receiver' : 'Sender'} Address
                                    </Label>
                                    <Input
                                        value={counterpartyAddress}
                                        onChange={(e) => setCounterpartyAddress(e.target.value)}
                                        placeholder={`Enter ${p2pRole === 'sender' ? 'receiver' : 'sender'} Ethereum address`}
                                        className="bg-white"
                                    />
                                    <p className="text-sm text-gray-500">
                                        Enter the Ethereum address of the {p2pRole === 'sender' ? 'receiver' : 'sender'}
                                    </p>
                                </div>
                            )}

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h3 className="font-medium text-blue-800 mb-1">About Smart Contract Wallet</h3>
                                <p className="text-sm text-blue-700">
                                    This will deploy a Gnosis Safe - a secure smart contract wallet that enables 
                                    multi-signature capability and advanced security features for your funds.
                                </p>
                            </div>

                            {/* Deploy button */}
                            <Button
                                className="w-full py-6 text-lg bg-indigo-600 hover:bg-indigo-700"
                                onClick={handleSafeDeploy}
                                disabled={loading || !!deployedSafeAddress || (escrowMode === 'p2p' && !counterpartyAddress)}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Deploying...</span>
                                    </div>
                                ) : deployedSafeAddress ? (
                                    <div className="flex items-center gap-2">
                                        <CircleCheck className="h-5 w-5" />
                                        <span>Lockler Safe Deployed</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Lock className="h-5 w-5" />
                                        <span>Deploy Lockler Safe</span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Step 2: Security System Setup */}
                <Card className="border-0 shadow-lg rounded-xl overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardHeader className="bg-white border-b border-gray-100 p-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold">2</div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Security System Setup</h2>
                                <p className="text-gray-600 mt-1">Configure the Kleros Reality Module for fund release verification</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-8">
                            {/* Display Active Safe Address */}
                            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <Wallet className="h-5 w-5 text-indigo-600" />
                                    <h3 className="text-lg font-medium text-gray-800">Active Lockler Address</h3>
                                </div>
                                <div className="font-mono text-sm p-3 bg-gray-50 rounded-md border border-gray-200 break-all">
                                    {deployedSafeAddress || existingSafeAddress || "No Safe address available"}
                                </div>
                                {(deployedSafeAddress || existingSafeAddress) && (
                                    <a
                                        href={`${blockExplorer}/address/${deployedSafeAddress || existingSafeAddress}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-3"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        View on Block Explorer
                                    </a>
                                )}
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                                <div className="flex gap-3">
                                    <Shield className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-medium text-blue-800 mb-1">Kleros Reality Module - Optimistic Oracle</h3>
                                        <p className="text-sm text-blue-700">
                                            This module acts as an optimistic oracle for verifying fund releases. It uses Kleros as an arbitration system for dispute resolution. 
                                            Configure the parameters below to determine how proposals are verified and executed.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Module Configuration */}
                            <div className="space-y-6 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-indigo-600" />
                                    Security System Configuration
                                </h3>
                                
                                {/* Bond */}
                                <div className="space-y-2">
                                    <Label htmlFor="bond" className="text-gray-700">Question Bond (ETH)</Label>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            id="bond"
                                            type="number"
                                            value={moduleConfig.bond}
                                            onChange={(e) => setModuleConfig(prev => ({
                                                ...prev,
                                                bond: e.target.value
                                            }))}
                                            placeholder={DEFAULT_BOND}
                                            step="0.000000000000000001"
                                            className="bg-white"
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={() => setModuleConfig(prev => ({
                                                ...prev,
                                                bond: DEFAULT_BOND
                                            }))}
                                            className="whitespace-nowrap"
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Amount of ETH required to submit a verification question
                                    </p>
                                </div>

                                {/* Timeout */}
                                <div className="space-y-2">
                                    <Label htmlFor="timeout" className="text-gray-700">Timeout (seconds)</Label>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            id="timeout"
                                            type="number"
                                            value={moduleConfig.timeout}
                                            onChange={(e) => setModuleConfig(prev => ({
                                                ...prev,
                                                timeout: parseInt(e.target.value)
                                            }))}
                                            placeholder={DEFAULT_TIMEOUTS.TIMEOUT.toString()}
                                            className="bg-white"
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={() => setModuleConfig(prev => ({
                                                ...prev,
                                                timeout: DEFAULT_TIMEOUTS.TIMEOUT
                                            }))}
                                            className="whitespace-nowrap"
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Time allowed for answering verification questions (86400 = 24 hours)
                                    </p>
                                </div>

                                {/* Cooldown */}
                                <div className="space-y-2">
                                    <Label htmlFor="cooldown" className="text-gray-700">Cooldown (seconds)</Label>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            id="cooldown"
                                            type="number"
                                            value={moduleConfig.cooldown}
                                            onChange={(e) => setModuleConfig(prev => ({
                                                ...prev,
                                                cooldown: parseInt(e.target.value)
                                            }))}
                                            placeholder={DEFAULT_TIMEOUTS.COOLDOWN.toString()}
                                            className="bg-white"
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={() => setModuleConfig(prev => ({
                                                ...prev,
                                                cooldown: DEFAULT_TIMEOUTS.COOLDOWN
                                            }))}
                                            className="whitespace-nowrap"
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Waiting period before executing approved transactions (3600 = 1 hour)
                                    </p>
                                </div>

                                {/* Expiration */}
                                <div className="space-y-2">
                                    <Label htmlFor="expiration" className="text-gray-700">Expiration (seconds)</Label>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            id="expiration"
                                            type="number"
                                            value={moduleConfig.expiration}
                                            onChange={(e) => setModuleConfig(prev => ({
                                                ...prev,
                                                expiration: parseInt(e.target.value)
                                            }))}
                                            placeholder={DEFAULT_TIMEOUTS.EXPIRATION.toString()}
                                            className="bg-white"
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={() => setModuleConfig(prev => ({
                                                ...prev,
                                                expiration: DEFAULT_TIMEOUTS.EXPIRATION
                                            }))}
                                            className="whitespace-nowrap"
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Time until questions expire if not answered (604800 = 1 week)
                                    </p>
                                </div>
                            </div>

                            <ContractTermsForm
                                contractTerms={contractTerms}
                                setContractTerms={setContractTerms}
                                escrowMode={escrowMode}
                                chainId={chainId}
                            />

                            {/* Update handleModuleDeploy to use the new config */}
                            <Button
                                onClick={handleModuleDeploy}
                                disabled={!(deployedSafeAddress || existingSafeAddress) || loading}
                                className="w-full py-6 text-lg bg-indigo-600 hover:bg-indigo-700"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Deploying...</span>
                                    </div>
                                ) : moduleDeploymentHash ? (
                                    <div className="flex items-center gap-2">
                                        <CircleCheck className="h-5 w-5" />
                                        <span>Security System Deployed</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        <span>Deploy Security System</span>
                                    </div>
                                )}
                            </Button>

                            <DeploymentStatus
                                moduleDeploymentHash={moduleDeploymentHash}
                                transactionData={transactionData}
                                error={error}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Navigation Button - Show only when both deployments are complete */}
                {deployedSafeAddress && moduleDeploymentHash && (
                    <Card className="border-0 shadow-lg rounded-xl overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50">
                        <CardContent className="p-6">
                            <div className="text-center space-y-4">
                                <CircleCheck className="h-12 w-12 mx-auto text-green-600" />
                                <h2 className="text-2xl font-bold text-gray-800">Lockler Successfully Deployed!</h2>
                                <p className="text-gray-600 max-w-xl mx-auto">
                                    Your Lockler Safe and Security System have been deployed. You can now manage 
                                    your funds and verify transactions through the Lockler Control Panel.
                                </p>
                                <Button 
                                    className="py-6 px-12 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 shadow-md"
                                    onClick={() => navigate(`/control/${deployedSafeAddress}`)}
                                >
                                    Go to Lockler Control Panel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
