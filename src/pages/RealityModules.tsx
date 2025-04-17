import { useState } from 'react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { getProvider, getRealityModulesForSafe } from '../lib/web3';
import { useToast } from "../components/ui/use-toast";

export default function RealityModules() {
    const [safeAddress, setSafeAddress] = useState('0x2c142C4EbFbe2597d09F584fa35f94Ba69ccd011');
    const [realityModules, setRealityModules] = useState<{ address: string, isEnabled: boolean, isRealityModule: boolean }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleCheckModules = async () => {
        if (!safeAddress) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please enter a Safe address",
            });
            return;
        }

        setIsLoading(true);
        try {
            const provider = getProvider();
            const chainId = await provider.getNetwork().then(n => Number(n.chainId));
            const modules = await getRealityModulesForSafe(provider, safeAddress, chainId);
            setRealityModules(modules);
        } catch (error) {
            console.error('Error checking modules:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to check modules",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <Card>
                <CardHeader>
                    <h2 className="text-2xl font-bold">Check Reality Modules</h2>
                    <p className="text-sm text-gray-600">Enter a Safe address to view its Reality modules</p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex space-x-2">
                            <Input
                                placeholder="Enter Safe address"
                                value={safeAddress}
                                onChange={(e) => setSafeAddress(e.target.value)}
                            />
                            <Button onClick={handleCheckModules} disabled={isLoading}>
                                {isLoading ? "Checking..." : "Check Modules"}
                            </Button>
                        </div>

                        {realityModules.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">Reality Modules:</h3>
                                <div className="space-y-2">
                                    {realityModules.map((module, index) => (
                                        <div key={index} className="p-2 bg-gray-100 rounded">
                                            <p className="font-mono text-sm">{module.address}</p>
                                            <p className="font-mono text-sm">{module.isEnabled.toString()}</p>
                                            <p className="font-mono text-sm">{module.isRealityModule.toString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {realityModules.length === 0 && !isLoading && (
                            <p className="text-gray-600">No Reality modules found for this Safe</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}