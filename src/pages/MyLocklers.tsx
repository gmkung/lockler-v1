import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLocklers } from "@/hooks/useLocklers";
import { useChainId } from "wagmi";
import { AppTopBar } from "@/components/AppTopBar";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link2, FileText, Copy, CopyCheck, Network, CheckCircle2, Shield, ShieldAlert, Bot } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/ui/footer";
import { NetworkStatus } from "@/components/ui/NetworkStatus";
import { useRealityModule } from "@/hooks/useRealityModule";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { JsonRpcProvider } from "ethers";
import { getRpcUrl } from "@/lib/constants";
import { getRealityModulesForSafe } from "@/lib/web3";

export default function MyLocklers() {
  const chainId = useChainId();
  const { data, isLoading, error } = useLocklers();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#23213A] to-[#2D274B] flex flex-col justify-between">
      <div>
        <AppTopBar 
          chainId={chainId}
          pageTitle="My Locklers"
        />
        
        <div className="container mx-auto px-4 py-6">
          <Card className="bg-[#2D274B] border-gray-800 rounded-3xl shadow-2xl">
            <CardHeader>
              <h2 className="text-2xl font-bold text-white">Your Locklers</h2>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="p-4 bg-red-900/30 text-red-300 rounded-md border border-red-700">
                  Error loading Locklers: {error instanceof Error ? error.message : "Unknown error"}
                </div>
              ) : isLoading ? (
                <LocklerSkeleton />
              ) : data?.locklers && data.locklers.length > 0 ? (
                <LocklerGrid locklers={data.locklers} />
              ) : (
                <EmptyState />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function LocklerGrid({ locklers }: { locklers: any[] }) {
  const chainId = useChainId();
  const [verifiedLocklers, setVerifiedLocklers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkVerification = async () => {
      setIsLoading(true);
      
      const verificationPromises = locklers.map(async (lockler) => {
        try {
          // We need to import the hook logic here since hooks can't be used in a callback 
          // This can be deleted in the future as we will eventually incorporate the checks in the subgraph, so no need to check for each and every Lockler like this.
          const provider = new JsonRpcProvider(getRpcUrl(chainId));
          const modules = await getRealityModulesForSafe(provider, lockler.safe.id, chainId);
          
          const isVerified = modules.some(module => 
            module.isEnabled && 
            module.isRealityModule &&
            Object.values(module.validationChecks).every(Boolean)
          );
          
          return { lockler, isVerified };
        } catch (error) {
          console.error(`Error checking verification for ${lockler.safe.id}:`, error);
          return { lockler, isVerified: false };
        }
      });
      
      const results = await Promise.all(verificationPromises);
      const verified = results
        .filter(result => result.isVerified)
        .map(result => result.lockler);
      
      setVerifiedLocklers(verified);
      setIsLoading(false);
    };
    
    if (locklers.length > 0) {
      checkVerification();
    } else {
      setVerifiedLocklers([]);
      setIsLoading(false);
    }
  }, [locklers, chainId]);
  
  if (isLoading) {
    return <LocklerSkeleton />;
  }
  
  if (verifiedLocklers.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-900/30 rounded-xl border border-gray-800 p-5">
        <Shield className="mx-auto text-yellow-500" size={48} />
        <h3 className="text-xl font-medium mt-3 mb-2 text-white">No Verified Locklers</h3>
        <p className="text-gray-400 mb-6">
          No verified Locklers were found for your account on this network.
        </p>
        <Link to="/setup">
          <Button className="bg-gradient-to-br from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
            Create a New Lockler
          </Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {verifiedLocklers.map((lockler) => (
        <LocklerCard 
          key={lockler.id} 
          lockler={lockler} 
          chainId={chainId} 
        />
      ))}
    </div>
  );
}

function LocklerCard({ lockler, chainId }: { lockler: any, chainId: number }) {
  // Use hook to get module address to identify which owner is the Reality Module
  const { address: moduleAddress } = useRealityModule(lockler.safe.id, chainId);
  
  // We don't need to check verification here anymore since we're only showing verified Locklers
  return (
    <Card className="bg-gray-900/30 rounded-xl border border-gray-800 overflow-hidden hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10 flex flex-col h-full">
      <CardHeader className="bg-gray-900/40 pb-3 flex flex-row justify-between items-center">
        <div className="flex items-center gap-2">
          <p className="font-medium text-purple-200 truncate" title={lockler.safe.id}>
            {lockler.safe.id.substring(0, 8)}...{lockler.safe.id.substring(lockler.safe.id.length - 6)}
          </p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span><Shield className="h-4 w-4 text-green-500" /></span>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Verified Lockler</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <NetworkStatus chainId={chainId} />
      </CardHeader>
      <CardContent className="pt-3 flex-grow">
        <div className="space-y-2">
          <div className="text-sm text-gray-400">
            <span className="block mb-1">Owners:</span>
            <div className="max-h-[100px] overflow-y-auto space-y-1">
              {lockler.owners.slice(0, 3).map((owner: string, index: number) => (
                <TruncatedAddress 
                  key={index} 
                  address={owner}
                  isRealityModule={moduleAddress?.toLowerCase() === owner.toLowerCase()}
                />
              ))}
              {lockler.owners.length > 3 && (
                <p className="text-xs text-gray-500 mt-1">+{lockler.owners.length - 3} more</p>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-400">
            <span>Created:</span> {formatTimestamp(lockler.createdAt)}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-gray-800 bg-gray-900/20 pt-3 mt-auto">
        <Link to={`/release/${chainId}/${lockler.safe.id}`} className="w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-purple-900/30 text-purple-200 border-purple-700 hover:bg-purple-800/30 hover:text-purple-100 w-full"
          >
            <FileText className="mr-2" size={16} />
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function TruncatedAddress({ address, isRealityModule = false }: { 
  address: string; 
  isRealityModule?: boolean;
}) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  
  const truncatedAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setIsCopied(true);
    toast({
      title: "Address copied",
      description: `${truncatedAddress} copied to clipboard`,
    });
    
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  return (
    <div className="flex items-center justify-between bg-gray-800/50 px-2 py-1 rounded border border-gray-700">
      <div className="flex items-center">
        <span className="mr-2 text-gray-300">{truncatedAddress}</span>
        
        {isRealityModule && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span><Bot className="h-3.5 w-3.5 text-purple-400" /></span>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p>Reality Module (secured by Kleros)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-5 w-5 hover:bg-gray-700/50" 
        onClick={handleCopy}
      >
        {isCopied ? 
          <CopyCheck size={14} className="text-green-400" /> : 
          <Copy size={14} className="text-gray-400 hover:text-gray-300" />
        }
      </Button>
    </div>
  );
}

function formatTimestamp(timestamp: string): string {
  // Convert the timestamp (in seconds) to a JavaScript Date object
  const date = new Date(parseInt(timestamp) * 1000);
  return format(date, 'PPP p'); // Format as "Aug 29, 2023, 2:30 PM"
}

function LocklerSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="bg-gray-900/30 border-gray-800">
          <CardHeader>
            <Skeleton className="h-6 w-3/4 bg-gray-800/50" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full bg-gray-800/50" />
              <Skeleton className="h-4 w-full bg-gray-800/50" />
              <Skeleton className="h-4 w-2/3 bg-gray-800/50" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-8 w-full bg-gray-800/50" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 bg-gray-900/30 rounded-xl border border-gray-800 p-5">
      <div className="mb-4">
        <Link2 className="mx-auto text-gray-400" size={48} />
      </div>
      <h3 className="text-xl font-medium mb-2 text-white">No Locklers Found</h3>
      <p className="text-gray-400 mb-6">
        You don't have any Locklers associated with your account on this network.
      </p>
      <Link to="/setup">
        <Button className="bg-gradient-to-br from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
          Create a New Lockler
        </Button>
      </Link>
    </div>
  );
}
