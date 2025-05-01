
import React from "react";
import { CheckCircle2, Info } from "lucide-react";

interface SecurityChecksBadgeProps {
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
  onClick?: () => void;
}

export function SecurityChecksBadge({ modules, onClick }: SecurityChecksBadgeProps) {
  if (!modules || modules.length === 0) return null;
  
  const module = modules[0];
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
    <span
      role="button"
      tabIndex={0}
      onClick={onClick}
      className="cursor-pointer focus:outline-none ml-1"
      aria-label="Security checks"
    >
      {allChecksPassed ? (
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      ) : (
        <Info className="h-5 w-5 text-yellow-400" />
      )}
    </span>
  );
}
