
import { useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { useAccount, useChainId } from "wagmi";
import { useState } from "react";
import { CHAIN_CONFIG, getBlockExplorer } from "@/lib/constants";
import { SecurityChecksModal } from "./release/SecurityChecksModal";
import { AddressDisplay } from "./ui/AddressDisplay";
import { WalletConnect } from "./ui/WalletConnect";
import { NavigationMenu } from "./ui/NavigationMenu";
import { SecurityChecksBadge } from "./ui/SecurityChecksBadge";

interface AppTopBarProps {
  chainId?: number;
  safeAddress?: string;
  moduleAddress?: string;
  modules?: Array<{
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
  pageTitle?: string;
}

export function AppTopBar({
  chainId,
  safeAddress,
  moduleAddress,
  modules = [],
  pageTitle
}: AppTopBarProps) {
  const location = useLocation();
  const { isConnected } = useAccount();
  const connectedChainId = useChainId();
  const [checksOpen, setChecksOpen] = useState(false);
  const blockExplorer = chainId ? getBlockExplorer(chainId) : null;
  
  // Navigation items
  const navItems = [
    { path: "/setup", label: "Lockler" },
    { path: "/myLocklers", label: "Lockler" }
  ];
  
  return (
    <nav className="bg-[#242132] border-b border-gray-800 mb-6 px-4 py-3 shadow-lg">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left section: Logo + Title */}
        <div className="flex items-center gap-3">
          <Logo className="h-7 w-7 text-pink-400" />
          <div>
            <h1 className="text-xl font-bold text-white">
              {pageTitle || "Lockler"}
            </h1>
            
            {/* Display chain and addresses only on Release page */}
            {location.pathname.startsWith('/release/') && chainId && safeAddress && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                <span className="text-xs text-gray-400">{CHAIN_CONFIG[chainId]?.name}</span>
                
                {/* Safe address */}
                <AddressDisplay 
                  address={safeAddress} 
                  label="Safe" 
                  blockExplorerUrl={blockExplorer} 
                />
                
                {/* Module address & checks */}
                {moduleAddress && (
                  <div className="flex items-center">
                    <AddressDisplay 
                      address={moduleAddress} 
                      label="Module" 
                      blockExplorerUrl={blockExplorer} 
                    />
                    
                    {/* Security checks badge */}
                    <SecurityChecksBadge 
                      modules={modules} 
                      onClick={() => setChecksOpen(true)} 
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Center section: Navigation */}
        <NavigationMenu items={navItems} />
        
        {/* Right section: Wallet Connect */}
        <div className="flex items-center gap-2">
          <WalletConnect requiredChainId={chainId} />
        </div>
      </div>
      
      {/* SecurityChecksModal */}
      {modules.length > 0 && (
        <SecurityChecksModal
          modules={modules}
          open={checksOpen}
          onOpenChange={setChecksOpen}
          safeAddress={safeAddress}
          chainId={chainId}
        />
      )}
    </nav>
  );
}
