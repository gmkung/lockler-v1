import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { getDefaultContractTerms } from '../lib/templates';
import { Lock } from "lucide-react";
import { AppTopBar } from '@/components/AppTopBar';
import { DeploymentModal } from '@/components/setup/DeploymentModal';
import { useDeployment } from '../hooks/useDeployment';

import {
    DEFAULT_SALT_NONCE,
    DEFAULT_TIMEOUTS,
    DEFAULT_BOND,
    CHAIN_CONFIG,
} from '../lib/constants';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";

import { EscrowContractTerms } from '../lib/types';
import { StepProgressBar } from "../components/StepProgressBar";
import { StepWrapper } from "../components/StepWrapper";
import { ModeSelection } from "../components/setup/ModeSelection";
import { RoleSelection } from "../components/setup/RoleSelection";
import { CounterpartyInput } from "../components/setup/CounterpartyInput";
import { SuccessStep } from "../components/setup/SuccessStep";
import { useChainSelection } from "../hooks/useChainSelection";
import { ContractTermsForm } from "../components/ContractTermsForm";
import { Footer } from '../components/ui/footer';
import { Input } from "../components/ui/input";

type EscrowMode = 'p2p' | 'grant';
type P2PRole = 'sender' | 'receiver';

interface ModuleConfig {
    timeout: number;
    cooldown: number;
    expiration: number;
    bond: string;
}

export default function Setup() {
    const { selectedChainId, setSelectedChainId } = useChainSelection();
    const { toast } = useToast();

    // Form state
    const [escrowMode, setEscrowMode] = useState<EscrowMode>('p2p');
    const [p2pRole, setP2PRole] = useState<P2PRole>('sender');
    const [counterpartyAddress, setCounterpartyAddress] = useState<string>("");
    const [saltNonce, setSaltNonce] = useState(DEFAULT_SALT_NONCE);
    const [existingSafeAddress, setExistingSafeAddress] = useState("");
    const [contractTerms, setContractTerms] = useState<EscrowContractTerms>(() =>
        getDefaultContractTerms('p2p', '', '')
    );

    // Deployment state and functions using the custom hook
    const {
        deployedSafeAddress,
        moduleDeploymentHash,
        transactionData,
        error,
        loading,
        deployModalOpen,
        setDeployModalOpen,
        handleSafeDeploy,
        handleModuleDeploy,
        handleStartDeployment
    } = useDeployment({
        escrowMode,
        p2pRole,
        counterpartyAddress,
        saltNonce,
        contractTerms,
        chainId: selectedChainId
    });

    // Update contract terms when form fields change
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_requestAccounts' })
                .then((accounts: string[]) => {
                    if (accounts[0]) {
                        const terms = getDefaultContractTerms(
                            escrowMode,
                            accounts[0],
                            counterpartyAddress,
                            p2pRole
                        );
                        
                        setContractTerms(terms);
                    }
                });
        }
    }, [escrowMode, counterpartyAddress, p2pRole, selectedChainId]);

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
    
    const goToSuccessStep = () => {
        setStep(2);
    };

    const ChainSelector = () => (
        <div className="flex items-center mt-1 justify-center">
            <span className="font-semibold mr-2 text-soft-purple">Deploying on:</span>
            <div className="relative">
                <Select
                    value={selectedChainId ? selectedChainId.toString() : Object.keys(CHAIN_CONFIG)[0]}
                    onValueChange={(value) => {
                        if (!deployedSafeAddress) {
                            const chainId = parseInt(value);
                            console.log("Setting chain ID to:", chainId);
                            setSelectedChainId(chainId);
                        }
                    }}
                    disabled={!!deployedSafeAddress}
                >
                    <SelectTrigger className={`h-7 w-[140px] text-xs bg-purple-800/30 border-purple-600 text-soft-purple ${deployedSafeAddress ? 'cursor-not-allowed opacity-80' : ''}`}>
                        <SelectValue>
                            {selectedChainId && CHAIN_CONFIG[selectedChainId]?.name
                                ? CHAIN_CONFIG[selectedChainId].name
                                : "Select Chain"}
                        </SelectValue>
                        {deployedSafeAddress && (
                            <Lock className="h-3 w-3 ml-1 text-purple-400" />
                        )}
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(CHAIN_CONFIG).map(([id, config]) => (
                            <SelectItem 
                                key={id} 
                                value={id} 
                                className="text-soft-purple hover:bg-purple-900/30"
                            >
                                {config.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#1a1831] to-[#231a2c]">
            <AppTopBar 
              pageTitle="Create Lockler"
              chainId={selectedChainId}
            />
            
            <div className="flex-grow flex items-center justify-center py-7 px-3">
                <StepWrapper wide={step === 1}>
                    <div className="mb-4 text-center">
                        <ChainSelector />
                    </div>

                    <div className="mb-4">
                        <StepProgressBar step={step} total={2} />
                    </div>

                    {step === 1 && (
                        <div>
                            <div className="mt-3 mb-2 text-center">
                                <div className="text-sm text-purple-300 font-semibold mb-1">
                                    Step 1 of 2
                                </div>
                                <h1 className="text-2xl font-extrabold text-white mb-2">
                                    Configure Your Lockler
                                </h1>
                                <p className="text-sm text-purple-200 mb-2 px-2">
                                    Create single-use smart contract escrows addresses, secured by Kleros
                                </p>
                            </div>
        

                            {/* Escrow Configuration Section */}
                            <div className="bg-purple-900/20 border border-purple-700/50 p-4 rounded-xl mb-6">
                                <h2 className="text-lg text-purple-100 font-semibold mb-3">Escrow Configuration</h2>
                                <ModeSelection escrowMode={escrowMode} setEscrowMode={setEscrowMode} />
                                
                                {escrowMode === 'p2p' && (
                                    <div className="mb-4 px-1">
                                        <label className="block text-purple-200 font-bold mb-2">
                                            Your Role
                                        </label>
                                        <div className="flex gap-3 items-center">
                                            <div className="w-1/3">
                                                <Select
                                                    value={p2pRole}
                                                    onValueChange={(value: P2PRole) => setP2PRole(value)}
                                                >
                                                    <SelectTrigger className="h-10 rounded-xl bg-gray-900 text-white border-0 focus:ring-2 focus:ring-purple-500">
                                                        <SelectValue placeholder="Select role">
                                                            {p2pRole === 'sender' ? 'I am the Sender' : 'I am the Receiver'}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-gray-900 text-white border-purple-800">
                                                        <SelectItem value="sender" className="hover:bg-purple-900/30">I am the Sender</SelectItem>
                                                        <SelectItem value="receiver" className="hover:bg-purple-900/30">I am the Receiver</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex-1">
                                                <Input
                                                    className="rounded-xl bg-gray-900 text-white text-sm border-0 focus:ring-2 focus:ring-pink-400 h-10 w-full"
                                                    value={counterpartyAddress}
                                                    onChange={(e) => setCounterpartyAddress(e.target.value)}
                                                    placeholder={`Enter ${p2pRole === 'sender' ? 'receiver' : 'sender'} Ethereum address`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Fund Release Conditions Section */}
                            <div className="bg-purple-900/20 border border-purple-700/50 p-4 rounded-xl mb-6">
                                <h2 className="text-lg text-purple-100 font-semibold mb-3">Fund Release Conditions</h2>
                                <ContractTermsForm
                                    contractTerms={contractTerms}
                                    setContractTerms={setContractTerms}
                                    escrowMode={escrowMode}
                                    chainId={selectedChainId}
                                />
                            </div>

                            <Button
                                className="w-full py-3 rounded-3xl text-lg bg-gradient-to-br from-pink-500 to-purple-500 mt-4 font-bold transition-colors shadow-lg"
                                onClick={handleStartDeployment}
                                disabled={loading || !!deployedSafeAddress || (escrowMode === 'p2p' && !counterpartyAddress)}
                            >
                                {loading ? "Deploying…" : 
                                 deployedSafeAddress && moduleDeploymentHash ? "Lockler Ready!" : 
                                 "Create Lockler"}
                            </Button>
                            
                            {error && (
                                <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
                                    {error}
                                </div>
                            )}
                            
                            <DeploymentModal
                                open={deployModalOpen}
                                onOpenChange={setDeployModalOpen}
                                onDeploySafe={handleSafeDeploy}
                                onDeployModule={handleModuleDeploy}
                                onFinish={goToSuccessStep}
                                safeAddress={deployedSafeAddress}
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <SuccessStep
                            deployedSafeAddress={deployedSafeAddress}
                            handleCopyAddress={handleCopyAddress}
                            transactionData={transactionData}
                            selectedChainId={selectedChainId}
                        />
                    )}
                </StepWrapper>
            </div>
            <Footer />
        </div>
    );
}
