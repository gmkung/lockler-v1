
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { useAccount, useConnect, useChainId } from "wagmi";
import { Button } from "@/components/ui/button";
import { injected } from "wagmi/connectors";
import { ExternalLink, Copy as CopyIcon, CheckCircle2, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { CHAIN_CONFIG, getBlockExplorer } from "@/lib/constants";
import { SecurityChecksModal } from "./release/SecurityChecksModal";
import { switchChain } from "@/lib/utils";

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
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const connectedChainId = useChainId();
  const { toast } = useToast();
  const [copying, setCopying] = useState({ safe: false, module: false });
  const [checksOpen, setChecksOpen] = useState(false);
  const [isCorrectChain, setIsCorrectChain] = useState(true);
  const blockExplorer = chainId ? getBlockExplorer(chainId) : null;
  
  const navItems = [
    { path: "/setup", label: "Create Lockler" },
    { path: "/myLocklers", label: "My Locklers" }
  ];
  
  // Check if we need to switch chains when page's chainId doesn't match connected chain
  useEffect(() => {
    if (chainId && connectedChainId && chainId !== connectedChainId) {
      setIsCorrectChain(false);
    } else {
      setIsCorrectChain(true);
    }
  }, [chainId, connectedChainId]);
  
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

  const handleCopy = async (text: string, field: "safe" | "module") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopying(prev => ({ ...prev, [field]: true }));
      toast({
        title: "Copied!",
        description: `${field === "safe" ? "Safe" : "Module"} address copied to clipboard.`,
      });
      setTimeout(() => setCopying(prev => ({ ...prev, [field]: false })), 1200);
    } catch (error) {
      toast({ title: "Error", description: "Failed to copy address.", variant: "destructive" });
    }
  };
  
  const handleConnectWallet = () => {
    connect({ connector: injected() });
  };
  
  const handleSwitchChain = async () => {
    if (!chainId) return;
    
    const result = await switchChain(chainId);
    
    if (result.success) {
      setIsCorrectChain(true);
      toast({
        title: "Network switched",
        description: `Successfully switched to ${CHAIN_CONFIG[chainId].name}`,
      });
    } else {
      toast({
        title: "Network switch failed",
        description: result.error || "Failed to switch networks",
        variant: "destructive"
      });
    }
  };

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
                <span className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">Safe:</span>
                  <button
                    onClick={() => safeAddress && handleCopy(safeAddress, "safe")}
                    className="text-xs font-mono bg-[#2D274B] px-2 py-1 rounded text-gray-300 truncate max-w-[116px] border border-transparent hover:border-pink-400/70 transition-colors outline-none"
                    title="Copy Safe address"
                    style={{ cursor: "pointer" }}
                    type="button"
                  >
                    {safeAddress ? `${safeAddress.slice(0, 6)}...${safeAddress.slice(-4)}` : "--"}
                  </button>
                  <CopyIcon className={`h-4 w-4 ml-0.5 text-pink-300 transition ${copying.safe ? "opacity-100" : "opacity-50 hover:opacity-90"}`} />
                  {blockExplorer && safeAddress && (
                    <a
                      href={`${blockExplorer}/address/${safeAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-300"
                      aria-label="Safe on block explorer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </span>
                
                {/* Module address & checks */}
                {moduleAddress && (
                  <span className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">Module:</span>
                    <button
                      onClick={() => moduleAddress && handleCopy(moduleAddress, "module")}
                      className="text-xs font-mono bg-[#2D274B] px-2 py-1 rounded text-gray-300 truncate max-w-[116px] border border-transparent hover:border-pink-400/70 transition-colors outline-none"
                      title="Copy Module address"
                      style={{ cursor: "pointer" }}
                      type="button"
                    >
                      {moduleAddress ? `${moduleAddress.slice(0, 6)}...${moduleAddress.slice(-4)}` : "--"}
                    </button>
                    <CopyIcon className={`h-4 w-4 ml-0.5 text-pink-300 transition ${copying.module ? "opacity-100" : "opacity-50 hover:opacity-90"}`} />
                    {blockExplorer && moduleAddress && (
                      <a
                        href={`${blockExplorer}/address/${moduleAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-300"
                        aria-label="Module on block explorer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    
                    {/* Checkmark right of module */}
                    {modules.length > 0 && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={() => setChecksOpen(true)}
                        className="cursor-pointer focus:outline-none ml-1"
                        aria-label="Security checks"
                      >
                        {allChecksPassed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Info className="h-5 w-5 text-yellow-400" />
                        )}
                      </span>
                    )}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Center section: Navigation */}
        <div className="flex items-center space-x-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
                  ? "bg-purple-800/50 text-purple-100"
                  : "text-gray-300 hover:bg-purple-800/30 hover:text-purple-100"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
        
        {/* Right section: Actions */}
        <div className="flex items-center gap-2">
          {!isConnected ? (
            <Button
              onClick={handleConnectWallet}
              variant="outline"
              className="bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
            >
              Connect Wallet
            </Button>
          ) : isConnected && !isCorrectChain && chainId ? (
            <Button
              onClick={handleSwitchChain}
              variant="outline"
              className="bg-yellow-900/30 border-yellow-700 text-yellow-200 hover:bg-yellow-800/50"
            >
              Switch to {CHAIN_CONFIG[chainId]?.name}
            </Button>
          ) : (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                <div className="h-3 w-3 bg-green-500 rounded-full" />
                <p className="text-sm font-medium text-gray-200">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
                </p>
              </div>
              {connectedChainId && (
                <span className="text-xs text-purple-300 mt-1">
                  {CHAIN_CONFIG[connectedChainId]?.name || `Chain #${connectedChainId}`}
                </span>
              )}
            </div>
          )}
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
