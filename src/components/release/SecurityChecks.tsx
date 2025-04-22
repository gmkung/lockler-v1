
import { ExternalLink } from "lucide-react";
import { Logo } from "../ui/logo";
import { SecurityChecksModal } from "./SecurityChecksModal";

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

export function SecurityChecks({ safeAddress, moduleAddress, blockExplorer, modules }: SecurityChecksProps) {
  return (
    <div className="rounded-3xl border border-gray-800 bg-gray-900 p-5 shadow-2xl">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Logo className="h-5 w-5 text-pink-400" />
          Security Status
        </h2>
        <SecurityChecksModal modules={modules} />
      </div>

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
    </div>
  );
}
