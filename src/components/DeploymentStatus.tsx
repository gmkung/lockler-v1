import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Expand, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface DeploymentStatusProps {
  moduleDeploymentHash: string | null;
  transactionData: any;
  error: string | null;
}

export function DeploymentStatus({ moduleDeploymentHash, transactionData, error }: DeploymentStatusProps) {
  const handleDownloadReceipt = () => {
    if (!transactionData) return;
    
    const dataStr = JSON.stringify(transactionData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportName = `transaction-receipt-${Date.now()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  };
  
  return (
    <>
      {error && (
        <div className="text-red-500 mt-2">
          Error: {error}
        </div>
      )}

      {moduleDeploymentHash && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">Transaction Hash</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {moduleDeploymentHash}
          </pre>
        </div>
      )}

      {transactionData && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold">Transaction Receipt</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full hover:bg-gray-100 flex items-center gap-1"
                >
                  <Expand className="h-4 w-4 text-gray-600" />
                  <span>View Details</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl bg-white border-gray-200">
                <DialogHeader>
                  <DialogTitle className="flex justify-between items-center">
                    <span>Transaction Receipt</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full hover:bg-gray-100"
                      onClick={handleDownloadReceipt}
                    >
                      <Download className="h-4 w-4 text-gray-600" />
                    </Button>
                  </DialogTitle>
                </DialogHeader>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap overflow-auto max-h-[60vh]">
                    {JSON.stringify(transactionData, null, 2)}
                  </pre>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="mt-2 text-sm text-gray-600">
            {transactionData.status !== undefined && (
              <span className="mr-4">
                <span className="font-semibold">Status:</span> {transactionData.status ? 'Success' : 'Failed'}
              </span>
            )}
            {transactionData.contractAddress && (
              <span>
                <span className="font-semibold">Contract:</span> {transactionData.contractAddress.slice(0, 6)}...{transactionData.contractAddress.slice(-4)}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
} 