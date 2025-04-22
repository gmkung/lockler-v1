import { ethers } from 'ethers';

export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

export interface ChainContracts {
  safeProxyFactory: string;
  safeSingleton: string;
  fallbackHandler: string;
  moduleProxyFactory: string;
  realityMasterCopy: string;
  ddhAddress: string;
  safeMultisend: string;
  defaultOracle: string;
  defaultArbitrator: string;
}

export interface Chain {
  id: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: NativeCurrency;
  contracts: ChainContracts;
}

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
  deployTx: {
    to?: string;
    from?: string;
    data?: string;
  };
  enableModuleTx: {
    to?: string;
    from?: string;
    data?: string;
  };
}

export interface SafeTransactionPreparation {
  safe: ethers.Contract;
  signerAddress: string;
  threshold: bigint;
  nonce: bigint;
}

export type Payment = {
  address: string;
  amount: string;
  currency: string;
  role: 'sender' | 'receiver';
};

export type EscrowContractTerms = {
  title: string;
  description: string;
  type: 'p2p' | 'grant';
  payments: Payment[];
  createdAt: number;
  bond?: string;
  timeout?: number;
  cooldown?: number;
  expiration?: number;
};

export interface TemplateData {
  questionTitle: string;
  transactionArrayCID: string;
  transactionHash: string;
  contractTermsCID: string;
  category: string;
  language: string;
}

export interface TransactionStatus {
  isExecuted: boolean;
  canExecute: boolean;
}

export interface ProposalTransaction {
  to: string;
  value: string;
  data: string;
  operation: number;
  error?: string;
  justification?: {
    title: string;
    description: string;
  };
}

export type TransactionType = 'native' | 'erc20' | 'erc721' | 'custom';
