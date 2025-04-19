import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
    BrowserProvider,
    concat,
    getAddress,
    parseEther,
    ZeroAddress,
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

type EscrowMode = 'p2p' | 'grant';
type P2PRole = 'sender' | 'receiver';

// Utility functions from Reality.tsx
const encodeSetupParams = (params: SetupParams): string => {
    console.log('Setup params before encoding:', params);
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
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
    console.log('Encoded setup params:', encoded);
    return encoded;
};

const createSetUpCalldata = (initializerParams: string): string => {
    console.log('Initializer params before creating calldata:', initializerParams);
    console.log('Initializer params length:', ethers.dataLength(initializerParams));
    const calldata = ethers.concat([
        '0xa4f9edbf',
        ethers.zeroPadValue('0x0000000000000000000000000000000000000000000000000000000000000020', 32),
        ethers.zeroPadValue(ethers.toBeHex(ethers.dataLength(initializerParams)), 32),
        initializerParams
    ]);
    console.log('Final setup calldata:', calldata);
    return calldata;
};


const encodeMultiSendTx = (tx: MultiSendTx): string => {
    return ethers.concat([
        '0x00',
        ethers.zeroPadValue(tx.to.toLowerCase(), 20),
        ethers.zeroPadValue('0x0000000000000000000000000000000000000000000000000000000000000000', 32),
        ethers.zeroPadValue(ethers.toBeHex(ethers.dataLength(tx.data)), 32),
        tx.data
    ]);
};

const formatSignature = (signerAddress: string): string => {
    return '0x000000000000000000000000' +
        signerAddress.slice(2).toLowerCase() +
        '000000000000000000000000000000000000000000000000000000000000000001';
};

const prepareSafeTransaction = async (
    signer: ethers.BrowserProvider,
    safeAddress: string
): Promise<SafeTransactionPreparation> => {
    const signerInstance = await signer.getSigner();
    const safe = new ethers.Contract(safeAddress, SAFE_ABI, signerInstance);
    const signerAddress = await signerInstance.getAddress();

    const isOwner = await safe.isOwner(signerAddress);
    if (!isOwner) throw new Error('Signer is not an owner of this Safe');

    const threshold = await safe.getThreshold();
    const nonce = await safe.nonce();

    return { safe, signerAddress, threshold, nonce };
};

const getDefaultContractTerms = (mode: EscrowMode, signerAddress: string, counterpartyAddress: string = "", role: P2PRole = 'sender'): EscrowContractTerms => {
    if (mode === 'p2p') {
        return {
            title: "P2P Escrow Agreement",
            description: "Agreement between two parties for a secure transaction",
            type: 'p2p',
            payments: [
                {
                    address: role === 'sender' ? signerAddress : counterpartyAddress,
                    amount: "0.1",
                    currency: TOKENS.NATIVE.address,
                    role: 'sender'
                },
                {
                    address: role === 'receiver' ? signerAddress : counterpartyAddress,
                    amount: "0.1",
                    currency: TOKENS.NATIVE.address,
                    role: 'receiver'
                }
            ],
            createdAt: Date.now()
        };
    } else {
        return {
            title: "Grant Escrow Agreement",
            description: "Agreement for grant distribution",
            type: 'grant',
            payments: [
                {
                    address: signerAddress,
                    amount: "0.1",
                    currency: TOKENS.NATIVE.address,
                    role: 'sender'
                }
            ],
            createdAt: Date.now()
        };
    }
};

export default function SeancesSetup() {
    // Mode and role selection
    const [escrowMode, setEscrowMode] = useState<EscrowMode>('p2p');
    const [p2pRole, setP2PRole] = useState<P2PRole>('sender');
    const [counterpartyAddress, setCounterpartyAddress] = useState<string>("");

    // Chain state
    const [chainId, setChainId] = useState<number>(DEFAULT_CHAIN_ID);

    // Safe deployment state
    const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD.toString());
    const [saltNonce, setSaltNonce] = useState(DEFAULT_SALT_NONCE);
    const [additionalOwners, setAdditionalOwners] = useState<string[]>([]);
    const [newOwnerAddress, setNewOwnerAddress] = useState("");
    const [deployedSafeAddress, setDeployedSafeAddress] = useState<string | null>(null);
    const [existingSafeAddress, setExistingSafeAddress] = useState("0x3f7f43aF5AA03Eb6c70de81335EF48ef3aF0f2DF");

    // Module deployment state
    const [moduleDeploymentHash, setModuleDeploymentHash] = useState<string | null>(null);
    const [transactionData, setTransactionData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Contract terms state
    const [contractTerms, setContractTerms] = useState<EscrowContractTerms>(() =>
        getDefaultContractTerms('p2p', '', '')
    );

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

    // Update contract terms when mode changes or addresses are set
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_requestAccounts' })
                .then((accounts: string[]) => {
                    if (accounts[0]) {
                        setContractTerms(getDefaultContractTerms(
                            escrowMode,
                            accounts[0],
                            counterpartyAddress,
                            p2pRole
                        ));
                    }
                });
        }
    }, [escrowMode, counterpartyAddress, p2pRole]);

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

            // Set owners based on escrow mode
            let owners: string[];
            if (escrowMode === 'p2p') {
                if (!counterpartyAddress) {
                    throw new Error('Counterparty address is required for P2P mode');
                }
                owners = p2pRole === 'sender'
                    ? [signerAddress, counterpartyAddress]
                    : [counterpartyAddress, signerAddress];
            } else {
                // Grant escrow: only guardian (signer) initially
                owners = [signerAddress];
            }

            // Deploy Safe with threshold 1
            const safeAddress = await deploySafe(
                signer,
                owners,
                1, // Initial threshold is 1
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

            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Prepare Safe and validate signer
            const { safe, signerAddress, nonce } = await prepareSafeTransaction(provider, deployedSafeAddress);

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
            const moduleProxyFactory = new ethers.Contract(contracts.moduleProxyFactory, MODULE_PROXY_FACTORY_ABI, signer);
            const ddh = new ethers.Contract(contracts.ddhAddress, DDH_ABI, signer);

            const initializerParams = encodeSetupParams(setupParams);
            const setUpCalldata = createSetUpCalldata(initializerParams);
            const moduleSaltNonce = Date.now().toString();

            const expectedAddress = await calculateProxyAddress(
                moduleProxyFactory,
                contracts.realityMasterCopy,
                setUpCalldata,
                moduleSaltNonce
            );
            const questionText = `{\"lang\":\"en\",\"type\":\"bool\",\"category\":\"Generic Escrow\",\"title\":\"Is the array of transactions in %s with txhash 0x%s in line with the agreement at ${cid}? The hash is the keccak of the concatenation of the individual EIP-712 hashes of the Module transactions.\"}`

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
            const addOwnerTx = await safe.addOwnerWithThreshold.populateTransaction(expectedAddress, 2);

            // Encode transactions for multisend
            console.log('Deploy transaction data:', deployTx.data);
            console.log('Enable module transaction data:', enableModuleTx.data);
            console.log('Add owner transaction data:', addOwnerTx.data);

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
                }),
                encodeMultiSendTx({
                    operation: 0,
                    to: deployedSafeAddress,
                    value: '0',
                    data: addOwnerTx.data || ''
                })
            ]);

            console.log('Encoded multisend transactions:', encodedTxs);

            // Create and execute Safe transaction
            const multiSend = new ethers.Contract(contracts.safeMultisend, MULTISEND_ABI, signer);
            const multiSendTx = await multiSend.multiSend.populateTransaction(encodedTxs);

            console.log('MultiSend transaction data:', multiSendTx.data);

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
                description: "Reality module has been deployed, enabled, and added as an owner",
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

    // Helper function to add a new payment
    const addPayment = (role: 'sender' | 'receiver') => {
        if (escrowMode === 'grant') {
            setContractTerms({
                ...contractTerms,
                payments: [...contractTerms.payments, {
                    address: "",
                    amount: "0",
                    currency: TOKENS.NATIVE.address,
                    role
                }]
            });
        }
    };

    // Helper function to update a payment
    const updatePayment = (index: number, field: keyof Payment, value: string) => {
        const newPayments = [...contractTerms.payments];
        newPayments[index] = {
            ...newPayments[index],
            [field]: value
        };
        setContractTerms({
            ...contractTerms,
            payments: newPayments
        });
    };

    // Helper function to remove a payment
    const removePayment = (index: number) => {
        if (escrowMode === 'grant') {
            setContractTerms({
                ...contractTerms,
                payments: contractTerms.payments.filter((_, i) => i !== index)
            });
        }
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
                    <h2 className="text-2xl font-bold">Step 1: Configure Escrow Type</h2>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Mode Selection */}
                        <div className="space-y-4">
                            <Label>Escrow Type</Label>
                            <div className="flex space-x-4">
                                <Button
                                    variant={escrowMode === 'p2p' ? 'default' : 'outline'}
                                    onClick={() => setEscrowMode('p2p')}
                                >
                                    P2P Escrow
                                </Button>
                                <Button
                                    variant={escrowMode === 'grant' ? 'default' : 'outline'}
                                    onClick={() => setEscrowMode('grant')}
                                >
                                    Grant Escrow
                                </Button>
                            </div>
                        </div>

                        {/* P2P Role Selection */}
                        {escrowMode === 'p2p' && (
                            <div className="space-y-4">
                                <Label>Your Role</Label>
                                <div className="flex space-x-4">
                                    <Button
                                        variant={p2pRole === 'sender' ? 'default' : 'outline'}
                                        onClick={() => setP2PRole('sender')}
                                    >
                                        I am the Sender
                                    </Button>
                                    <Button
                                        variant={p2pRole === 'receiver' ? 'default' : 'outline'}
                                        onClick={() => setP2PRole('receiver')}
                                    >
                                        I am the Receiver
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Counterparty Address Input - Only show in P2P mode */}
                        {escrowMode === 'p2p' && (
                            <div>
                                <Label>
                                    {p2pRole === 'sender' ? 'Receiver' : 'Sender'} Address
                                </Label>
                                <div className="mt-1">
                                    <Input
                                        value={counterpartyAddress}
                                        onChange={(e) => setCounterpartyAddress(e.target.value)}
                                        placeholder={`Enter ${p2pRole === 'sender' ? 'receiver' : 'sender'} address`}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Deploy button */}
                        <Button
                            className="w-full"
                            onClick={handleSafeDeploy}
                            disabled={loading || !!deployedSafeAddress || (escrowMode === 'p2p' && !counterpartyAddress)}
                        >
                            {loading ? "Deploying..." : deployedSafeAddress ? "Safe Deployed ✓" : "Deploy Safe"}
                        </Button>
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
                        {/* Display Active Safe Address */}
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                            <h3 className="font-semibold text-blue-800">Active Safe Address</h3>
                            <p className="text-sm mt-1">{deployedSafeAddress || existingSafeAddress}</p>
                            <a
                                href={`${blockExplorer}/address/${deployedSafeAddress || existingSafeAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                            >
                                View on Block Explorer →
                            </a>
                        </div>

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

                                    {/* Payments */}
                                    <div>
                                        <Label>Payments</Label>
                                        {contractTerms.payments.map((payment, index) => (
                                            <div key={index} className="flex gap-2 mt-2">
                                                <Input
                                                    placeholder="Address"
                                                    value={payment.address}
                                                    onChange={(e) => updatePayment(index, 'address', e.target.value)}
                                                    disabled={escrowMode === 'p2p'} // Locked in P2P mode
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Amount"
                                                    value={payment.amount}
                                                    onChange={(e) => updatePayment(index, 'amount', e.target.value)}
                                                />
                                                <select
                                                    value={payment.currency}
                                                    onChange={(e) => updatePayment(index, 'currency', e.target.value)}
                                                    className="border rounded p-2"
                                                >
                                                    {getAvailableTokens().map((token) => (
                                                        <option key={token.address} value={token.address}>
                                                            {token.symbol}
                                                        </option>
                                                    ))}
                                                </select>
                                                {escrowMode === 'grant' && (
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => removePayment(index)}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        {escrowMode === 'grant' && (
                                            <div className="flex gap-2 mt-2">
                                                <Button onClick={() => addPayment('sender')}>
                                                    Add Sender
                                                </Button>
                                                <Button onClick={() => addPayment('receiver')}>
                                                    Add Receiver
                                                </Button>
                                            </div>
                                        )}
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
                            disabled={!(deployedSafeAddress || existingSafeAddress) || loading}
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