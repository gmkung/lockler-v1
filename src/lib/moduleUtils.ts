import { ethers } from "ethers";
import { BrowserProvider } from "ethers";
import { SAFE_ABI } from "../abis/contracts";
import type { SetupParams, SafeTransactionPreparation, MultiSendTx } from "./types";

export const encodeSetupParams = (params: SetupParams): string => {
    console.log('Setup params before encoding:', params);
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
        [
            'address', 'address', 'address', 'address',
            'uint32', 'uint32', 'uint32',
            'uint256', 'uint256', 'address',
        ],
        [
            params.owner, params.avatar, params.target, params.oracle,
            Math.floor(params.timeout),
            Math.floor(params.cooldown),
            Math.floor(params.expiration),
            params.bond, params.templateId, params.arbitrator
        ]
    );
    console.log('Encoded setup params:', encoded);
    return encoded;
};

export const createSetUpCalldata = (initializerParams: string): string => {
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

export const encodeMultiSendTx = (tx: MultiSendTx): string => {
    return ethers.concat([
        '0x00',
        ethers.zeroPadValue(tx.to.toLowerCase(), 20),
        ethers.zeroPadValue('0x0000000000000000000000000000000000000000000000000000000000000000', 32),
        ethers.zeroPadValue(ethers.toBeHex(ethers.dataLength(tx.data)), 32),
        tx.data
    ]);
};

export const formatSignature = (signerAddress: string): string => {
    return '0x000000000000000000000000' +
        signerAddress.slice(2).toLowerCase() +
        '000000000000000000000000000000000000000000000000000000000000000001';
};

export const prepareSafeTransaction = async (
    signer: BrowserProvider,
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