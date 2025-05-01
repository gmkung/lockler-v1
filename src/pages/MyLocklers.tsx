import { useState } from "react";
import { Link } from "react-router-dom";
import { useLocklers } from "@/hooks/useLocklers";
import { useChainId } from "wagmi";
import { AppTopBar } from "@/components/AppTopBar";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link2, FileText, Copy, CopyCheck } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/ui/footer";

export default function MyLocklers() {
  const chainId = useChainId();
  const { data, isLoading, error } = useLocklers();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#23213A] to-[#2D274B]">
      <AppTopBar 
        chainId={chainId}
        pageTitle="My Locklers"
      />
      
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6 text-white">My Locklers</h1>
        
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
              <LocklerTable locklers={data.locklers} />
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

function LocklerTable({ locklers }: { locklers: any[] }) {
  const chainId = useChainId();
  
  return (
    <div className="bg-gray-900/30 rounded-xl border border-gray-800 p-4">
      <Table>
        <TableCaption className="text-gray-400">List of your Locklers on this chain</TableCaption>
        <TableHeader>
          <TableRow className="border-gray-700 hover:bg-transparent">
            <TableHead className="text-gray-300">Safe ID</TableHead>
            <TableHead className="text-gray-300">Owners</TableHead>
            <TableHead className="text-gray-300">Created At</TableHead>
            <TableHead className="text-gray-300">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locklers.map((lockler) => (
            <TableRow key={lockler.id} className="border-gray-700 hover:bg-gray-800/20">
              <TableCell className="font-medium truncate max-w-[200px] text-purple-200">
                {lockler.safe.id}
              </TableCell>
              <TableCell>
                <div className="max-h-[100px] overflow-y-auto text-xs space-y-1">
                  {lockler.owners.map((owner: string, index: number) => (
                    <TruncatedAddress key={index} address={owner} />
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-gray-300">
                {formatTimestamp(lockler.createdAt)}
              </TableCell>
              <TableCell>
                <Link to={`/release/${chainId}/${lockler.safe.id}`}>
                  <Button variant="outline" size="sm" className="bg-purple-900/30 text-purple-200 border-purple-700 hover:bg-purple-800/30 hover:text-purple-100">
                    <FileText className="mr-1" size={16} />
                    View Details
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TruncatedAddress({ address }: { address: string }) {
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
      <span className="mr-2 text-gray-300">{truncatedAddress}</span>
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
    <div className="space-y-3">
      <Skeleton className="h-8 w-full bg-gray-800/50" />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-16 w-full bg-gray-800/50" />
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
