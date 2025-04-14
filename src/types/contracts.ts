import { ethers, ContractTransaction } from 'ethers';

export interface SetupParams {
    owner: string;
    avatar: string;
    target: string;
    oracle: string;
    timeout: number;
    cooldown: number;
    expiration: number;
    bond: string;
    templateId: number;
    arbitrator: string;
}

export interface SafeTransaction {
    to: string;
    value: string;
    data: string;
    operation: number;
    safeTxGas: string;
    baseGas: string;
    gasPrice: string;
    gasToken: string;
    refundReceiver: string;
    nonce: string;
}

export interface MultiSendTx {
    operation: number;
    to: string;
    value: string;
    data: string;
}

export interface ModuleDeploymentResult {
    expectedAddress: string;
    deployTx: ContractTransaction;
    enableModuleTx: ContractTransaction;
}

export interface SafeTransactionPreparation {
    safe: ethers.Contract;
    signerAddress: string;
    threshold: bigint;
    nonce: bigint;
} 