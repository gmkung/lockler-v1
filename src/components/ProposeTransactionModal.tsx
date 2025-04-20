import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TOKENS, getContractAddresses } from '../lib/constants';
import { uploadJSONToIPFS } from 'light-curate-data-service';
import { BrowserProvider, Contract, AbiCoder, parseUnits, keccak256, ethers } from 'ethers';
import { REALITY_MODULE_ABI } from '../abis/realityModule';
import { ERC20_ABI } from '../abis/erc20';
import { bytes32ToCidV0, cidToBytes32 } from '../lib/cid';



export type Transaction = {
    to: string;
    value: string;
    data: string;
    operation: number;
    type: TransactionType;
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
    const [showRawIndices, setShowRawIndices] = useState<Set<number>>(new Set());
    const [currentType, setCurrentType] = useState<TransactionType>('native');
    const [currentTo, setCurrentTo] = useState('');
    const [currentValue, setCurrentValue] = useState('');
    const [currentData, setCurrentData] = useState('');
    const [currentRecipient, setCurrentRecipient] = useState('');
    const [minimumBond, setMinimumBond] = useState<string>('0');
    const [isLoadingBond, setIsLoadingBond] = useState(true);

    const availableTokens = [TOKENS.NATIVE];
    Object.entries(TOKENS).forEach(([key, tokenConfig]) => {
        if (key !== 'NATIVE' && tokenConfig[chainId]) {
            availableTokens.push(tokenConfig[chainId]);
        }
    });

    // Filter out native token for ERC20 selection
    const erc20Tokens = availableTokens.filter(token => token.address !== TOKENS.NATIVE.address);

    // Set current token to first available ERC20 token
    const [currentToken, setCurrentToken] = useState(erc20Tokens[0]?.address || TOKENS.NATIVE.address);

    useEffect(() => {
        const fetchMinimumBond = async () => {
            if (!realityModuleAddress) return;

            try {
                const provider = new BrowserProvider(window.ethereum);
                const realityModule = new Contract(
                    realityModuleAddress,
                    REALITY_MODULE_ABI,
                    provider
                );

                const bond = await realityModule.minimumBond();
                setMinimumBond(bond.toString());
            } catch (error) {
                console.error('Failed to fetch minimum bond:', error);
            } finally {
                setIsLoadingBond(false);
            }
        };

        fetchMinimumBond();
    }, [realityModuleAddress]);

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
            operation: 1,
            type: currentType
        };

        if (currentType === 'native') {
            // For native token, we need to convert the amount to wei
            const weiAmount = parseUnits(currentValue, 18);
            console.log('Native token transfer:', {
                inputValue: currentValue,
                weiAmount: weiAmount.toString(),
                formatted: ethers.formatEther(weiAmount)
            });
            newTransaction.value = weiAmount.toString();
            newTransaction.to = currentTo;
        } else if (currentType === 'erc20') {
            const token = erc20Tokens.find(t => t.address === currentToken);
            if (token) {
                // For ERC20, we need to convert the amount using the token's decimals
                const amount = parseUnits(currentValue, token.decimals);
                console.log('ERC20 transfer:', {
                    inputValue: currentValue,
                    tokenDecimals: token.decimals,
                    rawAmount: amount.toString(),
                    formatted: ethers.formatUnits(amount, token.decimals)
                });
                // Encode transfer(address,uint256) call
                const transferData = new AbiCoder().encode(
                    ['address', 'uint256'],
                    [currentRecipient, amount]
                );
                newTransaction.data = '0xa9059cbb' + transferData.slice(2);
                newTransaction.to = token.address;
            }
        } else if (currentType === 'custom') {
            newTransaction.data = currentData;
            newTransaction.value = parseUnits(currentValue || '0', 18).toString();
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
            // Check if user has enough ETH for the bond
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const balance = await provider.getBalance(await signer.getAddress());

            if (balance < BigInt(minimumBond)) {
                throw new Error(`Insufficient ETH for bond. Required: ${ethers.formatEther(minimumBond)} ETH`);
            }

            // Upload transactions to IPFS to get proposalId
            const cid = await uploadJSONToIPFS(transactions);
            console.log('original CID:', cid);

            // Convert CID to bytes32 for on-chain storage
            //const bytes32Hex = cidToBytes32(cid);
            //console.log('bytes32 value:', bytes32Hex);
            //console.log("decoding test: ", bytes32ToCidV0(bytes32Hex))

            // Get the Reality Module contract instance
            const realityModule = new Contract(
                realityModuleAddress,
                REALITY_MODULE_ABI,
                signer
            );

            // Calculate EIP-712 hashes for each transaction
            const txHashes = await Promise.all(transactions.map(async (tx, index) => {
                return await realityModule.getTransactionHash(
                    tx.to,
                    tx.value,
                    tx.data,
                    tx.operation,
                    index
                );
            }));

            // Call addProposal with the  CID  and the array of transaction hashes
            const tx = await realityModule.addProposal(cid, txHashes);
            await tx.wait();

            onPropose(transactions);
            onClose();
        } catch (error) {
            console.error('Failed to propose transactions:', error);
            // You might want to show an error toast here
        }
    };

    // Helper function to format amount for display
    const formatAmount = (amount: string, decimals: number) => {
        try {
            return ethers.formatUnits(amount, decimals);
        } catch (e) {
            return '0';
        }
    };

    // Helper function to parse amount from display
    const parseAmount = (amount: string, decimals: number) => {
        try {
            return parseUnits(amount, decimals).toString();
        } catch (e) {
            return '0';
        }
    };

    const decodeCalldata = (data: string, type: TransactionType, to: string): { readable: string; raw: string } => {
        if (data === '0x') return { readable: 'No calldata', raw: data };

        try {
            if (type === 'erc20') {
                const iface = new ethers.Interface(ERC20_ABI);
                const decoded = iface.parseTransaction({ data });

                if (decoded) {
                    // Find token by contract address (to)
                    const token = erc20Tokens.find(t => t.address.toLowerCase() === to.toLowerCase());
                    const decimals = token?.decimals || 18;
                    const symbol = token?.symbol || 'tokens';

                    switch (decoded.name) {
                        case 'transfer':
                            return {
                                readable: `Transfer ${ethers.formatUnits(decoded.args[1], decimals)} ${symbol} to ${decoded.args[0]}`,
                                raw: data
                            };
                        case 'transferFrom':
                            return {
                                readable: `Transfer ${ethers.formatUnits(decoded.args[2], decimals)} ${symbol} from ${decoded.args[0]} to ${decoded.args[1]}`,
                                raw: data
                            };
                        case 'approve':
                            return {
                                readable: `Approve ${ethers.formatUnits(decoded.args[1], decimals)} ${symbol} for ${decoded.args[0]}`,
                                raw: data
                            };
                        default:
                            return {
                                readable: `${decoded.name}(${decoded.args.map(arg => arg.toString()).join(', ')})`,
                                raw: data
                            };
                    }
                }
            }
            return {
                readable: 'Custom transaction',
                raw: data
            };
        } catch (error) {
            console.error('Error decoding calldata:', error);
            return {
                readable: 'Failed to decode calldata',
                raw: data
            };
        }
    };

    const toggleRawCalldata = (index: number) => {
        setShowRawIndices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Propose Transaction</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Bond Information */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <h3 className="font-semibold text-blue-800">Required Bond</h3>
                        {isLoadingBond ? (
                            <p className="text-sm mt-1">Loading minimum bond amount...</p>
                        ) : (
                            <p className="text-sm mt-1">
                                You need to have at least {ethers.formatEther(minimumBond)} ETH in your wallet to propose this transaction.
                                The bond will be automatically deducted when you submit the proposal.
                            </p>
                        )}
                    </div>

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
                                <Label>Amount (ETH)</Label>
                                <Input
                                    type="number"
                                    value={currentValue}
                                    onChange={(e) => setCurrentValue(e.target.value)}
                                    placeholder="0.0"
                                    step="0.000000000000000001"
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
                                    step={erc20Tokens.find(t => t.address === currentToken)?.decimals ?
                                        `0.${'0'.repeat(erc20Tokens.find(t => t.address === currentToken)!.decimals - 1)}1` :
                                        "0.000000000000000001"}
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
                                {transactions.map((tx, index) => {
                                    const decoded = decodeCalldata(tx.data, tx.type, tx.to);
                                    const showRaw = showRawIndices.has(index);

                                    return (
                                        <div key={index} className="p-3 border rounded bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    {tx.type !== 'erc20' && (
                                                        <p className="text-sm font-medium">To: {tx.to}</p>
                                                    )}
                                                    {tx.type !== 'erc20' && (
                                                        <p className="text-sm">Value: {ethers.formatEther(tx.value)} ETH</p>
                                                    )}
                                                    <p className="text-sm break-all">
                                                        {decoded.readable}
                                                    </p>
                                                    <div className="mt-2">
                                                        <button
                                                            onClick={() => toggleRawCalldata(index)}
                                                            className="flex items-center text-xs text-gray-500 hover:text-gray-700"
                                                        >
                                                            {showRaw ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                                                            {showRaw ? 'Hide' : 'Show'} {tx.type === 'erc20' ? 'contract details and ' : ''}raw calldata
                                                        </button>
                                                        {showRaw && (
                                                            <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono space-y-1">
                                                                {tx.type === 'erc20' && (
                                                                    <>
                                                                        <p>Contract Address: {tx.to}</p>
                                                                        <p>Native Value: {ethers.formatEther(tx.value)} ETH</p>
                                                                    </>
                                                                )}
                                                                <p className="break-all">Calldata: {decoded.raw}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setTransactions(prev => prev.filter((_, i) => i !== index));
                                                        setShowRawIndices(prev => {
                                                            const newSet = new Set(prev);
                                                            newSet.delete(index);
                                                            return newSet;
                                                        });
                                                    }}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
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
                        disabled={transactions.length === 0 || isLoadingBond}
                    >
                        Propose Transactions
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 