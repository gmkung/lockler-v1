import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { getSecurityIcon } from "./utils";
import { CircleCheck, Info, ExternalLink, Scale } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { SUPPORTED_CHAINS, getBlockExplorer } from "@/lib/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SecurityChecksModalProps {
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
  open?: boolean;
  onOpenChange?: Dispatch<SetStateAction<boolean>>;
  safeAddress?: string;
  chainId?: number;
  arbitrator?: string | null;
}

export function SecurityChecksModal({ modules, open, onOpenChange, safeAddress, chainId, arbitrator }: SecurityChecksModalProps) {
  const module = modules[0];
  const blockExplorer = chainId ? getBlockExplorer(chainId) : null;
  if (!module) return null;

  const totalChecks = Object.keys(module.validationChecks).length + 2;
  const passedChecks = [
    module.isEnabled,
    module.isRealityModule,
    ...Object.values(module.validationChecks)
  ].filter(Boolean).length;

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

  const renderCheckWithTooltip = (label: string, value: boolean, tooltip: string) => (
    <div className="flex justify-between items-center p-2 rounded hover:bg-gray-800/50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-sm text-gray-200 cursor-help">{label}</span>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-[300px]">
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span className={value ? "text-green-400" : "text-red-400"}>
        {getSecurityIcon(value)}
      </span>
    </div>
  );

  const renderArbitratorInfo = () => (
    <div className="flex justify-between items-center p-2 rounded hover:bg-gray-800/50 mt-2 border-t border-gray-800 pt-3">
      <div className="flex items-center">
        <Scale className="h-4 w-4 text-gray-400 mr-2" />
        <span className="text-sm text-gray-200">Arbitrator:</span>
      </div>
      {arbitrator ? (
        <div className="flex items-center gap-1">
          <span className="text-xs font-mono text-gray-300" title={arbitrator}>
            {`${arbitrator.slice(0, 6)}...${arbitrator.slice(-4)}`}
          </span>
          {blockExplorer && (
            <a
              href={`${blockExplorer}/address/${arbitrator}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-md hover:bg-gray-700/70 transition-colors"
              title="View Arbitrator on explorer"
            >
              <ExternalLink className="h-3 w-3 text-gray-400 hover:text-gray-200" />
            </a>
          )}
        </div>
      ) : (
        <span className="text-xs text-gray-500">Not Set</span>
      )}
    </div>
  );

  const dialogContent = (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-1 gap-2">
        {renderCheckWithTooltip(
          "Module Enabled",
          module.isEnabled,
          "Verifies that the Reality Module is enabled on the Lockler Safe"
        )}
        {renderCheckWithTooltip(
          "Reality Module Verification",
          module.isRealityModule,
          "Confirms this module is based on a verified Reality Module contract"
        )}
        {renderCheckWithTooltip(
          "Minimal Proxy",
          module.validationChecks.isMinimalProxy,
          "Verifies the contract is an EIP-1167 minimal proxy to the verified Reality Module deployment on this chain"
        )}
        {renderCheckWithTooltip(
          "Is Owner",
          module.validationChecks.isOwner,
          "Confirms the Reality Module is set as one of the owners of the Safe"
        )}
        {renderCheckWithTooltip(
          "Has Valid Threshold",
          module.validationChecks.hasValidThreshold,
          "Verifies the Safe requires exactly 2 signatures for any transaction"
        )}
        {renderCheckWithTooltip(
          "Has Valid Owner Count",
          module.validationChecks.hasValidOwnerCount,
          "Safe has 3 or fewer owners."
        )}
        {renderCheckWithTooltip(
          "Is Only Enabled Module",
          module.validationChecks.isOnlyEnabledModule,
          "Confirms this is the only module enabled on the Safe, ensuring it's the only way to move funds"
        )}
      </div>
      {renderArbitratorInfo()}
      {safeAddress && chainId && (
        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            className="gap-2 text-sm bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 text-gray-200"
            onClick={() => window.open(getSafeAppUrl(), '_blank')}
          >
            Inspect on Safe app
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  return open !== undefined && onOpenChange ? (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Security Verification Details</DialogTitle>
        </DialogHeader>
        {dialogContent}
      </DialogContent>
    </Dialog>
  ) : (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 text-sm bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 text-gray-200 w-full"
        >
          {passedChecks === totalChecks ? (
            <CircleCheck className="h-4 w-4 text-green-500" />
          ) : (
            <Info className="h-4 w-4 text-yellow-500" />
          )}
          {passedChecks} of {totalChecks} checks passed
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Security Verification Details</DialogTitle>
        </DialogHeader>
        {dialogContent}
      </DialogContent>
    </Dialog>
  );
}
