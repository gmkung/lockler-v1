import { useState, useEffect } from "react";
import {
    BrowserProvider,
    Contract,
    AbiCoder,
    concat,
    zeroPadValue,
    toBeHex,
    getAddress,
    parseEther,
    ZeroAddress
} from "ethers";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { calculateProxyAddress } from '@gnosis.pm/zodiac';
import { deploySafe } from "../lib/web3";

import {
    DEFAULT_THRESHOLD,
    DEFAULT_SALT_NONCE,
    DEFAULT_TIMEOUTS,
    DEFAULT_BOND,
    DEFAULT_CHAIN_ID,
    getChainConfig,
    getContractAddresses,
    getBlockExplorer,
    TOKENS
} from '../lib/constants';

import { EscrowContractTerms, Payment } from '../lib/types';
import { uploadContractTerms, } from '../lib/ipfs';

import {
    MODULE_PROXY_FACTORY_ABI,
    DDH_ABI,
    SAFE_ABI,
    MULTISEND_ABI
} from '../abis/contracts';

import type {
    SetupParams,
    SafeTransaction,
    MultiSendTx,
    SafeTransactionPreparation
} from '../lib/types';

// Utility functions from Reality.tsx
const encodeSetupParams = (params: SetupParams): string => {
    return AbiCoder.defaultAbiCoder().encode(
        [
            'address', 'address', 'address', 'address',
            'uint32', 'uint32', 'uint32',
            'uint256', 'uint256', 'address',
        ],
        [
            params.owner, params.avatar, params.target, params.oracle,
            params.timeout, params.cooldown, params.expiration,
            params.bond, params.templateId, params.arbitrator
        ]
    );
};

const createSetUpCalldata = (initializerParams: string): string => {
    return concat([
        '0xa4f9edbf',
        zeroPadValue('0x0000000000000000000000000000000000000000000000000000000000000020', 32),
        zeroPadValue(toBeHex(AbiCoder.defaultAbiCoder().encode(['uint256'], [AbiCoder.defaultAbiCoder().encode(['string'], [initializerParams])])), 32),
        initializerParams
    ]);
};

const encodeMultiSendTx = (tx: MultiSendTx): string => {
    return concat([
        '0x00',
        zeroPadValue(tx.to.toLowerCase(), 20),
        zeroPadValue('0x0000000000000000000000000000000000000000000000000000000000000000', 32),
        zeroPadValue(toBeHex(AbiCoder.defaultAbiCoder().encode(['uint256'], [AbiCoder.defaultAbiCoder().encode(['bytes'], [tx.data])])), 32),
        tx.data
    ]);
};

const formatSignature = (signerAddress: string): string => {
    return '0x000000000000000000000000' +
        signerAddress.slice(2).toLowerCase() +
        '000000000000000000000000000000000000000000000000000000000000000001';
};

const prepareSafeTransaction = async (
    signer: BrowserProvider,
    safeAddress: string
): Promise<SafeTransactionPreparation> => {
    const safe = new Contract(safeAddress, SAFE_ABI, signer);
    const signerInstance = await signer.getSigner();
    const signerAddress = await signerInstance.getAddress();

    const isOwner = await safe.isOwner(signerAddress);
    if (!isOwner) throw new Error('Signer is not an owner of this Safe');

    const threshold = await safe.getThreshold();
    const nonce = await safe.nonce();

    return { safe, signerAddress, threshold, nonce };
};

const defaultContractTerms: EscrowContractTerms = {
    title: "Marketing Services Agreement",
    description: "Agreement for marketing services...",
    senders: [{
        address: "",
        amount: "0.1",
        currency: TOKENS.NATIVE.address
    }],
    receivers: [{
        address: "",
        amount: "0.1",
        currency: TOKENS.NATIVE.address
    }],
    createdAt: Date.now()
};

export default function SeancesSetup() {
    // Chain state
    const [chainId, setChainId] = useState<number>(DEFAULT_CHAIN_ID);

    // Safe deployment state
    const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD.toString());
    const [saltNonce, setSaltNonce] = useState(DEFAULT_SALT_NONCE);
    const [additionalOwners, setAdditionalOwners] = useState<string[]>([]);
    const [newOwnerAddress, setNewOwnerAddress] = useState("");
    const [deployedSafeAddress, setDeployedSafeAddress] = useState<string | null>(null);

    // Module deployment state
    const [moduleDeploymentHash, setModuleDeploymentHash] = useState<string | null>(null);
    const [transactionData, setTransactionData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [contractTerms, setContractTerms] = useState<EscrowContractTerms>(defaultContractTerms);
    const [contractTermsCID, setContractTermsCID] = useState<string | null>(null);

    const { toast } = useToast();

    // Listen for chain changes
    useEffect(() => {
        const handleChainChanged = (newChainId: string) => {
            setChainId(parseInt(newChainId, 16));
        };

        if (window.ethereum) {
            window.ethereum.on('chainChanged', handleChainChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, []);

    // Get current chain contracts
    const contracts = getContractAddresses(chainId);
    const blockExplorer = getBlockExplorer(chainId);
    const chainConfig = getChainConfig(chainId);

    const addOwner = () => {
        if (getAddress(newOwnerAddress) && !additionalOwners.includes(newOwnerAddress)) {
            setAdditionalOwners([...additionalOwners, newOwnerAddress]);
            setNewOwnerAddress("");
        } else if (!getAddress(newOwnerAddress)) {
            toast({
                variant: "destructive",
                title: "Invalid address",
                description: "Please enter a valid Ethereum address",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Duplicate owner",
                description: "This address is already added as an owner",
            });
        }
    };

    const removeOwner = (index: number) => {
        const updatedOwners = [...additionalOwners];
        updatedOwners.splice(index, 1);
        setAdditionalOwners(updatedOwners);
    };

    const handleSafeDeploy = async () => {
        setLoading(true);
        setError(null);

        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed');
            }

            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const signerAddress = await signer.getAddress();

            // Include the connected address and additional owners
            const allOwners = [signerAddress, ...additionalOwners];
            const thresholdValue = parseInt(threshold, 10);

            // Validate
            if (thresholdValue <= 0 || thresholdValue > allOwners.length) {
                throw new Error(`Threshold must be between 1 and ${allOwners.length}`);
            }

            const safeAddress = await deploySafe(
                signer,
                allOwners,
                thresholdValue,
                contracts.fallbackHandler,
                saltNonce
            );

            setDeployedSafeAddress(safeAddress);

            toast({
                title: "Safe Deployed!",
                description: `Your new Safe has been deployed at: ${safeAddress}`,
            });
        } catch (error: any) {
            console.error("Safe deployment error:", error);
            toast({
                variant: "destructive",
                title: "Safe Deployment Failed",
                description: error.message || "Failed to deploy Safe",
            });
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleModuleDeploy = async () => {
        if (!deployedSafeAddress) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please deploy a Safe first",
            });
            return;
        }

        setLoading(true);
        setError(null);
        setTransactionData(null);
        setModuleDeploymentHash(null);

        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed');
            }

            // Upload contract terms to IPFS first
            const cid = await uploadContractTerms(contractTerms);
            setContractTermsCID(cid);

            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Prepare Safe and validate signer
            const { safe, signerAddress, threshold, nonce } = await prepareSafeTransaction(provider, deployedSafeAddress);

            // Prepare setup parameters
            const setupParams: SetupParams = {
                owner: contracts.ddhAddress,
                avatar: deployedSafeAddress,
                target: deployedSafeAddress,
                oracle: contracts.defaultOracle,
                timeout: DEFAULT_TIMEOUTS.TIMEOUT,
                cooldown: DEFAULT_TIMEOUTS.COOLDOWN,
                expiration: DEFAULT_TIMEOUTS.EXPIRATION,
                bond: parseEther(DEFAULT_BOND).toString(),
                templateId: 0,
                arbitrator: contracts.defaultArbitrator
            };

            // Prepare module deployment transactions
            const moduleProxyFactory = new Contract(contracts.moduleProxyFactory, MODULE_PROXY_FACTORY_ABI, signer);
            const ddh = new Contract(contracts.ddhAddress, DDH_ABI, signer);

            const initializerParams = encodeSetupParams(setupParams);
            const setUpCalldata = createSetUpCalldata(initializerParams);
            const moduleSaltNonce = Date.now().toString();

            const expectedAddress = await calculateProxyAddress(
                moduleProxyFactory,
                contracts.realityMasterCopy,
                setUpCalldata,
                moduleSaltNonce
            );

            //directly generating the questionText for simplicity
            const questionText = `{\"title\": \"Does the array of transactions at %s with hash of 0x%s conform to the terms and conditions laid out in the contract at ${cid}?\", \"type\": \"bool\", \"category\": \"%s\", \"lang\": \"%s\"}`;
            // Use the question text in your deployment
            const deployTx = await ddh.deployWithEncodedParams.populateTransaction(
                contracts.moduleProxyFactory,
                contracts.realityMasterCopy,
                setUpCalldata,
                moduleSaltNonce,
                setupParams.oracle,
                questionText,
                deployedSafeAddress
            );

            const enableModuleTx = await safe.enableModule.populateTransaction(expectedAddress);

            // Encode transactions for multisend
            const encodedTxs = concat([
                encodeMultiSendTx({
                    operation: 0,
                    to: contracts.ddhAddress,
                    value: '0',
                    data: deployTx.data || ''
                }),
                encodeMultiSendTx({
                    operation: 0,
                    to: deployedSafeAddress,
                    value: '0',
                    data: enableModuleTx.data || ''
                })
            ]);

            // Handle multi-sig case
            if (threshold > 1n) {
                throw new Error('Safe requires multiple signatures. Please use the Safe Transaction Service.');
            }

            // Create and execute Safe transaction
            const multiSend = new Contract(contracts.safeMultisend, MULTISEND_ABI, signer);
            const multiSendTx = await multiSend.multiSend.populateTransaction(encodedTxs);

            const safeTx: SafeTransaction = {
                to: contracts.safeMultisend,
                value: "0",
                data: multiSendTx.data || '',
                operation: 1,
                safeTxGas: "0",
                baseGas: "0",
                gasPrice: "0",
                gasToken: ZeroAddress,
                refundReceiver: ZeroAddress,
                nonce: nonce.toString()
            };

            const txHash = await safe.getTransactionHash(
                safeTx.to,
                safeTx.value,
                safeTx.data,
                safeTx.operation,
                safeTx.safeTxGas,
                safeTx.baseGas,
                safeTx.gasPrice,
                safeTx.gasToken,
                safeTx.refundReceiver,
                safeTx.nonce
            );

            const signature = formatSignature(signerAddress);

            const tx = await safe.execTransaction(
                safeTx.to,
                safeTx.value,
                safeTx.data,
                safeTx.operation,
                safeTx.safeTxGas,
                safeTx.baseGas,
                safeTx.gasPrice,
                safeTx.gasToken,
                safeTx.refundReceiver,
                signature,
                { gasLimit: 1000000 }
            );

            const receipt = await tx.wait();
            setModuleDeploymentHash(tx.hash);
            setTransactionData(receipt);

            toast({
                title: "Module Deployed!",
                description: "Reality module has been deployed and enabled",
            });
        } catch (err: any) {
            console.error("Module deployment error:", err);
            setError(err.message);
            toast({
                variant: "destructive",
                title: "Module Deployment Failed",
                description: err.message || "Failed to deploy module",
            });
        } finally {
            setLoading(false);
        }
    };


    const getAvailableTokens = () => {
        const currentChainId = chainId || DEFAULT_CHAIN_ID;
        const availableTokens = [TOKENS.NATIVE]; // Always include native token

        // Add all chain-specific tokens that exist for the current chain
        Object.entries(TOKENS).forEach(([key, tokenConfig]) => {
            if (key !== 'NATIVE' && tokenConfig[currentChainId]) {
                availableTokens.push(tokenConfig[currentChainId]);
            }
        });

        return availableTokens;
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            {/* Chain Information */}
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

            {/* Step 1: Safe Deployment */}
            <Card>
                <CardHeader>
                    <h2 className="text-2xl font-bold">Step 1: Deploy New Safe</h2>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Owners section */}
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Owners</h3>
                            {additionalOwners.map((owner, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded mb-2 flex justify-between items-center">
                                    <span className="text-xs text-gray-800">
                                        {owner.substring(0, 8)}...{owner.substring(owner.length - 6)}
                                    </span>
                                    <Button variant="ghost" size="sm" onClick={() => removeOwner(index)}>
                                        Remove
                                    </Button>
                                </div>
                            ))}

                            <div className="flex gap-2 mt-2">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Add another owner address"
                                        value={newOwnerAddress}
                                        onChange={(e) => setNewOwnerAddress(e.target.value)}
                                    />
                                </div>
                                <Button onClick={addOwner}>Add</Button>
                            </div>
                        </div>

                        {/* Threshold setting */}
                        <div>
                            <Label htmlFor="threshold">Confirmation threshold</Label>
                            <div className="mt-1">
                                <Input
                                    id="threshold"
                                    type="number"
                                    min="1"
                                    max={1 + additionalOwners.length}
                                    value={threshold}
                                    onChange={(e) => setThreshold(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Number of required confirmations for transactions ({threshold} out of {1 + additionalOwners.length} owners)
                                </p>
                            </div>
                        </div>

                        {/* Salt Nonce */}
                        <div>
                            <Label htmlFor="saltNonce">Salt Nonce</Label>
                            <div className="mt-1">
                                <Input
                                    id="saltNonce"
                                    type="text"
                                    value={saltNonce}
                                    onChange={(e) => setSaltNonce(e.target.value)}
                                    placeholder="Salt nonce for deterministic address"
                                />
                            </div>
                        </div>

                        {/* Deploy button */}
                        <Button
                            className="w-full"
                            onClick={handleSafeDeploy}
                            disabled={loading || !!deployedSafeAddress}
                        >
                            {loading ? "Deploying..." : deployedSafeAddress ? "Safe Deployed ✓" : "Deploy Safe"}
                        </Button>

                        {deployedSafeAddress && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                                <h3 className="font-semibold text-green-800">Safe Deployed!</h3>
                                <p className="text-sm mt-1">Address: {deployedSafeAddress}</p>
                                <a
                                    href={`${blockExplorer}/address/${deployedSafeAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                                >
                                    View on Block Explorer →
                                </a>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Step 2: Reality Module Deployment */}
            <Card>
                <CardHeader>
                    <h2 className="text-2xl font-bold">Step 2: Deploy Reality Module</h2>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Contract Terms */}
                        <div className="space-y-6 border-b pb-6">
                            <h3 className="text-xl font-semibold">Contract Terms</h3>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Input Fields Column */}
                                <div className="space-y-6">
                                    {/* Basic Info */}
                                    <div>
                                        <Label htmlFor="title">Title</Label>
                                        <Input
                                            id="title"
                                            value={contractTerms.title}
                                            onChange={(e) => setContractTerms({ ...contractTerms, title: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="description">Description</Label>
                                        <Input
                                            id="description"
                                            value={contractTerms.description}
                                            onChange={(e) => setContractTerms({ ...contractTerms, description: e.target.value })}
                                        />
                                    </div>

                                    {/* Senders */}
                                    <div>
                                        <Label>Senders</Label>
                                        {contractTerms.senders.map((sender, index) => (
                                            <div key={index} className="flex gap-2 mt-2">
                                                <Input
                                                    placeholder="Address"
                                                    value={sender.address}
                                                    onChange={(e) => {
                                                        const newSenders = [...contractTerms.senders];
                                                        newSenders[index] = { ...sender, address: e.target.value };
                                                        setContractTerms({ ...contractTerms, senders: newSenders });
                                                    }}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Amount"
                                                    value={sender.amount}
                                                    onChange={(e) => {
                                                        const newSenders = [...contractTerms.senders];
                                                        newSenders[index] = { ...sender, amount: e.target.value };
                                                        setContractTerms({ ...contractTerms, senders: newSenders });
                                                    }}
                                                />
                                                <select
                                                    value={sender.currency}
                                                    onChange={(e) => {
                                                        const newSenders = [...contractTerms.senders];
                                                        newSenders[index] = { ...sender, currency: e.target.value };
                                                        setContractTerms({ ...contractTerms, senders: newSenders });
                                                    }}
                                                    className="border rounded p-2"
                                                >
                                                    {getAvailableTokens().map((token) => (
                                                        <option key={token.address} value={token.address}>
                                                            {token.symbol}
                                                        </option>
                                                    ))}
                                                </select>
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => {
                                                        const newSenders = contractTerms.senders.filter((_, i) => i !== index);
                                                        setContractTerms({ ...contractTerms, senders: newSenders });
                                                    }}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            className="mt-2"
                                            onClick={() => {
                                                setContractTerms({
                                                    ...contractTerms,
                                                    senders: [...contractTerms.senders, {
                                                        address: "",
                                                        amount: "0",
                                                        currency: TOKENS.NATIVE.address
                                                    }]
                                                });
                                            }}
                                        >
                                            Add Sender
                                        </Button>
                                    </div>

                                    {/* Receivers */}
                                    <div>
                                        <Label>Receivers</Label>
                                        {contractTerms.receivers.map((receiver, index) => (
                                            <div key={index} className="flex gap-2 mt-2">
                                                <Input
                                                    placeholder="Address"
                                                    value={receiver.address}
                                                    onChange={(e) => {
                                                        const newReceivers = [...contractTerms.receivers];
                                                        newReceivers[index] = { ...receiver, address: e.target.value };
                                                        setContractTerms({ ...contractTerms, receivers: newReceivers });
                                                    }}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Amount"
                                                    value={receiver.amount}
                                                    onChange={(e) => {
                                                        const newReceivers = [...contractTerms.receivers];
                                                        newReceivers[index] = { ...receiver, amount: e.target.value };
                                                        setContractTerms({ ...contractTerms, receivers: newReceivers });
                                                    }}
                                                />
                                                <select
                                                    value={receiver.currency}
                                                    onChange={(e) => {
                                                        const newReceivers = [...contractTerms.receivers];
                                                        newReceivers[index] = { ...receiver, currency: e.target.value };
                                                        setContractTerms({ ...contractTerms, receivers: newReceivers });
                                                    }}
                                                    className="border rounded p-2"
                                                >
                                                    {getAvailableTokens().map((token) => (
                                                        <option key={token.address} value={token.address}>
                                                            {token.symbol}
                                                        </option>
                                                    ))}
                                                </select>
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => {
                                                        const newReceivers = contractTerms.receivers.filter((_, i) => i !== index);
                                                        setContractTerms({ ...contractTerms, receivers: newReceivers });
                                                    }}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            className="mt-2"
                                            onClick={() => {
                                                setContractTerms({
                                                    ...contractTerms,
                                                    receivers: [...contractTerms.receivers, {
                                                        address: "",
                                                        amount: "0",
                                                        currency: TOKENS.NATIVE.address
                                                    }]
                                                });
                                            }}
                                        >
                                            Add Receiver
                                        </Button>
                                    </div>
                                </div>

                                {/* JSON Preview Column */}
                                <div className="space-y-4">
                                    <Label>Contract Terms Preview</Label>
                                    <Card className="h-full">
                                        <CardContent className="p-4">
                                            <pre className="text-sm overflow-auto max-h-[600px]">
                                                {JSON.stringify(contractTerms, null, 2)}
                                            </pre>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>

                        {/* Module Deployment Button */}
                        <Button
                            onClick={handleModuleDeploy}
                            disabled={!deployedSafeAddress || loading}
                            className="w-full"
                        >
                            {loading ? 'Deploying...' : moduleDeploymentHash ? 'Module Deployed ✓' : 'Deploy Reality Module'}
                        </Button>

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

                        {contractTermsCID && (
                            <div className="mt-4">
                                <h3 className="text-xl font-semibold mb-2">Contract Terms IPFS CID</h3>
                                <pre className="bg-gray-100 p-4 rounded overflow-auto">
                                    {contractTermsCID}
                                </pre>
                            </div>
                        )}

                        {transactionData && (
                            <div className="mt-4">
                                <h3 className="text-xl font-semibold mb-2">Transaction Receipt</h3>
                                <pre className="bg-gray-100 p-4 rounded overflow-auto">
                                    {JSON.stringify(transactionData, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 