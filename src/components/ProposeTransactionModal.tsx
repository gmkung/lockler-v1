import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { TOKENS, getContractAddresses } from '../lib/constants';
import { uploadJSONToIPFS } from 'light-curate-data-service';
import { BrowserProvider, Contract, AbiCoder, parseUnits, keccak256 } from 'ethers';

export type Transaction = {
    to: string;
    value: string;
    data: string;
    operation: number;
};

type TransactionType = 'native' | 'erc20' | 'custom';

export function ProposeTransactionModal({
    isOpen,
    onClose,
    onPropose,
    chainId,
    realityModuleAddress
}: {
    isOpen: boolean;
    onClose: () => void;
    onPropose: (transactions: Transaction[]) => void;
    chainId: number;
    realityModuleAddress: string;
}) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [currentType, setCurrentType] = useState<TransactionType>('native');
    const [currentTo, setCurrentTo] = useState('');
    const [currentValue, setCurrentValue] = useState('');
    const [currentData, setCurrentData] = useState('');
    const [currentToken, setCurrentToken] = useState(TOKENS.NATIVE.address);
    const [currentRecipient, setCurrentRecipient] = useState('');

    const availableTokens = [TOKENS.NATIVE];
    Object.entries(TOKENS).forEach(([key, tokenConfig]) => {
        if (key !== 'NATIVE' && tokenConfig[chainId]) {
            availableTokens.push(tokenConfig[chainId]);
        }
    });

    // Filter out native token for ERC20 selection
    const erc20Tokens = availableTokens.filter(token => token.address !== TOKENS.NATIVE.address);

    const addTransaction = () => {
        // Validate inputs based on type
        if (currentType === 'native' && (!currentTo || !currentValue)) {
            return;
        }
        if (currentType === 'erc20' && (!currentRecipient || !currentValue || !currentToken)) {
            return;
        }
        if (currentType === 'custom' && (!currentTo || !currentData)) {
            return;
        }

        let newTransaction: Transaction = {
            to: currentTo,
            value: '0',
            data: '0x',
            operation: 1
        };

        if (currentType === 'native') {
            newTransaction.value = currentValue;
            newTransaction.to = currentTo;
        } else if (currentType === 'erc20') {
            const token = erc20Tokens.find(t => t.address === currentToken);
            if (token) {
                // Encode transfer(address,uint256) call
                const transferData = new AbiCoder().encode(
                    ['address', 'uint256'],
                    [currentRecipient, parseUnits(currentValue, token.decimals)]
                );
                newTransaction.data = '0xa9059cbb' + transferData.slice(2);
                newTransaction.to = token.address;
            }
        } else if (currentType === 'custom') {
            newTransaction.data = currentData;
            newTransaction.value = currentValue;
            newTransaction.to = currentTo;
        }

        setTransactions(prev => [...prev, newTransaction]);
        resetCurrentTransaction();
    };

    const resetCurrentTransaction = () => {
        setCurrentTo('');
        setCurrentValue('');
        setCurrentData('');
        setCurrentToken(TOKENS.NATIVE.address);
        setCurrentRecipient('');
    };

    const handlePropose = async () => {
        if (transactions.length === 0) return;
        
        try {
            // Upload transactions to IPFS to get proposalId
            const cid = await uploadJSONToIPFS(transactions);
            
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            
            // Get the Reality Module contract instance
            const realityModule = new Contract(
                realityModuleAddress,
                [
                    'function addProposal(string memory proposalId, bytes32[] memory txHashes) public',
                    'function getTransactionHash(address to, uint256 value, bytes memory data, uint8 operation, uint256 nonce) public view returns (bytes32)'
                ],
                signer
            );

            // Calculate EIP-712 hashes for each transaction
            const txHashes = await Promise.all(transactions.map(async (tx, index) => {
                return await realityModule.getTransactionHash(
                    tx.to,
                    tx.value,
                    tx.data,
                    tx.operation,
                    index // Use index as nonce
                );
            }));

            // Call addProposal with the IPFS CID as proposalId and the array of transaction hashes
            const tx = await realityModule.addProposal(cid, txHashes);
            await tx.wait();

            onPropose(transactions);
            onClose();
        } catch (error) {
            console.error('Failed to propose transactions:', error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Propose Transaction</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>Transaction Type</Label>
                        <Select value={currentType} onValueChange={(value: TransactionType) => setCurrentType(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="native">Native Token Transfer</SelectItem>
                                <SelectItem value="erc20">ERC20 Transfer</SelectItem>
                                <SelectItem value="custom">Custom Transaction</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {currentType === 'native' && (
                        <>
                            <div>
                                <Label>Recipient Address</Label>
                                <Input
                                    value={currentTo}
                                    onChange={(e) => setCurrentTo(e.target.value)}
                                    placeholder="0x..."
                                />
                            </div>
                            <div>
                                <Label>Amount</Label>
                                <Input
                                    type="number"
                                    value={currentValue}
                                    onChange={(e) => setCurrentValue(e.target.value)}
                                    placeholder="0.0"
                                />
                            </div>
                        </>
                    )}

                    {currentType === 'erc20' && (
                        <>
                            <div>
                                <Label>Token</Label>
                                <Select value={currentToken} onValueChange={setCurrentToken}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select token" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {erc20Tokens.map((token) => (
                                            <SelectItem key={token.address} value={token.address}>
                                                <div className="flex flex-col">
                                                    <span>{token.symbol}</span>
                                                    <span className="text-xs text-gray-500">{token.address}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Recipient Address</Label>
                                <Input
                                    value={currentRecipient}
                                    onChange={(e) => setCurrentRecipient(e.target.value)}
                                    placeholder="0x..."
                                />
                            </div>
                            <div>
                                <Label>Amount</Label>
                                <Input
                                    type="number"
                                    value={currentValue}
                                    onChange={(e) => setCurrentValue(e.target.value)}
                                    placeholder="0.0"
                                />
                            </div>
                        </>
                    )}

                    {currentType === 'custom' && (
                        <>
                            <div>
                                <Label>Target Address</Label>
                                <Input
                                    value={currentTo}
                                    onChange={(e) => setCurrentTo(e.target.value)}
                                    placeholder="0x..."
                                />
                            </div>
                            <div>
                                <Label>Value (ETH)</Label>
                                <Input
                                    type="number"
                                    value={currentValue}
                                    onChange={(e) => setCurrentValue(e.target.value)}
                                    placeholder="0.0"
                                />
                            </div>
                            <div>
                                <Label>Call Data</Label>
                                <Input
                                    value={currentData}
                                    onChange={(e) => setCurrentData(e.target.value)}
                                    placeholder="0x..."
                                />
                            </div>
                        </>
                    )}

                    <div className="mt-4">
                        <h3 className="font-semibold mb-2">Current Transactions</h3>
                        {transactions.length === 0 ? (
                            <p className="text-sm text-gray-500">No transactions added yet</p>
                        ) : (
                            <div className="space-y-2">
                                {transactions.map((tx, index) => (
                                    <div key={index} className="p-3 border rounded bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">To: {tx.to}</p>
                                                <p className="text-sm">Value: {tx.value}</p>
                                                <p className="text-sm break-all">Data: {tx.data.slice(0, 20)}...</p>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => {
                                                    setTransactions(prev => prev.filter((_, i) => i !== index));
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button 
                        onClick={addTransaction}
                        disabled={
                            (currentType === 'native' && (!currentTo || !currentValue)) ||
                            (currentType === 'erc20' && (!currentRecipient || !currentValue || !currentToken)) ||
                            (currentType === 'custom' && (!currentTo || !currentData))
                        }
                    >
                        Add Transaction
                    </Button>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button 
                        onClick={handlePropose} 
                        disabled={transactions.length === 0}
                    >
                        Propose Transactions
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 