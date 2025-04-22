
import React from "react";
import { Logo } from "../ui/logo";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ShieldCheck, Info } from "lucide-react";
import { SecurityChecksModal } from "./SecurityChecksModal";
import { ExternalLink } from "lucide-react";
import { CHAIN_CONFIG, getBlockExplorer } from "../../lib/constants";

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

  // Security status data
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

  return (
    <div className="w-full rounded-2xl bg-[#242132] border border-gray-800 p-4 px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg mb-3">
      {/* Left: Logo/Title */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Logo className="h-7 w-7 text-pink-400 shrink-0" />
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-7 truncate">
            Lockler Control
          </h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-300">
            <span>Secured by Kleros Optimistic Oracle</span>
            <span className="hidden sm:inline text-gray-400">|</span>
            <span className="text-xs text-gray-400">{CHAIN_CONFIG[chainId]?.name}</span>
          </div>
        </div>
      </div>
      {/* Middle: Security Status */}
      <div className="flex items-center gap-3 bg-[#2D274B] rounded-xl px-4 py-2 border border-gray-700 min-w-[210px]">
        <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
        <span className="text-sm text-gray-100 font-medium">Security:</span>
        <Badge variant="secondary" className="bg-[#25214A] text-gray-200 px-2 min-w-[82px] text-center">
          {passedChecks} / {totalChecks} checks
        </Badge>
        <SecurityChecksModal modules={modules} />
      </div>
      {/* Right: Addresses & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-gray-400">Safe:</span>
          <code className="text-xs bg-[#2D274B] px-2 py-1 rounded text-gray-300 truncate max-w-[100px] sm:max-w-[130px]">
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
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-gray-400">Module:</span>
          <code className="text-xs bg-[#2D274B] px-2 py-1 rounded text-gray-300 truncate max-w-[100px] sm:max-w-[130px]">
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
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        {/* Wallet/connect & setup (shown only if handlers provided) */}
        <div className="flex items-center gap-3 ml-0 sm:ml-3 mt-2 sm:mt-0">
          {!walletAddress && onConnectWallet && (
            <Button
              onClick={onConnectWallet}
              variant="outline"
              className="flex items-center gap-2 bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
            >
              <Info className="h-4 w-4 mr-1" />
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
    </div>
  );
}
