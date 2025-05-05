import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { StepProgressBar } from "../StepProgressBar";

interface DeploymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeploySafe: () => Promise<string>;
  onDeployModule: () => Promise<any>;
  onFinish: () => void;
  safeAddress: string | null;
}

export function DeploymentModal({
  open,
  onOpenChange,
  onDeploySafe,
  onDeployModule,
  onFinish,
  safeAddress
}: DeploymentModalProps) {
  const [deployStep, setDeployStep] = useState(1);
  const [safeLoading, setSafeLoading] = useState(false);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [safeError, setSafeError] = useState<string | null>(null);
  const [moduleError, setModuleError] = useState<string | null>(null);
  const [safeDone, setSafeDone] = useState(false);
  const [moduleDone, setModuleDone] = useState(false);

  const handleDeploySafe = async () => {
    setSafeLoading(true);
    setSafeError(null);
    try {
      await onDeploySafe();
      setSafeDone(true);
      setDeployStep(2);
    } catch (err: any) {
      setSafeError(err.message || "Failed to deploy Safe");
    } finally {
      setSafeLoading(false);
    }
  };

  const handleDeployModule = async () => {
    setModuleLoading(true);
    setModuleError(null);
    try {
      await onDeployModule();
      setModuleDone(true);
      setTimeout(() => {
        onOpenChange(false);
        onFinish();
      }, 1000);
    } catch (err: any) {
      setModuleError(err.message || "Failed to deploy Reality Module");
    } finally {
      setModuleLoading(false);
    }
  };

  const resetModal = () => {
    if (!safeDone && !moduleDone) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={resetModal}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-center text-white text-xl">Lockler Deployment</DialogTitle>
        </DialogHeader>
        
        <div className="my-4">
          <StepProgressBar step={deployStep} total={2} />
        </div>
        
        <div className="space-y-6 py-4">
          <div className={`transition-all duration-300 ${deployStep === 1 ? 'opacity-100' : 'opacity-50'}`}>
            <div className="flex items-center mb-2">
              <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-purple-900/50 mr-3">
                {safeDone ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <span className="text-white font-bold">1</span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-white">Deploy Lockler Safe</h3>
            </div>
            
            <div className="ml-11 text-sm text-gray-300 mb-3">
              This creates your secure Lockler contract on the blockchain.
            </div>
            
            {deployStep === 1 && (
              <div className="ml-11">
                <Button 
                  onClick={handleDeploySafe} 
                  disabled={safeLoading || safeDone}
                  className="bg-gradient-to-br from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  {safeLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deploying Safe...</>
                  ) : safeDone ? (
                    <><CheckCircle className="h-4 w-4 mr-2" /> Safe Deployed</>
                  ) : (
                    "Deploy Safe"
                  )}
                </Button>
                
                {safeError && (
                  <div className="text-red-400 text-sm mt-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {safeError}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className={`transition-all duration-300 ${deployStep === 2 ? 'opacity-100' : 'opacity-50'}`}>
            <div className="flex items-center mb-2">
              <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-purple-900/50 mr-3">
                {moduleDone ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <span className="text-white font-bold">2</span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-white">Deploy Security System</h3>
            </div>
            
            <div className="ml-11 text-sm text-gray-300 mb-3">
              This deploys the Kleros Reality Module to secure your funds.
            </div>
            
            {deployStep === 2 && (
              <div className="ml-11">
                {safeAddress && (
                  <div className="text-green-400 text-sm mb-3">
                    ✓ Safe deployed at: {safeAddress.substring(0, 6)}...{safeAddress.substring(safeAddress.length - 4)}
                  </div>
                )}
                
                <Button 
                  onClick={handleDeployModule} 
                  disabled={moduleLoading || moduleDone || !safeAddress}
                  className="bg-gradient-to-br from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  {moduleLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deploying Module...</>
                  ) : moduleDone ? (
                    <><CheckCircle className="h-4 w-4 mr-2" /> Module Deployed</>
                  ) : (
                    "Deploy Security Module"
                  )}
                </Button>
                
                {moduleError && (
                  <div className="text-red-400 text-sm mt-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {moduleError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 