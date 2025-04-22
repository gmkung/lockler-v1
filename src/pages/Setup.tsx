import { useState, useEffect } from "react";
import {
    BrowserProvider,
    parseEther,
    formatEther,
} from "ethers";
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

    // Use a separate state for the selected chain (independent of connected wallet)
    const [selectedChainId, setSelectedChainId] = useState<number>(SUPPORTED_CHAINS.GNOSIS); // Default to Gnosis

    // Still track the connected wallet's chain for display purposes
    const [connectedChainId, setConnectedChainId] = useState<number | null>(null);
    const [chainName, setChainName] = useState<string>("");

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

    // Track the connected wallet's chain for display purposes only
    useEffect(() => {
        const handleChainChanged = (newChainId: string) => {
            const parsedChainId = parseInt(newChainId, 16);
            setConnectedChainId(parsedChainId);

            // Update chain name display based on the connected chain
            const chainConfig = CHAIN_CONFIG[parsedChainId];
            setChainName(chainConfig ? chainConfig.name : `Chain ${parsedChainId}`);
        };

        if (window.ethereum) {
            window.ethereum.on('chainChanged', handleChainChanged);
            // Get initial chain ID
            window.ethereum.request({ method: 'eth_chainId' })
                .then(handleChainChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, []);

    // Get contract addresses based on the selected chain, not the connected one
    const contracts = getContractAddresses(selectedChainId);
    const blockExplorer = getBlockExplorer(selectedChainId);

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

            // Validate selectedChainId
            if (!selectedChainId || !CHAIN_CONFIG[selectedChainId]) {
                throw new Error(`Invalid chain ID: ${selectedChainId}. Please select a supported chain.`);
            }

            console.log("Deploying to chain ID:", selectedChainId);

            // First, attempt to switch to the selected chain
            const switchResult = await switchChain(selectedChainId);
            if (!switchResult.success) {
                throw new Error(`Failed to switch to ${CHAIN_CONFIG[selectedChainId].name}: ${switchResult.error}`);
            }

            // Use the provider from the switch result
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

            // Validate selectedChainId
            if (!selectedChainId || !CHAIN_CONFIG[selectedChainId]) {
                throw new Error(`Invalid chain ID: ${selectedChainId}. Please select a supported chain.`);
            }

            console.log("Deploying module to chain ID:", selectedChainId);

            // First, ensure we're on the selected chain
            const switchResult = await switchChain(selectedChainId);
            if (!switchResult.success) {
                throw new Error(`Failed to switch to ${CHAIN_CONFIG[selectedChainId].name}: ${switchResult.error}`);
            }

            const cid = await uploadContractTerms(contractTerms);

            // Use the provider from the switch result
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
            <StepWrapper>
                <div className="mb-4 text-center">
                    <div className="text-sm text-purple-300 flex flex-col items-center gap-1">
                        <div>
                            Connected: {chainName || 'Not connected'}
                            {connectedChainId && ` (Chain ID: ${connectedChainId})`}
                        </div>

                        <div className="flex items-center mt-1">
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

                        <div className="flex gap-4 mb-5 px-1 flex-col xs:flex-row sm:flex-row justify-center">
                            <button
                                type="button"
                                onClick={() => setEscrowMode('p2p')}
                                className={`w-full xs:w-1/2 aspect-square max-w-[180px] transition-all rounded-2xl flex flex-col items-center justify-center px-4 py-5 shadow-lg border-2
                                    ${escrowMode === 'p2p'
                                        ? "bg-gradient-to-br from-purple-600 via-purple-600/90 to-indigo-600 ring-2 ring-fuchsia-400 border-transparent scale-105 text-white"
                                        : "bg-[#242038] border border-purple-700 hover:bg-purple-800/30 text-white/85"
                                    }
                                    outline-none focus:outline-none`}
                                style={{ minWidth: 0, wordBreak: 'break-word' }}
                            >
                                <div className="font-bold text-base mb-2 w-full text-center text-white">
                                    Transfer Lockler
                                </div>
                                <div className={`text-xs text-center w-full break-words ${escrowMode === 'p2p' ? "text-purple-100" : "text-purple-300/90"}`}>
                                    For one-to-one transfers needing both parties' agreement.
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setEscrowMode('grant')}
                                className={`w-full xs:w-1/2 aspect-square max-w-[180px] transition-all rounded-2xl flex flex-col items-center justify-center px-4 py-5 shadow-lg border-2
                                    ${escrowMode === 'grant'
                                        ? "bg-gradient-to-br from-pink-500 via-fuchsia-500 to-pink-400 ring-2 ring-pink-300 border-transparent scale-105 text-white"
                                        : "bg-[#242038] border border-purple-700 hover:bg-pink-900/20 text-white/85"
                                    }
                                    outline-none focus:outline-none`}
                                style={{ minWidth: 0, wordBreak: 'break-word' }}
                            >
                                <div className="font-bold text-base mb-2 w-full text-center text-white">
                                    Grant Lockler
                                </div>
                                <div className={`text-xs text-center w-full break-words ${escrowMode === 'grant' ? "text-pink-50" : "text-pink-100/80"}`}>
                                    Distribute funds to recipients with security checks.
                                </div>
                            </button>
                        </div>

                        {escrowMode === 'p2p' && (
                            <div className="mb-4 px-1 text-center">
                                <label className="block text-purple-200 font-bold mb-2">
                                    Your Role
                                </label>
                                <div className="flex gap-3 justify-center">
                                    <Button
                                        variant={p2pRole === 'sender' ? 'default' : 'outline'}
                                        onClick={() => setP2PRole('sender')}
                                        className={`rounded-full flex-1 min-w-[110px] text-sm transition-all ${p2pRole === 'sender' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-gray-800 text-gray-300'
                                            }`}
                                    >
                                        I am the Sender
                                    </Button>
                                    <Button
                                        variant={p2pRole === 'receiver' ? 'default' : 'outline'}
                                        onClick={() => setP2PRole('receiver')}
                                        className={`rounded-full flex-1 min-w-[110px] text-sm transition-all ${p2pRole === 'receiver' ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white' : 'bg-gray-800 text-gray-300'
                                            }`}
                                    >
                                        I am the Receiver
                                    </Button>
                                </div>
                            </div>
                        )}

                        {escrowMode === 'p2p' && (
                            <div className="mb-4 px-1">
                                <Label className="text-purple-100 text-left block mb-1 text-sm">
                                    {p2pRole === 'sender' ? 'Receiver' : 'Sender'} Address
                                </Label>
                                <Input
                                    className="rounded-xl bg-gray-900 mt-1 text-white text-sm"
                                    value={counterpartyAddress}
                                    onChange={(e) => setCounterpartyAddress(e.target.value)}
                                    placeholder={`Enter ${p2pRole === 'sender' ? 'receiver' : 'sender'} Ethereum address`}
                                />
                            </div>
                        )}

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
                    <div className="w-full max-w-[1200px] mx-auto animate-scale-in">
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
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <Label className="text-purple-100 text-xs">Question Bond</Label>
                                <Input
                                    id="bond"
                                    type="number"
                                    value={moduleConfig.bond}
                                    onChange={e => setModuleConfig(prev => ({
                                        ...prev, bond: e.target.value
                                    }))}
                                    className="rounded-2xl bg-gray-900 mt-1 text-white text-xs"
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
                                    className="rounded-2xl bg-gray-900 mt-1 text-white text-xs"
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
                                    className="rounded-2xl bg-gray-900 mt-1 text-white text-xs"
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
                                    className="rounded-2xl bg-gray-900 mt-1 text-white text-xs"
                                    placeholder={DEFAULT_TIMEOUTS.EXPIRATION?.toString()}
                                />
                            </div>
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
                    <div className="flex flex-col items-center text-center animate-fade-in">
                        <div className="text-3xl mb-2 font-extrabold tracking-tight text-gradient-primary">
                            🎉 Tadaa!
                        </div>
                        <div className="text-xl text-white font-bold mb-3">
                            Your single-purpose Lockler is ready 🚀
                        </div>
                        <div className="mb-4 text-purple-200 max-w-xs">
                            Share your Lockler address below to receive deposits, or view & release funds anytime.
                        </div>
                        <div className="w-full flex flex-col gap-2 mb-4">
                            <div className="flex flex-col items-center gap-1 rounded-3xl border border-purple-700 bg-[rgba(44,36,71,0.98)] px-5 py-3">
                                <span className="text-xs uppercase tracking-widest text-purple-400">Lockler Address</span>
                                <div className="flex items-center mt-1 gap-2 select-text">
                                    <span className="font-mono text-white text-sm truncate max-w-[18ch]">{deployedSafeAddress}</span>
                                    <button
                                        aria-label="Copy address"
                                        onClick={handleCopyAddress}
                                        className="p-1 hover:bg-fuchsia-700/30 rounded transition"
                                    >
                                        <Copy size={18} className="text-pink-300" />
                                    </button>
                                    <a
                                        href={`/release/${selectedChainId}/${deployedSafeAddress}`}
                                        className="p-1 hover:bg-indigo-700/30 rounded transition"
                                        target="_blank" rel="noopener noreferrer"
                                        aria-label="View Lockler"
                                    >
                                        <ExternalLink size={18} className="text-indigo-300" />
                                    </a>
                                </div>
                                {transactionData?.contractAddress && (
                                    <div className="mt-2 text-xs text-purple-300">
                                        <span className="font-semibold">Security Module:</span> {transactionData.contractAddress}
                                    </div>
                                )}
                                <div className="flex gap-2 mt-2 w-full">
                                    <Button
                                        className="flex-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white"
                                        onClick={handleCopyAddress}
                                    >
                                        Copy Address
                                    </Button>
                                    <Button
                                        className="flex-1 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-600 text-white"
                                        onClick={() => window.open(`/release/${selectedChainId}/${deployedSafeAddress}`, "_blank")}
                                    >
                                        View Lockler
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="text-purple-200 text-xs mt-2">
                            You can now use your Lockler to securely store and release funds!
                        </div>
                    </div>
                )}
            </StepWrapper>
        </div>
    );
}
