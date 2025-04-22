import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TOKENS, CHAIN_CONFIG } from '../lib/constants';
import { uploadJSONToIPFS } from 'light-curate-data-service';
import { BrowserProvider, Contract, AbiCoder, ethers } from 'ethers';
import { REALITY_MODULE_ABI } from '../abis/realityModule';
import { ERC20_ABI } from '../abis/erc20';
import { useAccount } from 'wagmi';
import { switchChain } from '../lib/utils';
import { ScrollArea } from "./ui/scroll-area";
import { Loader2 } from 'lucide-react';
import { getAvailableTokens, toMinorUnits, fromMinorUnits, formatAmount, getInputStep, TokenInfo } from '../lib/currency';
import { analyzeTransaction } from '@/lib/transactionUtils';
import { ProposalTransaction, TransactionType } from '@/lib/types';

export function ProposeTransactionModal({
    isOpen,
    onClose,
    onPropose,
    chainId,
    realityModuleAddress
}: {
    isOpen: boolean;
    onClose: () => void;
    onPropose: (transactions: ProposalTransaction[]) => void;
    chainId: number;
    realityModuleAddress: string;
}) {
    const { address } = useAccount();
    const [transactions, setTransactions] = useState<ProposalTransaction[]>([]);
    const [showRawIndices, setShowRawIndices] = useState<Set<number>>(new Set());
    const [currentType, setCurrentType] = useState<TransactionType>('native');
    const [currentTo, setCurrentTo] = useState('');
    const [currentValue, setCurrentValue] = useState('');
    const [currentData, setCurrentData] = useState('');
    const [currentRecipient, setCurrentRecipient] = useState('');
    const [currentJustification, setCurrentJustification] = useState({ title: '', description: '' });
    const [minimumBond, setMinimumBond] = useState<string>('0');
    const [isLoadingBond, setIsLoadingBond] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const nativeCurrency = CHAIN_CONFIG[chainId]?.nativeCurrency?.symbol || '';

    const availableTokens = getAvailableTokens(chainId);
    const erc20Tokens = availableTokens.filter(token => token.address !== TOKENS.NATIVE.address);
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
        if (currentType === 'native' && (!currentTo || !currentValue || !currentJustification.title)) {
            return;
        }
        if (currentType === 'erc20' && (!currentRecipient || !currentValue || !currentToken || !currentJustification.title)) {
            return;
        }
        if (currentType === 'erc721' && (!currentTo || !currentValue || !currentRecipient || !currentJustification.title)) {
            return;
        }
        if (currentType === 'custom' && (!currentTo || !currentData || !currentJustification.title)) {
            return;
        }

        let newTransaction: ProposalTransaction = {
            id: crypto.randomUUID(),
            to: currentTo,
            value: '0',
            data: '0x',
            operation: 0,
            type: currentType,
            justification: {
                title: currentJustification.title,
                description: currentJustification.description
            }
        };

        if (currentType === 'native') {
            const weiAmount = toMinorUnits(currentValue, TOKENS.NATIVE.address, chainId);
            console.log('Native token transfer:', {
                inputValue: currentValue,
                weiAmount,
                formatted: formatAmount(weiAmount, TOKENS.NATIVE.address, chainId)
            });
            newTransaction.value = weiAmount;
            newTransaction.to = currentTo;
        } else if (currentType === 'erc20') {
            const token = erc20Tokens.find(t => t.address === currentToken);
            if (token) {
                const amount = toMinorUnits(currentValue, token.address, chainId);
                console.log('ERC20 transfer:', {
                    inputValue: currentValue,
                    tokenDecimals: token.decimals,
                    rawAmount: amount,
                    formatted: formatAmount(amount, token.address, chainId)
                });
                const transferData = new AbiCoder().encode(
                    ['address', 'uint256'],
                    [currentRecipient, amount]
                );
                newTransaction.data = '0xa9059cbb' + transferData.slice(2);
                newTransaction.to = token.address;
                newTransaction.operation = 0;
            }
        } else if (currentType === 'erc721') {
            const transferData = new AbiCoder().encode(
                ['address', 'address', 'uint256'],
                [address, currentRecipient, currentValue]
            );
            newTransaction.data = '0x23b872dd' + transferData.slice(2);
            newTransaction.to = currentTo;
            newTransaction.operation = 0;
        } else if (currentType === 'custom') {
            newTransaction.data = currentData;
            newTransaction.value = toMinorUnits(currentValue || '0', TOKENS.NATIVE.address, chainId);
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
        setCurrentJustification({ title: '', description: '' });
    };

    const handlePropose = async () => {
        if (transactions.length === 0) return;

        setIsSubmitting(true);

        try {
            const chainSwitchResult = await switchChain(chainId);

            if (!chainSwitchResult.success) {
                throw new Error(chainSwitchResult.error);
            }

            const provider = chainSwitchResult.provider as BrowserProvider;
            const signer = await provider.getSigner();

            const balance = await provider.getBalance(address);

            if (balance < BigInt(minimumBond)) {
                throw new Error(`Insufficient ${nativeCurrency} for bond. Required: ${formatAmount(minimumBond.toString(), TOKENS.NATIVE.address, chainId)}, you have: ${formatAmount(balance.toString(), TOKENS.NATIVE.address, chainId)}`);
            }

            const realityModule = new Contract(
                realityModuleAddress,
                REALITY_MODULE_ABI,
                signer
            );

            const cid = await uploadJSONToIPFS(transactions);
            console.log('original CID:', cid);

            const txHashes = await Promise.all(transactions.map(async (tx, index) => {
                return await realityModule.getTransactionHash(
                    tx.to,
                    tx.value,
                    tx.data,
                    tx.operation,
                    index
                );
            }));

            const tx = await realityModule.addProposal(cid, txHashes);
            await tx.wait();

            onPropose(transactions);
            setTransactions([]);
            onClose();
        } catch (error) {
            console.error('Failed to propose transactions:', error);
            alert(error.message || 'Failed to propose transactions. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatValue = (amount: string, decimals: string, chainId: number) => {
        try {
            return ethers.formatUnits(amount, decimals);
        } catch (e) {
            return '0';
        }
    };

    const parseAmount = (amount: string, decimals: number) => {
        try {
            return toMinorUnits(amount, TOKENS.NATIVE.address, chainId);
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
                    const token = erc20Tokens.find(t => t.address.toLowerCase() === to.toLowerCase());
                    const decimals = token?.decimals || 18;
                    const symbol = token?.symbol || 'tokens';

                    switch (decoded.name) {
                        case 'transfer':
                            return {
                                readable: `Transfer ${formatAmount(decoded.args[1].toString(), token?.address || '', chainId)} ${symbol} to ${decoded.args[0]}`,
                                raw: data
                            };
                        case 'transferFrom':
                            return {
                                readable: `Transfer ${formatAmount(decoded.args[2].toString(), token?.address || '', chainId)} ${symbol} from ${decoded.args[0]} to ${decoded.args[1]}`,
                                raw: data
                            };
                        case 'approve':
                            return {
                                readable: `Approve ${formatAmount(decoded.args[1].toString(), token?.address || '', chainId)} ${symbol} for ${decoded.args[0]}`,
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
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Propose Transaction</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 flex-1 overflow-y-auto px-1">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <h3 className="font-semibold text-blue-800">Required Bond</h3>
                        {isLoadingBond ? (
                            <p className="text-sm mt-1">Loading minimum bond amount...</p>
                        ) : (
                            <p className="text-sm mt-1">
                                You need to have at least {formatAmount(minimumBond, TOKENS.NATIVE.address, chainId)} to propose this transaction.
                                The bond will be returned if your proposal is approved.
                            </p>
                        )}
                    </div>

                    <div className="space-y-4">
                        <Label>Transaction Type</Label>
                        <Select value={currentType} onValueChange={(value: TransactionType) => setCurrentType(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="native">Native Token Transfer</SelectItem>
                                <SelectItem value="erc20">ERC20 Transfer</SelectItem>
                                <SelectItem value="erc721">ERC721 Transfer</SelectItem>
                                <SelectItem value="custom">Custom Transaction</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="justification-title">Title</Label>
                            <Input
                                id="justification-title"
                                value={currentJustification.title}
                                onChange={(e) => setCurrentJustification(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Brief title explaining the purpose of this transaction"
                            />
                        </div>
                        <div>
                            <Label htmlFor="justification-description">Description</Label>
                            <textarea
                                id="justification-description"
                                value={currentJustification.description}
                                onChange={(e) => setCurrentJustification(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Provide a detailed explanation (in Markdown acceptable). You can include links, lists, and other formatting."
                                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            />
                        </div>
                    </div>

                    {currentType === 'native' && (
                        <div className="space-y-4">
                            <div>
                                <Label>Recipient Address</Label>
                                <Input
                                    value={currentTo}
                                    onChange={(e) => setCurrentTo(e.target.value)}
                                    placeholder="0x..."
                                />
                            </div>
                            <div>
                                <Label>Amount ({nativeCurrency})</Label>
                                <Input
                                    type="number"
                                    value={currentValue}
                                    onChange={(e) => setCurrentValue(e.target.value)}
                                    placeholder="0.0"
                                    step={getInputStep(TOKENS.NATIVE.address, chainId)}
                                />
                            </div>
                            <Button
                                onClick={addTransaction}
                                disabled={!currentTo || !currentValue || !currentJustification.title}
                            >
                                Add Transaction
                            </Button>
                        </div>
                    )}

                    {currentType === 'erc20' && (
                        <div className="space-y-4">
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
                                    step={getInputStep(currentToken, chainId)}
                                />
                            </div>
                            <Button
                                onClick={addTransaction}
                                disabled={!currentRecipient || !currentValue || !currentToken || !currentJustification.title}
                            >
                                Add Transaction
                            </Button>
                        </div>
                    )}

                    {currentType === 'erc721' && (
                        <div className="space-y-4">
                            <div>
                                <Label>NFT Contract Address</Label>
                                <Input
                                    value={currentTo}
                                    onChange={(e) => setCurrentTo(e.target.value)}
                                    placeholder="0x..."
                                />
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
                                <Label>Token ID</Label>
                                <Input
                                    type="number"
                                    value={currentValue}
                                    onChange={(e) => setCurrentValue(e.target.value)}
                                    placeholder="Token ID"
                                    min="0"
                                    step="1"
                                />
                            </div>
                            <Button
                                onClick={addTransaction}
                                disabled={!currentTo || !currentValue || !currentRecipient || !currentJustification.title}
                            >
                                Add Transaction
                            </Button>
                        </div>
                    )}

                    {currentType === 'custom' && (
                        <div className="space-y-4">
                            <div>
                                <Label>Target Address</Label>
                                <Input
                                    value={currentTo}
                                    onChange={(e) => setCurrentTo(e.target.value)}
                                    placeholder="0x..."
                                />
                            </div>
                            <div>
                                <Label>Value ({nativeCurrency})</Label>
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
                            <Button
                                onClick={addTransaction}
                                disabled={!currentTo || !currentData || !currentJustification.title}
                            >
                                Add Transaction
                            </Button>
                        </div>
                    )}

                    <div className="mt-6">
                        <h3 className="font-semibold mb-2">Current Transactions</h3>
                        {transactions.length === 0 ? (
                            <p className="text-sm text-gray-500">No transactions added yet</p>
                        ) : (
                            <ScrollArea className="h-[200px]">
                                <div className="space-y-2">
                                    {transactions.map((tx, index) => {
                                        const details = analyzeTransaction(tx, chainId);
                                        const showRaw = showRawIndices.has(index);

                                        return (
                                            <div key={tx.id} className="p-3 border rounded bg-gray-50">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-1">
                                                        <div className="mb-2">
                                                            <h4 className="font-medium text-sm">{tx.justification.title}</h4>
                                                            {tx.justification.description && (
                                                                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{tx.justification.description}</p>
                                                            )}
                                                        </div>
                                                        <p className="text-sm font-medium">
                                                            To: {`${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`}
                                                        </p>
                                                        <p className="text-sm">
                                                            Value: {formatAmount(details.value, TOKENS.NATIVE.address, chainId)}
                                                        </p>
                                                        {details.type === 'erc20' && (
                                                            <p className="text-sm">
                                                                Transfer: {formatAmount(details.amount, details.to, chainId)} to {`${details.recipient.slice(0, 6)}...${details.recipient.slice(-4)}`}
                                                            </p>
                                                        )}
                                                        {details.type === 'erc721' && (
                                                            <p className="text-sm">
                                                                Transfer: NFT #{details.tokenId} to {`${details.recipient.slice(0, 6)}...${details.recipient.slice(-4)}`}
                                                            </p>
                                                        )}
                                                        {details.type === 'custom' && details.decodedCalldata && (
                                                            <p className="text-sm break-all">
                                                                Function: {details.decodedCalldata.functionName}
                                                            </p>
                                                        )}
                                                        <div className="mt-2">
                                                            <button
                                                                onClick={() => toggleRawCalldata(index)}
                                                                className="flex items-center text-xs text-gray-500 hover:text-gray-700"
                                                            >
                                                                {showRaw ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                                                                {showRaw ? 'Hide' : 'Show'} raw details
                                                            </button>
                                                            {showRaw && (
                                                                <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono space-y-1">
                                                                    <p>Contract Address: {tx.to}</p>
                                                                    <p>Native Value: {formatAmount(details.value, TOKENS.NATIVE.address, chainId)}</p>
                                                                    <p className="break-all">Calldata: {tx.data}</p>
                                                                    {details.type === 'custom' && details.decodedCalldata && (
                                                                        <p className="break-all">
                                                                            Decoded: {details.decodedCalldata.functionName}({details.decodedCalldata.params.join(', ')})
                                                                        </p>
                                                                    )}
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
                            </ScrollArea>
                        )}
                    </div>
                </div>

                <DialogFooter className="mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button
                        onClick={handlePropose}
                        disabled={transactions.length === 0 || isLoadingBond || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Submitting Proposal...
                            </>
                        ) : (
                            'Propose Transactions'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
