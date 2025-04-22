
import { Shield, ExternalLink } from "lucide-react";
import { getSecurityIcon } from "./utils";

interface SecurityChecksProps {
  safeAddress: string;
  moduleAddress: string;
  blockExplorer: string | null;
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
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-indigo-600" />
        Lockler Security Checks
      </h2>

      <div className="space-y-4">
        <div className="flex flex-col space-y-1">
          <p className="text-sm text-gray-600">Safe Address:</p>
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm bg-gray-50 p-1.5 rounded border border-gray-200 flex-grow">
              {safeAddress}
            </p>
            {blockExplorer && (
              <a
                href={`${blockExplorer}/address/${safeAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-1">
          <p className="text-sm text-gray-600">Reality Module:</p>
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm bg-gray-50 p-1.5 rounded border border-gray-200 flex-grow">
              {moduleAddress}
            </p>
            {blockExplorer && (
              <a
                href={`${blockExplorer}/address/${moduleAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {modules?.map(module => (
        <div key={module.address} className="mt-5 border-t border-gray-100 pt-4">
          <h3 className="font-semibold text-gray-700 mb-3">Security Verification</h3>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex justify-between items-center p-2 rounded hover:bg-gray-50">
              <span className="text-sm text-gray-600">Module Enabled:</span>
              <span className={module.isEnabled ? "text-green-600" : "text-red-600"}>
                {getSecurityIcon(module.isEnabled)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded hover:bg-gray-50">
              <span className="text-sm text-gray-600">Reality Module Verification:</span>
              <span className={module.isRealityModule ? "text-green-600" : "text-red-600"}>
                {getSecurityIcon(module.isRealityModule)}
              </span>
            </div>
            {Object.entries(module.validationChecks).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-2 rounded hover:bg-gray-50">
                <span className="text-sm text-gray-600">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </span>
                <span className={value ? "text-green-600" : "text-red-600"}>
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
