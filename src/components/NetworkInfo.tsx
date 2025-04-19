import { Card, CardHeader, CardContent } from "./ui/card";
import { getChainConfig } from "../lib/constants";

interface NetworkInfoProps {
  chainId: number;
}

export function NetworkInfo({ chainId }: NetworkInfoProps) {
  const chainConfig = getChainConfig(chainId);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-bold">Network Information</h2>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-600">
          <p>Connected to: {chainConfig.name}</p>
          <p>Chain ID: {chainConfig.id}</p>
          <p>Native Currency: {chainConfig.nativeCurrency.symbol}</p>
        </div>
      </CardContent>
    </Card>
  );
} 