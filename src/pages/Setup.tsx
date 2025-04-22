import { useState, useEffect } from "react";
import { parseEther, formatEther, BrowserProvider } from "ethers";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import { deploySafeWithOwners, deployRealityModule } from '../lib/deployment';
import { getDefaultContractTerms } from '../lib/templates';
import { ContractTermsForm } from "../components/ContractTermsForm";
import { Copy, ExternalLink } from "lucide-react";
import { switchChain } from '../lib/utils';

import {
    DEFAULT_SALT_NONCE,
    DEFAULT_TIMEOUTS,
    DEFAULT_BOND,
    SUPPORTED_CHAINS,
    getContractAddresses,
    getBlockExplorer,
    CHAIN_CONFIG,
} from '../lib/constants';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";

import { EscrowContractTerms, Payment } from '../lib/types';
import { uploadContractTerms } from '../lib/ipfs';
import { StepProgressBar } from "../components/StepProgressBar";
import { StepWrapper } from "../components/StepWrapper";
import { useNavigate } from "react-router-dom";
import { ModeSelection } from "../components/setup/ModeSelection";
import { RoleSelection } from "../components/setup/RoleSelection";
import { CounterpartyInput } from "../components/setup/CounterpartyInput";
import { SuccessStep } from "../components/setup/SuccessStep";
import { useChainSelection } from "../hooks/useChainSelection";

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

    const { selectedChainId, setSelectedChainId } = useChainSelection();

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

    const contracts = getContractAddresses(selectedChainId);
    const blockExplorer = getBlockExplorer(selectedChainId);

    const handleSafeDeploy = async () => {
        setLoading(true);
        setError(null);

        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed');
            }

            if (!selectedChainId || !CHAIN_CONFIG[selectedChainId]) {
                throw new Error(`Invalid chain ID: ${selectedChainId}. Please select a supported chain.`);
            }

            console.log("Deploying to chain ID:", selectedChainId);

            const switchResult = await switchChain(selectedChainId);
            if (!switchResult.success) {
                throw new Error(`Failed to switch to ${CHAIN_CONFIG[selectedChainId].name}: ${switchResult.error}`);
            }

            const provider = switchResult.provider as BrowserProvider;
            const safeAddress = await deploySafeWithOwners(
                provider,
                escrowMode,
                p2pRole,
                counterpartyAddress,
                saltNonce,
                contracts,
                selectedChainId
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

            if (!selectedChainId || !CHAIN_CONFIG[selectedChainId]) {
                throw new Error(`Invalid chain ID: ${selectedChainId}. Please select a supported chain.`);
            }

            console.log("Deploying module to chain ID:", selectedChainId);

            const switchResult = await switchChain(selectedChainId);
            if (!switchResult.success) {
                throw new Error(`Failed to switch to ${CHAIN_CONFIG[selectedChainId].name}: ${switchResult.error}`);
            }

            const cid = await uploadContractTerms(contractTerms);

            const provider = switchResult.provider as BrowserProvider;
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

            setStep(3);
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

    const handleCopyAddress = () => {
        if (deployedSafeAddress) {
            navigator.clipboard.writeText(deployedSafeAddress);
            toast({
                title: "Address copied!",
                description: "Lockler address copied to clipboard.",
            });
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#1a1831] to-[#231a2c] items-center justify-center py-7 px-3">
            <StepWrapper wide={step === 2}>
                <div className="mb-4 text-center">
                    <div className="flex items-center mt-1 justify-center">
                        <span className="font-semibold mr-2">Deploying on:</span>
                        <div>
                            <Select
                                value={selectedChainId ? selectedChainId.toString() : Object.keys(CHAIN_CONFIG)[0]}
                                onValueChange={(value) => {
                                    const chainId = parseInt(value);
                                    console.log("Setting chain ID to:", chainId);
                                    setSelectedChainId(chainId);
                                }}
                            >
                                <SelectTrigger className="h-7 w-[140px] text-xs bg-purple-800/30 border-purple-600">
                                    <SelectValue>
                                        {selectedChainId && CHAIN_CONFIG[selectedChainId]?.name
                                            ? CHAIN_CONFIG[selectedChainId].name
                                            : "Select Chain"}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(CHAIN_CONFIG).map(([id, config]) => (
                                        <SelectItem key={id} value={id}>
                                            {config.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <StepProgressBar step={step} total={3} />
                </div>

                {step === 1 && (
                    <div>
                        <div className="mt-3 mb-2 text-center">
                            <div className="text-sm text-purple-300 font-semibold mb-1">
                                Step 1 of 3
                            </div>
                            <h1 className="text-2xl font-extrabold text-white mb-2">
                                Create Lockler Safe
                            </h1>
                            <p className="text-sm text-purple-200 mb-2 px-2">
                                A cheerful, secure smart wallet with multi-sig protection!
                            </p>
                        </div>
                        <div className="rounded-xl bg-purple-900/30 border border-purple-900 px-3 py-2 mb-4">
                            <div className="text-xs text-purple-100 text-center">
                                <span className="font-semibold">Lockler uses Gnosis Safe under the hood</span> — a highly secure, multi-signature smart contract wallet.
                            </div>
                        </div>

                        <ModeSelection escrowMode={escrowMode} setEscrowMode={setEscrowMode} />
                        <RoleSelection escrowMode={escrowMode} p2pRole={p2pRole} setP2PRole={setP2PRole} />
                        <CounterpartyInput
                            escrowMode={escrowMode}
                            p2pRole={p2pRole}
                            counterpartyAddress={counterpartyAddress}
                            setCounterpartyAddress={setCounterpartyAddress}
                        />

                        <Button
                            className="w-full py-3 rounded-3xl text-lg bg-gradient-to-br from-pink-500 to-purple-500 mt-4 font-bold transition-colors shadow-lg"
                            onClick={handleSafeDeploy}
                            disabled={loading || !!deployedSafeAddress || (escrowMode === 'p2p' && !counterpartyAddress)}
                        >
                            {loading ? "Deploying…" : deployedSafeAddress ? "Lockler Safe Created!" : "Create Lockler Safe"}
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="w-full animate-scale-in">
                        <div className="mt-3 mb-4 text-center px-1">
                            <div className="text-sm text-purple-300 font-semibold mb-1">
                                Step 2 of 3
                            </div>
                            <h1 className="text-2xl font-extrabold text-white mb-2">
                                Security System Setup
                            </h1>
                            <p className="text-sm text-purple-200 mb-4 px-2">
                                Kleros Reality Module secures your Lockler with cheerful verification!
                            </p>
                        </div>

                        <div className="bg-purple-900/30 border border-purple-700 p-6 rounded-2xl mb-6">
                            <div className="text-lg text-purple-100 font-semibold mb-4">Fund Release Conditions</div>
                            <ContractTermsForm
                                contractTerms={contractTerms}
                                setContractTerms={setContractTerms}
                                escrowMode={escrowMode}
                                chainId={selectedChainId}
                            />
                        </div>

                        <Button
                            onClick={handleModuleDeploy}
                            disabled={!(deployedSafeAddress || existingSafeAddress) || loading}
                            className="w-full py-3 rounded-3xl text-lg bg-gradient-to-br from-pink-500 to-purple-500"
                        >
                            {loading ? "Deploying…" : moduleDeploymentHash ? "Security System Ready!" : "Create Security System"}
                        </Button>

                        {moduleDeploymentHash && (
                            <div className="rounded-xl bg-gradient-to-r from-purple-600/20 to-fuchsia-500/10 mt-4 py-3 px-4 border border-purple-800 text-white text-sm text-center shadow">
                                <div className="mb-1">
                                    <span className="font-bold">Lockler Safe:</span> {deployedSafeAddress}
                                </div>
                                <div>
                                    <span className="font-bold">Security Module Hash:</span> {moduleDeploymentHash}
                                </div>
                                <Button
                                    className="mt-3 w-full rounded-3xl text-base bg-gradient-to-r from-green-400 to-green-600"
                                    onClick={() => setStep(3)}
                                >
                                    Go to Final Step
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <SuccessStep
                        deployedSafeAddress={deployedSafeAddress}
                        handleCopyAddress={handleCopyAddress}
                        transactionData={transactionData}
                        selectedChainId={selectedChainId}
                    />
                )}
            </StepWrapper>
        </div>
    );
}
