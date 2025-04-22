
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHAIN_CONFIG } from "../lib/constants";
import { useToast } from "../hooks/use-toast";
import { isAddress } from "ethers";

export default function SelectSafe() {
  const [safeAddress, setSafeAddress] = useState("");
  const [selectedChainId, setSelectedChainId] = useState(Object.keys(CHAIN_CONFIG)[0]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAddress(safeAddress)) {
      toast({
        variant: "destructive",
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address",
      });
      return;
    }

    navigate(`/release/${selectedChainId}/${safeAddress}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#1a1831] to-[#231a2c] items-center justify-center py-7 px-3">
      <Card className="w-full max-w-md p-6 border-purple-800/20 bg-white/5 backdrop-blur">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">View Lockler</h1>
          <p className="text-purple-200 text-sm">
            Enter your Safe address and select the network to view your Lockler
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1">
              Safe Address
            </label>
            <Input
              placeholder="0x..."
              value={safeAddress}
              onChange={(e) => setSafeAddress(e.target.value)}
              className="w-full bg-purple-900/20 border-purple-700 text-white placeholder:text-purple-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1">
              Network
            </label>
            <Select
              value={selectedChainId}
              onValueChange={setSelectedChainId}
            >
              <SelectTrigger className="w-full bg-purple-900/20 border-purple-700 text-white">
                <SelectValue>
                  {CHAIN_CONFIG[parseInt(selectedChainId)]?.name || "Select Network"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CHAIN_CONFIG).map(([chainId, config]) => (
                  <SelectItem key={chainId} value={chainId.toString()}>
                    {config.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full py-3 rounded-3xl text-lg bg-gradient-to-br from-pink-500 to-purple-500 mt-4 font-bold transition-colors shadow-lg"
          >
            View Lockler
          </Button>
        </form>
      </Card>
    </div>
  );
}
