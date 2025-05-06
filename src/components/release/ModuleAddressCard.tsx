import React, { useState, useEffect } from "react";
import { ExternalLink, CheckCircle2, Info, Copy as CopyIcon, Shield, Clock, Calendar, Timer, Banknote, Coins, Eye, EyeOff, Scale } from "lucide-react";
import { getBlockExplorer, SUPPORTED_CHAINS } from "../../lib/constants";
import { SecurityChecksModal } from "./SecurityChecksModal";
import { useToast } from "@/hooks/use-toast";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { getAvailableTokens } from '@/lib/currency';
import { fetchTokenBalances } from '@/lib/web3';
import { useAccount } from 'wagmi';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ModuleAddressCardProps {
    chainId: number;
    safeAddress?: string;
    moduleAddress?: string;
    modules: Array<{
        address: string;
        isEnabled: boolean;
        isRealityModule: boolean;
        validationChecks: {
            isMinimalProxy: boolean;
            implementationMatches: boolean;
            isOwner: boolean;
            hasValidThreshold: boolean;
            hasValidOwnerCount: boolean;
            isOnlyEnabledModule: boolean;
        };
    }>;
    moduleCooldown: number | null;
    moduleExpiration: number | null;
    moduleTimeout: number | null;
    moduleBond: bigint | null;
    moduleArbitrator?: string | null;
    formatSeconds: (seconds: number | null | undefined) => string;
    formatBond: (bondValue: bigint | null | undefined, chainId: number | null) => string;
    className?: string;
}

export function ModuleAddressCard({
    chainId,
    safeAddress,
    moduleAddress,
    modules,
    moduleCooldown,
    moduleExpiration,
    moduleTimeout,
    moduleBond,
    moduleArbitrator,
    formatSeconds,
    formatBond,
    className
}: ModuleAddressCardProps) {
    const blockExplorer = getBlockExplorer(chainId);
    const [checksOpen, setChecksOpen] = useState(false);
    const { toast } = useToast();
    const [copying, setCopying] = useState({ safe: false, module: false, arbitrator: false });

    // Token balances state
    const [balances, setBalances] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [showAllTokens, setShowAllTokens] = useState(false);
    const { isConnected } = useAccount();

    // Find the module, compute total/passed checks
    const module = modules && modules[0];
    const securityChecks = module
        ? [
            module.isEnabled,
            module.isRealityModule,
            ...Object.values(module.validationChecks)
        ]
        : [];
    const totalChecks = securityChecks.length;
    const passedChecks = securityChecks.filter(Boolean).length;
    const allChecksPassed = passedChecks === totalChecks && totalChecks > 0;

    const getSafeAppUrl = () => {
        if (!safeAddress || !chainId) return '';
        let chainPrefix = '1';
        if (chainId === SUPPORTED_CHAINS.GNOSIS) {
            chainPrefix = 'gno';
        } else if (chainId === SUPPORTED_CHAINS.MAINNET) {
            chainPrefix = 'eth';
        }
        return `https://app.safe.global/apps/open?safe=${chainPrefix}:${safeAddress}&appUrl=https%3A%2F%2Fzodiac.gnosisguild.org%2F`;
    };

    const handleCopy = async (text: string, field: "safe" | "module" | "arbitrator") => {
        try {
            await navigator.clipboard.writeText(text);
            setCopying(prev => ({ ...prev, [field]: true }));
            let fieldName = field.charAt(0).toUpperCase() + field.slice(1);
            if (field === 'safe') fieldName = 'Safe';
            if (field === 'module') fieldName = 'Module';
            toast({
                title: "Copied!",
                description: `${fieldName} address copied to clipboard.`,
            });
            setTimeout(() => setCopying(prev => ({ ...prev, [field]: false })), 1200);
        } catch (error) {
            toast({ title: "Error", description: "Failed to copy address.", variant: "destructive" });
        }
    };

    // Load token balances
    useEffect(() => {
        const loadBalances = async () => {
            if (!chainId || !safeAddress) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);

            try {
                const tokens = getAvailableTokens(chainId);
                const tokensWithBalances = await fetchTokenBalances(
                    tokens.map(t => t.address),
                    safeAddress,
                    chainId
                );

                setBalances(tokensWithBalances);
            } catch (error) {
                console.error("Error fetching token balances:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadBalances();
    }, [chainId, safeAddress, isConnected]);

    const availableTokens = getAvailableTokens(chainId);

    // Filter tokens to show only positive balances if showAllTokens is false
    const tokensToDisplay = availableTokens.filter(token => {
        const balance = balances[token.address] || '0';
        // Convert to number and check if greater than zero
        return showAllTokens || parseFloat(balance) > 0;
    });

    // Count of zero balance tokens that are hidden
    const hiddenTokensCount = availableTokens.length - tokensToDisplay.length;

    return (
        <Card className={cn("bg-gray-900 rounded-3xl border border-gray-800 p-4 shadow-2xl mb-4", className)}>
            <div className="flex items-center mb-3">
                <Shield className="h-5 w-5 text-purple-400 mr-2" />
                <h2 className="text-xl font-semibold text-white">Configurations</h2>

                <div className="flex items-center gap-2 ml-2">
                    <div
                        className="cursor-pointer"
                        onClick={() => setChecksOpen(true)}
                        role="button"
                        title={`${passedChecks} of ${totalChecks} security checks passed. Click for details.`}
                    >
                        {allChecksPassed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                            <Info className="h-5 w-5 text-yellow-400" />
                        )}
                    </div>

                    {safeAddress && chainId && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 p-0 text-gray-400 hover:text-gray-300"
                                        onClick={() => window.open(getSafeAppUrl(), '_blank')}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[250px]">
                                    <p className="text-xs">
                                        A Lockler is a specially configured Safe with Reality Module.
                                        Click to inspect the settings on the Safe app.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {/* Safe Address */}
                <div className="bg-gray-800/50 p-2 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs">Safe address:</span>
                        <div className="flex items-center gap-1.5 ml-2 max-w-[calc(100%-120px)]">
                            <div
                                onClick={() => safeAddress && handleCopy(safeAddress, "safe")}
                                className="text-sm font-mono text-gray-100 hover:text-white transition-colors truncate cursor-pointer"
                                title={safeAddress || "--"}
                            >
                                {safeAddress || "--"}
                            </div>
                            <div className="flex-shrink-0 flex gap-1">
                                <button
                                    onClick={() => safeAddress && handleCopy(safeAddress, "safe")}
                                    className="p-1 rounded-md hover:bg-gray-700/70 transition-colors"
                                    title="Copy Safe address"
                                >
                                    <CopyIcon className={`h-3.5 w-3.5 text-pink-300 transition ${copying.safe ? "opacity-100" : "opacity-60"}`} />
                                </button>
                                {blockExplorer && safeAddress && (
                                    <a
                                        href={`${blockExplorer}/address/${safeAddress}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded-md hover:bg-gray-700/70 transition-colors"
                                        aria-label="View on explorer"
                                        title="View on explorer"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5 text-gray-400 hover:text-gray-200" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Module Address */}
                <div className="bg-gray-800/50 p-2 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs">Reality module address:</span>
                        <div className="flex items-center gap-1.5 ml-2 max-w-[calc(100%-120px)]">
                            <div
                                onClick={() => moduleAddress && handleCopy(moduleAddress, "module")}
                                className="text-sm font-mono text-gray-100 hover:text-white transition-colors truncate cursor-pointer"
                                title={moduleAddress || "--"}
                            >
                                {moduleAddress || "--"}
                            </div>
                            <div className="flex-shrink-0 flex gap-1">
                                <button
                                    onClick={() => moduleAddress && handleCopy(moduleAddress, "module")}
                                    className="p-1 rounded-md hover:bg-gray-700/70 transition-colors"
                                    title="Copy Module address"
                                >
                                    <CopyIcon className={`h-3.5 w-3.5 text-pink-300 transition ${copying.module ? "opacity-100" : "opacity-60"}`} />
                                </button>
                                {blockExplorer && moduleAddress && (
                                    <a
                                        href={`${blockExplorer}/address/${moduleAddress}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded-md hover:bg-gray-700/70 transition-colors"
                                        aria-label="View on explorer"
                                        title="View on explorer"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5 text-gray-400 hover:text-gray-200" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Module Configuration and Token Balances in a flex row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Module Configuration */}
                    <div className="bg-gray-800/50 p-2.5 rounded-lg border border-gray-700 h-full">
                        <div className="flex items-center mb-1.5">
                            <Info className="h-4 w-4 text-blue-400 mr-1" />
                            <div className="text-blue-400 text-sm font-medium">Module Configuration</div>
                        </div>

                        <div className="space-y-1.5">
                            {/* Cooldown */}
                            <div className="flex items-center justify-between">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center cursor-help">
                                                <Clock className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
                                                <span className="text-gray-400 text-xs">Execution Cooldown:</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[250px]">
                                            <p className="text-xs">Waiting period required after an oracle provides an answer before the transaction can be executed.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <span className="text-gray-200 text-xs font-medium">{formatSeconds(moduleCooldown)}</span>
                            </div>
                            {/* Expiration */}
                            <div className="flex items-center justify-between">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center cursor-help">
                                                <Calendar className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
                                                <span className="text-gray-400 text-xs">Answer Expiration:</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[250px]">
                                            <p className="text-xs">Duration that a positive answer from the oracle remains valid. After this period, the answer expires and the proposal becomes invalid. Set to 0 for no expiration.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <span className="text-gray-200 text-xs font-medium">{formatSeconds(moduleExpiration)}</span>
                            </div>
                            {/* Timeout */}
                            <div className="flex items-center justify-between">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center cursor-help">
                                                <Timer className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
                                                <span className="text-gray-400 text-xs">Timeout:</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[250px]">
                                            <p className="text-xs">Time limit for providing answers to a question before it becomes finalised. </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <span className="text-gray-200 text-xs font-medium">{formatSeconds(moduleTimeout)}</span>
                            </div>
                            {/* Bond */}
                            <div className="flex items-center justify-between">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center cursor-help">
                                                <Banknote className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
                                                <span className="text-gray-400 text-xs">Minimum Bond:</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[250px]">
                                            <p className="text-xs">Amount of native currency that a transaction proposer needs to put up as deposit to prevent abuse. This amount will only be lost if the proposal was successfully challenged.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <span className="text-gray-200 text-xs font-medium">{formatBond(moduleBond, chainId)}</span>
                            </div>
                            {/* Arbitrator */}
                            <div className="flex items-center justify-between">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center cursor-help">
                                                <Scale className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
                                                <span className="text-gray-400 text-xs">Arbitrator:</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[250px]">
                                            <p className="text-xs">Contract responsible for resolving disputes if an answer is challenged.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <div className="flex items-center gap-1.5 ml-2 max-w-[calc(100%-80px)]">
                                    <div
                                        onClick={() => moduleArbitrator && handleCopy(moduleArbitrator, "arbitrator")}
                                        className="text-xs font-mono text-gray-100 hover:text-white transition-colors truncate cursor-pointer"
                                        title={moduleArbitrator || "--"}
                                    >
                                        {moduleArbitrator ? `${moduleArbitrator.slice(0, 6)}...${moduleArbitrator.slice(-4)}` : "--"}
                                    </div>
                                    <div className="flex-shrink-0 flex gap-1">
                                        <button
                                            onClick={() => moduleArbitrator && handleCopy(moduleArbitrator, "arbitrator")}
                                            className="p-1 rounded-md hover:bg-gray-700/70 transition-colors"
                                            title="Copy Arbitrator address"
                                            disabled={!moduleArbitrator}
                                        >
                                            <CopyIcon className={`h-3 w-3 text-pink-300 transition ${copying.arbitrator ? "opacity-100" : "opacity-60"}`} />
                                        </button>
                                        {blockExplorer && moduleArbitrator && (
                                            <a
                                                href={`${blockExplorer}/address/${moduleArbitrator}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1 rounded-md hover:bg-gray-700/70 transition-colors"
                                                aria-label="View on explorer"
                                                title="View on explorer"
                                            >
                                                <ExternalLink className="h-3 w-3 text-gray-400 hover:text-gray-200" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Token Balances Section */}
                    <div className="bg-gray-800/50 p-2.5 rounded-lg border border-gray-700 h-full">
                        <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center">
                                <Coins className="h-4 w-4 text-purple-400 mr-1" />
                                <div className="text-purple-400 text-sm font-medium">Token Balances</div>
                            </div>

                            {!isLoading && availableTokens.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-950/30 px-2 py-0.5 h-auto text-xs"
                                    onClick={() => setShowAllTokens(!showAllTokens)}
                                    title={showAllTokens ? "Hide zero balances" : "Show all tokens"}
                                >
                                    {showAllTokens ? (
                                        <><EyeOff className="h-3.5 w-3.5 mr-1" /> Hide zeros</>
                                    ) : (
                                        <><Eye className="h-3.5 w-3.5 mr-1" /> Show all</>
                                    )}
                                </Button>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="space-y-1.5">
                                {[...Array(3)].map((_, index) => (
                                    <Skeleton key={index} className="h-6 bg-gray-700/50 rounded-lg" />
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="space-y-1">
                                    {tokensToDisplay.length > 0 ? (
                                        tokensToDisplay.map(token => {
                                            const balance = balances[token.address] || '0';
                                            return (
                                                <div
                                                    key={token.address}
                                                    className="flex justify-between items-center bg-gray-700/30 px-2.5 py-1 rounded-lg border border-gray-700/70"
                                                >
                                                    <div className="text-gray-300 text-sm">{token.symbol}</div>
                                                    <div className="text-white font-mono text-sm">{balance}</div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-gray-400 text-center w-full py-1.5 text-sm">
                                            {availableTokens.length === 0
                                                ? "No tokens configured for this chain"
                                                : "No tokens with positive balance"}
                                        </div>
                                    )}
                                </div>

                                {!isLoading && hiddenTokensCount > 0 && (
                                    <div className="text-xs text-gray-500 mt-1 text-center">
                                        {hiddenTokensCount} zero-balance token{hiddenTokensCount !== 1 ? 's' : ''} hidden
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* SecurityChecksModal */}
            <SecurityChecksModal
                modules={modules}
                open={checksOpen}
                onOpenChange={setChecksOpen}
                safeAddress={safeAddress}
                chainId={chainId}
                arbitrator={moduleArbitrator}
            />
        </Card>
    );
} 