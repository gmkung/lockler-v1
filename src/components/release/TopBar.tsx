
import React, { useState } from "react";
import { Logo } from "../ui/logo";
import { Button } from "../ui/button";
import { ExternalLink, CheckCircle2, Info, Copy as CopyIcon } from "lucide-react";
import { CHAIN_CONFIG, getBlockExplorer } from "../../lib/constants";
import { SecurityChecksModal } from "./SecurityChecksModal";
import { useToast } from "@/hooks/use-toast";

interface TopBarProps {
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
  walletAddress?: string | null;
  onConnectWallet?: () => void;
  onSetupNew?: () => void;
}

export function TopBar({
  chainId,
  safeAddress,
  moduleAddress,
  modules,
  walletAddress,
  onConnectWallet,
  onSetupNew
}: TopBarProps) {
  const blockExplorer = getBlockExplorer(chainId);
  const [checksOpen, setChecksOpen] = useState(false);
  const { toast } = useToast();
  const [copying, setCopying] = useState({ safe: false, module: false });

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

  const handleCopy = async (text: string, field: "safe" | "module") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopying(prev => ({ ...prev, [field]: true }));
      toast({
        title: "Copied!",
        description: `${field === "safe" ? "Safe" : "Module"} address copied to clipboard.`,
      });
      setTimeout(() => setCopying(prev => ({ ...prev, [field]: false })), 1200);
    } catch (error) {
      toast({ title: "Error", description: "Failed to copy address.", variant: "destructive" });
    }
  };

  return (
    <div className="w-full rounded-2xl bg-[#242132] border border-gray-800 p-3 px-4 flex flex-col md:flex-row items-center justify-between gap-2 shadow-lg mb-3">
      {/* Left Section: Logo + Title + Chain/Addresses */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Logo className="h-7 w-7 text-pink-400 shrink-0" />
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-7 truncate">
            Lockler Control
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
            <span className="text-xs text-gray-400">{CHAIN_CONFIG[chainId]?.name}</span>
            {/* Safe address */}
            <span className="flex items-center gap-1">
              <span className="text-xs text-gray-400">Safe:</span>
              <button
                onClick={() => safeAddress && handleCopy(safeAddress, "safe")}
                className="text-xs font-mono bg-[#2D274B] px-2 py-1 rounded text-gray-300 truncate max-w-[116px] border border-transparent hover:border-pink-400/70 transition-colors outline-none"
                title="Copy Safe address"
                style={{ cursor: "pointer" }}
                type="button"
              >
                {safeAddress ? `${safeAddress.slice(0, 6)}...${safeAddress.slice(-4)}` : "--"}
              </button>
              <CopyIcon className={`h-4 w-4 ml-0.5 text-pink-300 transition ${copying.safe ? "opacity-100" : "opacity-50 hover:opacity-90"}`} />
              {blockExplorer && safeAddress && (
                <a
                  href={`${blockExplorer}/address/${safeAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-300"
                  aria-label="Safe on block explorer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </span>
            {/* Module address & checks */}
            <span className="flex items-center gap-1">
              <span className="text-xs text-gray-400">Module:</span>
              <button
                onClick={() => moduleAddress && handleCopy(moduleAddress, "module")}
                className="text-xs font-mono bg-[#2D274B] px-2 py-1 rounded text-gray-300 truncate max-w-[116px] border border-transparent hover:border-pink-400/70 transition-colors outline-none"
                title="Copy Module address"
                style={{ cursor: "pointer" }}
                type="button"
              >
                {moduleAddress ? `${moduleAddress.slice(0, 6)}...${moduleAddress.slice(-4)}` : "--"}
              </button>
              <CopyIcon className={`h-4 w-4 ml-0.5 text-pink-300 transition ${copying.module ? "opacity-100" : "opacity-50 hover:opacity-90"}`} />
              {blockExplorer && moduleAddress && (
                <a
                  href={`${blockExplorer}/address/${moduleAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-300"
                  aria-label="Module on block explorer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              {/* Checkmark right of module */}
              <span
                role="button"
                tabIndex={0}
                onClick={() => setChecksOpen(true)}
                className="cursor-pointer focus:outline-none ml-1"
                aria-label="Security checks"
              >
                {modules && modules[0] && [
                  modules[0].isEnabled,
                  modules[0].isRealityModule,
                  ...Object.values(modules[0].validationChecks)
                ].filter(Boolean).length === (
                  [modules[0].isEnabled, modules[0].isRealityModule, ...Object.values(modules[0].validationChecks)].length
                ) && [modules[0].isEnabled, modules[0].isRealityModule, ...Object.values(modules[0].validationChecks)].length > 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Info className="h-5 w-5 text-yellow-400" />
                )}
              </span>
            </span>
          </div>
        </div>
      </div>
      {/* Right Section: Wallet/Connect button, Setup New */}
      <div className="flex flex-col sm:flex-row items-center gap-2 min-w-0">
        <div className="flex items-center gap-2 ml-0 sm:ml-3 mt-2 sm:mt-0">
          {!walletAddress && onConnectWallet && (
            <Button
              onClick={onConnectWallet}
              variant="outline"
              className="flex items-center gap-2 bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
            >
              Connect Wallet
            </Button>
          )}
          {walletAddress && (
            <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
              <div className="h-3 w-3 bg-green-500 rounded-full" />
              <p className="text-sm font-medium text-gray-200">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
            </div>
          )}
          {onSetupNew && (
            <Button
              onClick={onSetupNew}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
            >
              Setup New Lockler
            </Button>
          )}
        </div>
      </div>
      {/* SecurityChecksModal as a dialog - now correctly passing safeAddress and chainId */}
      <SecurityChecksModal
        modules={modules}
        open={checksOpen}
        onOpenChange={setChecksOpen}
        safeAddress={safeAddress}
        chainId={chainId}
      />
    </div>
  );
}
