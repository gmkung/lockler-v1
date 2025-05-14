
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
import { Link } from "react-router-dom";


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

  // Navigation items - Add About page to the navigation
  const navItems = [
    { path: "/setup", label: "Create Lockler" },
    { path: "/myLocklers", label: "My Locklers" },
    { path: "/about", label: "About" } // Add the About link
  ];

  return (
    <nav className="bg-[#242132] border-b border-gray-800 mb-6 px-4 py-3 shadow-lg">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left section: Logo + Title */}
        <Link to="/" className="flex items-center gap-3">
          <Logo className="h-14 w-14 text-pink-400" />
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              {"Lockler"}
            </h1>
          </div>
        </Link>

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
