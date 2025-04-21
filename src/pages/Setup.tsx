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
import { StepProgressBar } from "../components/StepProgressBar";
import { StepWrapper } from "../components/StepWrapper";

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
    const [escrowMode, setEscrowMode] = useState<EscrowMode>('p2p');
    const [p2pRole, setP2PRole] = useState<P2PRole>('sender');
    const [counterpartyAddress, setCounterpartyAddress] = useState<string>("");

    const [chainId, setChainId] = useState<number>(DEFAULT_CHAIN_ID);

    const [saltNonce, setSaltNonce] = useState(DEFAULT_SALT_NONCE);
    const [deployedSafeAddress, setDeployedSafeAddress] = useState<string | null>(null);
    const [existingSafeAddress, setExistingSafeAddress] = useState("");

    const [moduleDeploymentHash, setModuleDeploymentHash] = useState<string | null>(null);
    const [transactionData, setTransactionData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [contractTerms, setContractTerms] = useState<EscrowContractTerms>(() =>
        getDefaultContractTerms('p2p', '', '')
    );

    const [moduleConfig, setModuleConfig] = useState<ModuleConfig>({
        timeout: DEFAULT_TIMEOUTS.TIMEOUT,
        cooldown: DEFAULT_TIMEOUTS.COOLDOWN,
        expiration: DEFAULT_TIMEOUTS.EXPIRATION,
        bond: DEFAULT_BOND
    });

    const { toast } = useToast();

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

    const contracts = getContractAddresses(chainId);
    const blockExplorer = getBlockExplorer(chainId);

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
                title: "Locker Safe Created!",
                description: `Your new Locker Safe is: ${safeAddress}`,
            });

            setTimeout(() => setStep(2), 1200);
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

    const [step, setStep] = useState(1);

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#1a1831] to-[#231a2c] items-center justify-center py-7 px-2">
            {step === 1 ? (
                <StepWrapper>
                    <StepProgressBar step={1} total={2} />
                    <div className="mt-2 mb-4">
                        <div className="text-sm text-purple-300 font-semibold mb-2 text-center">
                            Step 1 of 2
                        </div>
                        <h1 className="text-3xl font-extrabold text-white text-center mb-1">Create Locker Safe</h1>
                        <p className="text-lg text-purple-200 text-center mb-3">
                            A cheerful, secure smart wallet with multi-sig protection!
                        </p>
                        <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/5 mb-5 px-4 py-2">
                            <span className="text-xs text-purple-300">
                                Locker uses Gnosis Safe under the hood — a highly secure, multi-signature smart contract wallet.
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 mb-5">
                        <Button
                            variant={escrowMode === 'p2p' ? 'default' : 'outline'}
                            onClick={() => setEscrowMode('p2p')}
                            className={`rounded-xl py-6 w-full text-left transition-all ${escrowMode === 'p2p' ? 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white scale-105' : 'bg-gray-900 text-white/80'}`}
                        >
                            <div className="font-bold text-lg">Transfer Locker</div>
                            <div className="text-sm opacity-85 pt-1">Use for one-to-one transfers that require both parties to agree to release funds.</div>
                        </Button>
                        <Button
                            variant={escrowMode === 'grant' ? 'default' : 'outline'}
                            onClick={() => setEscrowMode('grant')}
                            className={`rounded-xl py-6 w-full text-left transition-all ${escrowMode === 'grant' ? 'bg-gradient-to-br from-fuchsia-500 to-pink-400 text-white scale-105' : 'bg-gray-900 text-white/80'}`}
                        >
                            <div className="font-bold text-lg">Grant Locker</div>
                            <div className="text-sm opacity-85 pt-1">Distribute funds to multiple recipients with security and agreement checks.</div>
                        </Button>
                    </div>
                    {escrowMode === 'p2p' && (
                        <div className="mb-4">
                            <label className="block text-purple-200 font-bold mb-2">Your Role</label>
                            <div className="flex gap-2">
                                <Button
                                    variant={p2pRole === 'sender' ? 'default' : 'outline'}
                                    onClick={() => setP2PRole('sender')}
                                    className={`rounded-full flex-1 transition-all ${p2pRole === 'sender' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-gray-800 text-gray-200'}`}
                                >
                                    I am the Sender
                                </Button>
                                <Button
                                    variant={p2pRole === 'receiver' ? 'default' : 'outline'}
                                    onClick={() => setP2PRole('receiver')}
                                    className={`rounded-full flex-1 transition-all ${p2pRole === 'receiver' ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white' : 'bg-gray-800 text-gray-200'}`}
                                >
                                    I am the Receiver
                                </Button>
                            </div>
                        </div>
                    )}
                    {escrowMode === 'p2p' && (
                        <div className="mb-2">
                            <Label className="text-purple-100">{
                                p2pRole === 'sender' ? 'Receiver' : 'Sender'
                            } Address</Label>
                            <Input 
                                className="rounded-xl bg-gray-900 mt-1 text-white"
                                value={counterpartyAddress}
                                onChange={(e) => setCounterpartyAddress(e.target.value)}
                                placeholder={`Enter ${p2pRole === 'sender' ? 'receiver' : 'sender'} Ethereum address`}
                            />
                        </div>
                    )}
                    <Button
                        className="w-full py-4 rounded-xl text-lg bg-gradient-to-br from-pink-500 to-purple-500 mt-5"
                        onClick={handleSafeDeploy}
                        disabled={loading || !!deployedSafeAddress || (escrowMode === 'p2p' && !counterpartyAddress)}
                    >
                        {loading ? "Deploying…" : deployedSafeAddress ? "Locker Safe Created!" : "Create Locker Safe"}
                    </Button>
                </StepWrapper>
            ) : (
                <StepWrapper>
                    <StepProgressBar step={2} total={2} />
                    <div className="mt-2 mb-4">
                        <div className="text-sm text-purple-300 font-semibold mb-2 text-center">Step 2 of 2</div>
                        <h1 className="text-3xl font-extrabold text-white text-center mb-1">Security System Setup</h1>
                        <p className="text-lg text-purple-200 text-center mb-3">
                            Kleros Reality Module secures your Locker with cheerful verification!
                        </p>
                        <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/5 mb-3 px-4 py-2">
                            <span className="text-xs text-purple-300">
                                This module uses Kleros for fund release verification, using optimistic oracle technology.
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                            <Label className="text-purple-100 text-xs">Question Bond</Label>
                            <Input
                                id="bond"
                                type="number"
                                value={moduleConfig.bond}
                                onChange={e => setModuleConfig(prev => ({
                                    ...prev, bond: e.target.value
                                }))}
                                className="rounded-xl bg-gray-900 mt-1 text-white text-xs"
                                placeholder={DEFAULT_BOND}
                                step="0.000000000000000001"
                            />
                        </div>
                        <div>
                            <Label className="text-purple-100 text-xs">Timeout (s)</Label>
                            <Input
                                id="timeout"
                                type="number"
                                value={moduleConfig.timeout}
                                onChange={e => setModuleConfig(prev => ({
                                    ...prev, timeout: parseInt(e.target.value)
                                }))}
                                className="rounded-xl bg-gray-900 mt-1 text-white text-xs"
                                placeholder={DEFAULT_TIMEOUTS.TIMEOUT?.toString()}
                            />
                        </div>
                        <div>
                            <Label className="text-purple-100 text-xs">Cooldown (s)</Label>
                            <Input
                                id="cooldown"
                                type="number"
                                value={moduleConfig.cooldown}
                                onChange={e => setModuleConfig(prev => ({
                                    ...prev, cooldown: parseInt(e.target.value)
                                }))}
                                className="rounded-xl bg-gray-900 mt-1 text-white text-xs"
                                placeholder={DEFAULT_TIMEOUTS.COOLDOWN?.toString()}
                            />
                        </div>
                        <div>
                            <Label className="text-purple-100 text-xs">Expiration (s)</Label>
                            <Input
                                id="expiration"
                                type="number"
                                value={moduleConfig.expiration}
                                onChange={e => setModuleConfig(prev => ({
                                    ...prev, expiration: parseInt(e.target.value)
                                }))}
                                className="rounded-xl bg-gray-900 mt-1 text-white text-xs"
                                placeholder={DEFAULT_TIMEOUTS.EXPIRATION?.toString()}
                            />
                        </div>
                    </div>
                    <div className="rounded-lg bg-purple-900/30 border border-purple-700 px-3 py-2 mb-2">
                        <div className="text-xs text-purple-200 mb-1 font-semibold">Fund Release Conditions</div>
                        <ContractTermsForm
                            contractTerms={contractTerms}
                            setContractTerms={setContractTerms}
                            escrowMode={escrowMode}
                            chainId={chainId}
                        />
                    </div>
                    <Button
                        onClick={handleModuleDeploy}
                        disabled={!(deployedSafeAddress || existingSafeAddress) || loading}
                        className="w-full py-4 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 mt-4 text-lg"
                    >
                        {loading ? "Deploying…" 
                            : moduleDeploymentHash
                                ? "Security System Ready!" 
                                : "Create Security System"}
                    </Button>
                    {moduleDeploymentHash && (
                        <div className="rounded-xl bg-gradient-to-r from-purple-600/20 to-fuchsia-500/10 mt-5 py-3 px-4 border border-purple-800 text-white text-sm text-center shadow">
                            <div className="mb-1">
                                <span className="font-bold">Locker Safe:</span> {deployedSafeAddress}
                            </div>
                            <div>
                                <span className="font-bold">Security Module Hash:</span> {moduleDeploymentHash}
                            </div>
                            <Button 
                                className="mt-3 w-full rounded-xl text-base bg-gradient-to-r from-green-400 to-green-600"
                                onClick={() => navigate(`/control/${deployedSafeAddress}`)}
                            >
                                Go to Lockler Control
                            </Button>
                        </div>
                    )}
                </StepWrapper>
            )}
        </div>
    );
}
