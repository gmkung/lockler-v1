
import { Info } from "lucide-react";
import { StepWrapper } from '../StepWrapper';
import { Button } from "../ui/button";
import { useNavigate } from 'react-router-dom';
import { CHAIN_CONFIG } from "@/lib/constants";

interface ErrorStateProps {
  title: string;
  message: string;
  chainId?: number | null;
  safeAddress?: string;
  showChainSelector?: boolean;
}

export function ErrorState({ title, message, chainId, safeAddress, showChainSelector = false }: ErrorStateProps) {
  const navigate = useNavigate();

  if (!showChainSelector) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1831] to-[#231a2c] p-4">
        <StepWrapper>
          <Info className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-white">{title}</h2>
          <p className="text-purple-200">{message}</p>
        </StepWrapper>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1831] to-[#231a2c] p-4">
      <StepWrapper>
        <Info className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-white">{title}</h2>
        <p className="text-purple-200 mb-4">{message}</p>
        <div className="space-y-2">
          {Object.entries(CHAIN_CONFIG).map(([id, config]) => (
            <Button
              key={id}
              variant="outline"
              className="w-full bg-purple-900/20 border-purple-700 text-white hover:bg-purple-800/30"
              onClick={() => navigate(`/release/${id}/${safeAddress}`)}
            >
              {config.name}
            </Button>
          ))}
        </div>
      </StepWrapper>
    </div>
  );
}
