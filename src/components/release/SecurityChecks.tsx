import { ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import { getSecurityIcon } from "./utils";
import { SUPPORTED_CHAINS } from "@/lib/constants";
import { Logo } from "../ui/logo";

interface SecurityChecksProps {
  safeAddress: string;
  moduleAddress: string;
  blockExplorer: string | null;
  chainId?: number;
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
}

export function SecurityChecks({ safeAddress, moduleAddress, blockExplorer, chainId, modules }: SecurityChecksProps) {
  const getGnosisSafeUrl = () => {
    const networkPrefix = chainId === SUPPORTED_CHAINS.MAINNET ? 'eth' : 'gno';
    return `https://app.safe.global/apps/open?safe=${networkPrefix}:${safeAddress}&appUrl=https%3A%2F%2Fzodiac.gnosisguild.org%2F`;
  };

  return (
    <div className="rounded-3xl border border-gray-800 bg-gray-900 p-5 shadow-2xl">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Logo className="h-5 w-5 text-pink-400" />
        Lockler Security Checks
      </h2>

      <div className="space-y-4">
        <div className="flex flex-col space-y-1">
          <p className="text-sm text-gray-400">Safe Address:</p>
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs sm:text-sm bg-gray-800 p-1.5 rounded border border-gray-700 flex-grow text-gray-300 truncate">
              {safeAddress}
            </p>
            {blockExplorer && (
              <a
                href={`${blockExplorer}/address/${safeAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-300 flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-1">
          <p className="text-sm text-gray-400">Reality Module:</p>
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs sm:text-sm bg-gray-800 p-1.5 rounded border border-gray-700 flex-grow text-gray-300 truncate">
              {moduleAddress}
            </p>
            {blockExplorer && (
              <a
                href={`${blockExplorer}/address/${moduleAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-300 flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {modules?.map(module => (
        <div key={module.address} className="mt-5 border-t border-gray-800 pt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-white">Security Verification</h3>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-xs bg-purple-900/50 border-purple-600 hover:bg-purple-800/50 text-white"
              onClick={() => window.open(getGnosisSafeUrl(), '_blank')}
            >
              <span>Verify on Safe</span>
              <ExternalLink className="h-3.5 w-3.5 text-white" />
            </Button>
          </div>
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
        </div>
      ))}
    </div>
  );
}
