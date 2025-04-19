import { ethers } from "ethers";
import { BrowserProvider, parseEther, ZeroAddress, concat } from "ethers";
import { calculateProxyAddress } from '@gnosis.pm/zodiac';
import { deploySafe } from "./web3";
import {
    encodeSetupParams,
    createSetUpCalldata,
    encodeMultiSendTx,
    formatSignature,
    prepareSafeTransaction
} from './moduleUtils';
import { MODULE_PROXY_FACTORY_ABI, DDH_ABI, MULTISEND_ABI } from '../abis/contracts';
import type { SetupParams, SafeTransaction, MultiSendTx } from './types';

export const deploySafeWithOwners = async (
    provider: BrowserProvider,
    escrowMode: 'p2p' | 'grant',
    p2pRole: 'sender' | 'receiver',
    counterpartyAddress: string,
    saltNonce: string,
    contracts: any
) => {
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

    return safeAddress;
};

export const deployRealityModule = async (
    provider: BrowserProvider,
    safeAddress: string,
    contracts: any,
    cid: string,
    options: {
        timeout?: number;
        cooldown?: number;
        expiration?: number;
        bond?: string;
    } = {}
) => {
    const signer = await provider.getSigner();

    // Prepare Safe and validate signer
    const { safe, signerAddress, nonce } = await prepareSafeTransaction(provider, safeAddress);

    // Prepare setup parameters with defaults
    const setupParams: SetupParams = {
        owner: contracts.ddhAddress,
        avatar: safeAddress,
        target: safeAddress,
        oracle: contracts.defaultOracle,
        timeout: options.timeout ?? 86400, // 24 hours
        cooldown: options.cooldown ?? 3600, // 1 hour
        expiration: options.expiration ?? 604800, // 1 week
        bond: options.bond ?? parseEther("0.1").toString(),
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

    const questionText = `{\"lang\":\"en\",\"type\":\"bool\",\"category\":\"Generic Escrow\",\"title\":\"Is the array of transactions in %s with txhash 0x%s in line with the agreement at ${cid}? The hash is the keccak of the concatenation of the individual EIP-712 hashes of the Module transactions.\"}`;

    const deployTx = await ddh.deployWithEncodedParams.populateTransaction(
        contracts.moduleProxyFactory,
        contracts.realityMasterCopy,
        setUpCalldata,
        moduleSaltNonce,
        setupParams.oracle,
        questionText,
        safeAddress
    );

    const enableModuleTx = await safe.enableModule.populateTransaction(expectedAddress);
    const addOwnerTx = await safe.addOwnerWithThreshold.populateTransaction(expectedAddress, 2);

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
            to: safeAddress,
            value: '0',
            data: enableModuleTx.data || ''
        }),
        encodeMultiSendTx({
            operation: 0,
            to: safeAddress,
            value: '0',
            data: addOwnerTx.data || ''
        })
    ]);

    // Create and execute Safe transaction
    const multiSend = new ethers.Contract(contracts.safeMultisend, MULTISEND_ABI, signer);
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
    return {
        txHash: tx.hash,
        receipt
    };
}; 