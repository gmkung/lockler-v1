
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { getSecurityIcon } from "./utils";
import { CircleCheck, Info, ExternalLink } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { SUPPORTED_CHAINS } from "@/lib/constants";
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
}

export function SecurityChecksModal({ modules, open, onOpenChange, safeAddress, chainId }: SecurityChecksModalProps) {
  const module = modules[0];
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
          "Safe has 3 or fewer owners (currently has 2)"
        )}
        {renderCheckWithTooltip(
          "Is Only Enabled Module",
          module.validationChecks.isOnlyEnabledModule,
          "Confirms this is the only module enabled on the Safe, ensuring it's the only way to move funds"
        )}
      </div>
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
