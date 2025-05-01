
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLocklers } from "@/hooks/useLocklers";
import { useChainId } from "wagmi";
import { MetamaskConnect } from "@/components/MetamaskConnect";
import { NetworkInfo } from "@/components/NetworkInfo";
import { Navigation } from "@/components/Navigation";
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
import { Link2, FileText } from "lucide-react";
import { format } from "date-fns";

export default function MyLocklers() {
  const chainId = useChainId();
  const { data, isLoading, error } = useLocklers();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">My Locklers</h1>
        
        <div className="mb-6">
          <MetamaskConnect />
        </div>
        
        {chainId && <NetworkInfo chainId={chainId} />}
        
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-2xl font-bold">Your Locklers</h2>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="p-4 bg-red-50 text-red-600 rounded-md">
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
    </div>
  );
}

function LocklerTable({ locklers }: { locklers: any[] }) {
  const chainId = useChainId();
  
  return (
    <Table>
      <TableCaption>List of your Locklers on this chain</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Safe ID</TableHead>
          <TableHead>Owners</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {locklers.map((lockler) => (
          <TableRow key={lockler.id}>
            <TableCell className="font-medium truncate max-w-[200px]">
              {lockler.safe.id}
            </TableCell>
            <TableCell>
              <div className="max-h-[100px] overflow-y-auto text-xs">
                {lockler.owners.map((owner: string, index: number) => (
                  <div key={index} className="mb-1 truncate max-w-[200px]">
                    {owner}
                  </div>
                ))}
              </div>
            </TableCell>
            <TableCell>
              {formatTimestamp(lockler.createdAt)}
            </TableCell>
            <TableCell>
              <Link to={`/release/${chainId}/${lockler.safe.id}`}>
                <Button variant="outline" size="sm">
                  <FileText className="mr-1" size={16} />
                  View Details
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
      <Skeleton className="h-8 w-full" />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="mb-4">
        <Link2 className="mx-auto text-gray-400" size={48} />
      </div>
      <h3 className="text-xl font-medium mb-2">No Locklers Found</h3>
      <p className="text-muted-foreground mb-6">
        You don't have any Locklers associated with your account on this network.
      </p>
      <Link to="/setup">
        <Button>Create a New Lockler</Button>
      </Link>
    </div>
  );
}
