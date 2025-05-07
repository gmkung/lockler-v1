
import React, { useState } from "react";
import { Logo } from "../ui/logo";
import { Button } from "../ui/button";
import { ExternalLink, CheckCircle2, Info, Copy as CopyIcon } from "lucide-react";
import { CHAIN_CONFIG, getBlockExplorer } from "../../lib/constants";
import { SecurityChecksModal } from "./SecurityChecksModal";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";


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
  pageTitle?: string;
}

export function TopBar({
  chainId,
  safeAddress,
  moduleAddress,
  modules,
  walletAddress,
  onConnectWallet,
  onSetupNew,
  pageTitle = "Lockler Control"
}: TopBarProps) {
  const [checksOpen, setChecksOpen] = useState(false);
  const { toast } = useToast();

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
      {/* Left Section: Logo + Title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Link to="/">
          <Logo className="h-7 w-7 text-pink-400 shrink-0" />
        </Link>
        <div className="text-xl font-semibold text-white">{pageTitle}</div>
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
