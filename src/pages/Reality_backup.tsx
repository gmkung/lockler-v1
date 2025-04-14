import { useState, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { calculateProxyAddress } from '@gnosis.pm/zodiac';

// Extend Window interface to include ethers
declare global {
    interface Window {
        ethereum: any;
        ethers: any;
    }
}

// Constants
const MODULE_PROXY_FACTORY = '0x000000000000aDdB49795b0f9bA5BC298cDda236';
const REALITY_MASTER_COPY = '0x4e35DA39Fa5893a70A40Ce964F993d891E607cC0';
const DDH_ADDRESS = '0x0961F418E0B6efaA073004989EF1B2fd1bc4a41c';
const SAFE_MULTISEND = '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D';

// ABIs
const MODULE_PROXY_FACTORY_ABI = [
    {
        inputs: [
            {
                internalType: 'address',
                name: 'masterCopy',
                type: 'address',
            },
            {
                internalType: 'bytes',
                name: 'initializer',
                type: 'bytes',
            },
            {
                internalType: 'uint256',
                name: 'saltNonce',
                type: 'uint256',
            },
        ],
        name: 'deployModule',
        outputs: [
            {
                internalType: 'address',
                name: 'proxy',
                type: 'address',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];

const MULTISEND_ABI = [
    {
        inputs: [{ internalType: 'bytes', name: 'transactions', type: 'bytes' }],
        name: 'multiSend',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
];

// Add Safe Contract ABI
const SAFE_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "value", "type": "uint256" },
            { "internalType": "bytes", "name": "data", "type": "bytes" },
            { "internalType": "uint8", "name": "operation", "type": "uint8" },
            { "internalType": "uint256", "name": "safeTxGas", "type": "uint256" },
            { "internalType": "uint256", "name": "baseGas", "type": "uint256" },
            { "internalType": "uint256", "name": "gasPrice", "type": "uint256" },
            { "internalType": "address", "name": "gasToken", "type": "address" },
            { "internalType": "address payable", "name": "refundReceiver", "type": "address" },
            { "internalType": "bytes", "name": "signatures", "type": "bytes" }
        ],
        "name": "execTransaction",
        "outputs": [{ "internalType": "bool", "name": "success", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
        "name": "isOwner",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getThreshold",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "nonce",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "value", "type": "uint256" },
            { "internalType": "bytes", "name": "data", "type": "bytes" },
            { "internalType": "uint8", "name": "operation", "type": "uint8" },
            { "internalType": "uint256", "name": "safeTxGas", "type": "uint256" },
            { "internalType": "uint256", "name": "baseGas", "type": "uint256" },
            { "internalType": "uint256", "name": "gasPrice", "type": "uint256" },
            { "internalType": "address", "name": "gasToken", "type": "address" },
            { "internalType": "address", "name": "refundReceiver", "type": "address" },
            { "internalType": "uint256", "name": "_nonce", "type": "uint256" }
        ],
        "name": "getTransactionHash",
        "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "domainSeparator",
        "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
        "stateMutability": "view",
        "type": "function"
    }
];

async function executeMultisendTx(signer: any, safeAddress: string, chainId: number) {
    if (!safeAddress) {
        throw new Error('Safe address is required');
    }

    try {
        // Create Safe instance
        const safe = new window.ethers.Contract(safeAddress, SAFE_ABI, signer);

        // Get the current address (owner)
        const signerAddress = await signer.getAddress();

        // Check if signer is an owner
        const isOwner = await safe.isOwner(signerAddress);
        if (!isOwner) {
            throw new Error('Signer is not an owner of this Safe');
        }

        // Get Safe threshold
        const threshold = await safe.getThreshold();
        console.log('Safe threshold:', threshold.toString());

        // Get current nonce
        const nonce = await safe.nonce();
        console.log('Safe nonce:', nonce.toString());

        // Create contract instances with signer
        const moduleProxyFactory = new window.ethers.Contract(
            MODULE_PROXY_FACTORY,
            MODULE_PROXY_FACTORY_ABI,
            signer
        );

        // Encode initialization parameters
        const defaultOracle = '0x5b7dD1E86623548AF054A4985F7fc8Ccbb554E2c';
        const defaultArbitrator = '0xf72CfD1B34a91A64f9A98537fe63FBaB7530AdcA';

        console.log('Encoding setUp parameters with:');
        console.log('- DDH_ADDRESS:', DDH_ADDRESS);
        console.log('- Safe Address:', safeAddress);
        console.log('- Oracle:', defaultOracle);
        console.log('- Arbitrator:', defaultArbitrator);
        console.log('- Reality Master Copy:', REALITY_MASTER_COPY);

        // Encode initialization parameters for setUp
        const initializerParams = window.ethers.AbiCoder.defaultAbiCoder().encode(
            [
                'address',
                'address',
                'address',
                'address',
                'uint32',
                'uint32',
                'uint32',
                'uint256',
                'uint256',
                'address',
            ],
            [
                DDH_ADDRESS, // owner
                safeAddress, // avatar
                safeAddress, // target
                defaultOracle, // oracle
                172800, // timeout (2 days)
                172800, // cooldown (2 days)
                604800, // expiration (7 days)
                window.ethers.parseEther('0.1'), // bond
                0, // templateId
                defaultArbitrator, // arbitrator
            ]
        );

        // Encode the complete setUp call with function selector
        const setUpCalldata = window.ethers.concat([
            '0xa4f9edbf', // setUp function selector
            window.ethers.zeroPadValue('0x0000000000000000000000000000000000000000000000000000000000000020', 32), // offset
            window.ethers.zeroPadValue(window.ethers.toBeHex(window.ethers.dataLength(initializerParams)), 32), // length
            initializerParams // actual setUp parameters
        ]);

        // Generate a unique salt nonce
        const saltNonce = Date.now().toString();
        console.log('Using salt nonce:', saltNonce);

        // Calculate the expected module address using Zodiac SDK
        const expectedAddress = await calculateProxyAddress(
            moduleProxyFactory,
            REALITY_MASTER_COPY,
            setUpCalldata,
            saltNonce
        );

        console.log('Expected module address:', expectedAddress);

        // Get deployModule transaction data
        const deployModuleTx = await moduleProxyFactory.deployModule.populateTransaction(
            REALITY_MASTER_COPY,
            setUpCalldata,
            saltNonce
        );

        console.log('Deploy module transaction data:', deployModuleTx.data);

        // Encode the transaction for multiSend
        const encodedTx = window.ethers.concat([
            '0x00', // operation (0 = CALL)
            window.ethers.zeroPadValue(MODULE_PROXY_FACTORY.toLowerCase(), 20), // to address
            window.ethers.zeroPadValue('0x0000000000000000000000000000000000000000000000000000000000000000', 32), // value
            window.ethers.zeroPadValue(window.ethers.toBeHex(window.ethers.dataLength(deployModuleTx.data)), 32), // data length
            deployModuleTx.data // data for deployModule
        ]);

        console.log('Encoded multisend transaction:', encodedTx);

        // Create multiSend contract instance and get transaction data
        const multiSend = new window.ethers.Contract(SAFE_MULTISEND, MULTISEND_ABI, signer);
        const multiSendTx = await multiSend.multiSend.populateTransaction(encodedTx);

        console.log('MultiSend transaction data:', multiSendTx.data);

        // If threshold > 1, we need to get signatures
        if (threshold > 1n) {
            // We should propose the transaction to the Safe Transaction Service
            console.log('Safe requires multiple signatures. Transaction needs to be proposed.');
            throw new Error('Safe requires multiple signatures. Please use the Safe Transaction Service.');
        }

        // Prepare the transaction parameters
        const safeTx = {
            to: SAFE_MULTISEND,
            value: "0",
            data: multiSendTx.data,
            operation: 1, // DelegateCall
            safeTxGas: "0",
            baseGas: "0",
            gasPrice: "0",
            gasToken: "0x0000000000000000000000000000000000000000",
            refundReceiver: "0x0000000000000000000000000000000000000000",
            nonce: nonce.toString()
        };

        // Get the transaction hash that needs to be signed
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

        // Format the signature
        const formattedSignature =
            '0x000000000000000000000000' + // 24 bytes of zeros
            signerAddress.slice(2).toLowerCase() + // owner address without 0x prefix
            '000000000000000000000000000000000000000000000000000000000000000001'; // 32 bytes of zeros + 01

        console.log('Transaction hash:', txHash);
        console.log('Owner signature:', formattedSignature);

        // Execute the transaction through the Safe
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
            formattedSignature,
            { gasLimit: 1000000 } // Add explicit gas limit
        );

        console.log('Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);

        return {
            hash: tx.hash,
            receipt
        };
    } catch (error) {
        console.error('Error executing transaction:', error);
        throw error;
    }
}

export default function Reality() {
    const [safeAddress, setSafeAddress] = useState('0x2c142C4EbFbe2597d09F584fa35f94Ba69ccd011');
    const [transactionData, setTransactionData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);

    // Load ethers.js
    useEffect(() => {
        const loadEthers = async () => {
            if (typeof window.ethers === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.umd.min.js';
                script.type = 'application/javascript';
                document.body.appendChild(script);
                await new Promise((resolve) => (script.onload = resolve));
            }
        };
        loadEthers();
    }, []);

    const handleExecuteTransaction = async () => {
        setLoading(true);
        setError(null);
        setTransactionData(null);
        setTxHash(null);

        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed');
            }

            const provider = new window.ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const network = await provider.getNetwork();
            const chainId = Number(network.chainId);

            console.log('Connected to network:', chainId);
            console.log('Using Safe address:', safeAddress);

            const result = await executeMultisendTx(signer, safeAddress, chainId);
            setTxHash(result.hash);
            setTransactionData(result.receipt);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <Card className="mb-4">
                <CardHeader>
                    <h2 className="text-2xl font-bold">Reality Module Deployment</h2>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Safe Address</label>
                            <Input
                                type="text"
                                value={safeAddress}
                                onChange={(e) => setSafeAddress(e.target.value)}
                                placeholder="Enter Safe address"
                                className="w-full"
                            />
                        </div>

                        <Button
                            onClick={handleExecuteTransaction}
                            disabled={!safeAddress || loading}
                            className="w-full"
                        >
                            {loading ? 'Executing...' : 'Execute Transaction'}
                        </Button>

                        {error && (
                            <div className="text-red-500 mt-2">
                                Error: {error}
                            </div>
                        )}

                        {txHash && (
                            <div className="mt-4">
                                <h3 className="text-xl font-semibold mb-2">Transaction Hash</h3>
                                <pre className="bg-gray-100 p-4 rounded overflow-auto">
                                    {txHash}
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

            {/* Placeholder for future transactions */}
            <Card>
                <CardHeader>
                    <h2 className="text-2xl font-bold">Additional Transactions</h2>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600">
                        This section will contain additional transactions that can be included in the multisend.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
} 