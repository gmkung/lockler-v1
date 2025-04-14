import { useState, useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { calculateProxyAddress } from '@gnosis.pm/zodiac';
import { ethers } from 'ethers';

// Extend Window interface to include ethers
declare global {
    interface Window {
        ethereum: any;
        ethers: any;
    }
}

import {
    MODULE_PROXY_FACTORY,
    REALITY_MASTER_COPY,
    DDH_ADDRESS,
    SAFE_MULTISEND,
    DEFAULT_ORACLE,
    DEFAULT_ARBITRATOR,
    DEFAULT_TEMPLATE_CONTENT,
    DEFAULT_TIMEOUTS,
    DEFAULT_BOND
} from '../constants/addresses';

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
    ModuleDeploymentResult,
    SafeTransactionPreparation
} from '../types/contracts';

// Utility functions
const encodeSetupParams = (params: SetupParams): string => {
    return ethers.AbiCoder.defaultAbiCoder().encode(
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

const createSetUpCalldata = (initializerParams: string): string => { // essential implementation, preserve it at all costs
    return ethers.concat([
        '0xa4f9edbf', // setUp function selector, do not touch
        ethers.zeroPadValue('0x0000000000000000000000000000000000000000000000000000000000000020', 32),//do not touch
        ethers.zeroPadValue(ethers.toBeHex(ethers.dataLength(initializerParams)), 32), //do not touch
        initializerParams
    ]);
};

const encodeMultiSendTx = (tx: MultiSendTx): string => { // essential implementation, preserve it at all costs
    return window.ethers.concat([
        '0x00', // operation (0 = CALL)
        window.ethers.zeroPadValue(tx.to.toLowerCase(), 20), // to address
        window.ethers.zeroPadValue('0x0000000000000000000000000000000000000000000000000000000000000000', 32), // value
        window.ethers.zeroPadValue(window.ethers.toBeHex(window.ethers.dataLength(tx.data)), 32), // data length
        tx.data // actual data
    ]);
};

const formatSignature = (signerAddress: string): string => { // essential implementation, preserve it at all costs
    return '0x000000000000000000000000' + // 24 bytes of zeros
        signerAddress.slice(2).toLowerCase() + // owner address without 0x prefix
        '000000000000000000000000000000000000000000000000000000000000000001'; // 32 bytes of zeros + 01
};

const prepareSafeTransaction = async (
    signer: ethers.Signer,
    safeAddress: string
): Promise<SafeTransactionPreparation> => {
    const safe = new ethers.Contract(safeAddress, SAFE_ABI, signer);
    const signerAddress = await signer.getAddress();

    // Validate signer is owner
    const isOwner = await safe.isOwner(signerAddress);
    if (!isOwner) throw new Error('Signer is not an owner of this Safe');

    const threshold = await safe.getThreshold();
    const nonce = await safe.nonce();

    return { safe, signerAddress, threshold, nonce };
};

const prepareModuleDeployment = async (
    signer: ethers.Signer,
    safeAddress: string,
    setupParams: SetupParams
): Promise<ModuleDeploymentResult> => {
    const moduleProxyFactory = new ethers.Contract(MODULE_PROXY_FACTORY, MODULE_PROXY_FACTORY_ABI, signer);
    const ddh = new ethers.Contract(DDH_ADDRESS, DDH_ABI, signer);
    const safe = new ethers.Contract(safeAddress, SAFE_ABI, signer);

    const initializerParams = encodeSetupParams(setupParams);
    const setUpCalldata = createSetUpCalldata(initializerParams);
    const saltNonce = Date.now().toString();

    const expectedAddress = await calculateProxyAddress(
        moduleProxyFactory,
        REALITY_MASTER_COPY,
        setUpCalldata,
        saltNonce
    );

    const deployTx = await ddh.deployWithEncodedParams.populateTransaction(
        MODULE_PROXY_FACTORY,
        REALITY_MASTER_COPY,
        setUpCalldata,
        saltNonce,
        setupParams.oracle,
        DEFAULT_TEMPLATE_CONTENT,
        safeAddress
    );

    const enableModuleTx = await safe.enableModule.populateTransaction(expectedAddress);

    return { expectedAddress, deployTx, enableModuleTx };
};

async function executeMultisendTx(signer: ethers.Signer, safeAddress: string) {
    try {
        // Prepare Safe and validate signer
        const { safe, signerAddress, threshold, nonce } = await prepareSafeTransaction(signer, safeAddress);

        // Prepare setup parameters
        const setupParams: SetupParams = {
            owner: DDH_ADDRESS,
            avatar: safeAddress,
            target: safeAddress,
            oracle: DEFAULT_ORACLE,
            timeout: DEFAULT_TIMEOUTS.TIMEOUT,
            cooldown: DEFAULT_TIMEOUTS.COOLDOWN,
            expiration: DEFAULT_TIMEOUTS.EXPIRATION,
            bond: ethers.parseEther(DEFAULT_BOND).toString(),
            templateId: 0,
            arbitrator: DEFAULT_ARBITRATOR
        };

        // Prepare module deployment transactions
        const { deployTx, enableModuleTx } = await prepareModuleDeployment(signer, safeAddress, setupParams);

        // Encode transactions for multisend
        const encodedTxs = ethers.concat([
            encodeMultiSendTx({
                operation: 0,
                to: DDH_ADDRESS,
                value: '0',
                data: deployTx.data || ''
            }),
            encodeMultiSendTx({
                operation: 0,
                to: safeAddress,
                value: '0',
                data: enableModuleTx.data || ''
            })
        ]);

        // Handle multi-sig case
        if (threshold > 1n) {
            throw new Error('Safe requires multiple signatures. Please use the Safe Transaction Service.');
        }

        // Create and execute Safe transaction
        const multiSend = new ethers.Contract(SAFE_MULTISEND, MULTISEND_ABI, signer);
        const multiSendTx = await multiSend.multiSend.populateTransaction(encodedTxs);

        const safeTx: SafeTransaction = {
            to: SAFE_MULTISEND,
            value: "0",
            data: multiSendTx.data || '',
            operation: 1,
            safeTxGas: "0",
            baseGas: "0",
            gasPrice: "0",
            gasToken: ethers.ZeroAddress,
            refundReceiver: ethers.ZeroAddress,
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
        return { hash: tx.hash, receipt };
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

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            console.log('Using Safe address:', safeAddress);

            const result = await executeMultisendTx(signer, safeAddress);
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