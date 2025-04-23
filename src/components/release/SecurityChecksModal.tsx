
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { getSecurityIcon } from "./utils";
import { CircleCheck, Info, ExternalLink } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { SUPPORTED_CHAINS } from "@/lib/constants";

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

  return open !== undefined && onOpenChange ? (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Security Verification Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex justify-between items-center p-2 rounded hover:bg-gray-800/50">
              <span className="text-sm text-gray-200">Module Enabled:</span>
              <span className={module.isEnabled ? "text-green-400" : "text-red-400"}>
                {getSecurityIcon(module.isEnabled)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded hover:bg-gray-800/50">
              <span className="text-sm text-gray-200">Reality Module Verification:</span>
              <span className={module.isRealityModule ? "text-green-400" : "text-red-400"}>
                {getSecurityIcon(module.isRealityModule)}
              </span>
            </div>
            {Object.entries(module.validationChecks).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-2 rounded hover:bg-gray-800/50">
                <span className="text-sm text-gray-200">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </span>
                <span className={value ? "text-green-400" : "text-red-400"}>
                  {getSecurityIcon(value)}
                </span>
              </div>
            ))}
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
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex justify-between items-center p-2 rounded hover:bg-gray-800/50">
              <span className="text-sm text-gray-200">Module Enabled:</span>
              <span className={module.isEnabled ? "text-green-400" : "text-red-400"}>
                {getSecurityIcon(module.isEnabled)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded hover:bg-gray-800/50">
              <span className="text-sm text-gray-200">Reality Module Verification:</span>
              <span className={module.isRealityModule ? "text-green-400" : "text-red-400"}>
                {getSecurityIcon(module.isRealityModule)}
              </span>
            </div>
            {Object.entries(module.validationChecks).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-2 rounded hover:bg-gray-800/50">
                <span className="text-sm text-gray-200">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </span>
                <span className={value ? "text-green-400" : "text-red-400"}>
                  {getSecurityIcon(value)}
                </span>
              </div>
            ))}
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
      </DialogContent>
    </Dialog>
  );
}
