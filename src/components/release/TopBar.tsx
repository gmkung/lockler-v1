
import React, { useState } from "react";
import { Logo } from "../ui/logo";
import { Button } from "../ui/button";
import { ExternalLink } from "lucide-react";
import { CHAIN_CONFIG, getBlockExplorer } from "../../lib/constants";
import { SecurityChecksModal } from "./SecurityChecksModal";
import { CheckCircle2, Info } from "lucide-react";

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

  return (
    <div className="w-full rounded-2xl bg-[#242132] border border-gray-800 p-3 px-4 flex flex-col md:flex-row items-center justify-between gap-2 shadow-lg mb-3">
      {/* Left Section: Logo + Lockler Title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Logo className="h-7 w-7 text-pink-400 shrink-0" />
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-7 truncate">
            Lockler Control
          </h1>
          <span className="text-xs text-gray-400">{CHAIN_CONFIG[chainId]?.name}</span>
        </div>
      </div>
      {/* Right Section: Addresses + Security Icon + Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-gray-400">Safe:</span>
          <code className="text-xs bg-[#2D274B] px-2 py-1 rounded text-gray-300 truncate max-w-[90px] sm:max-w-[120px]">
            {safeAddress ? `${safeAddress.slice(0, 6)}...${safeAddress.slice(-4)}` : '--'}
          </code>
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
        </div>
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-xs text-gray-400">Module:</span>
          <code className="text-xs bg-[#2D274B] px-2 py-1 rounded text-gray-300 truncate max-w-[90px] sm:max-w-[120px]">
            {moduleAddress ? `${moduleAddress.slice(0, 6)}...${moduleAddress.slice(-4)}` : '--'}
          </code>
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
          {/* Security Check Icon */}
          <span className="ml-1 flex items-center">
            <span
              role="button"
              tabIndex={0}
              onClick={() => setChecksOpen(true)}
              className="cursor-pointer focus:outline-none"
              aria-label="Security checks"
            >
              {allChecksPassed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Info className="h-5 w-5 text-yellow-400" />
              )}
            </span>
            {/* Modal shown when checksOpen is true */}
            {checksOpen && (
              <SecurityChecksModal
                modules={modules}
              />
            )}
          </span>
        </div>
        {/* Wallet/connect & setup */}
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
      {/* SecurityChecksModal as a dialog */}
      <SecurityChecksModal
        modules={modules}
        open={checksOpen}
        onOpenChange={setChecksOpen}
      />
    </div>
  );
}
