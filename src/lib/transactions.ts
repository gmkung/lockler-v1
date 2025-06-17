import { BrowserProvider, Contract, keccak256, toUtf8Bytes } from 'ethers';
import { Question } from 'reality-kleros-subgraph';
import { CHAIN_CONFIG } from './constants';

interface ProposalTransaction {
  to: string;
  value: string;
  data: string;
  operation: number;
  error?: string;
}

interface TransactionStatus {
  isExecuted: boolean;
  canExecute: boolean;
}

const REALITY_MODULE_ABI = [
  'function buildQuestion(string memory proposalId, bytes32[] memory txHashes) public pure returns (string memory)',
  'function executedProposalTransactions(bytes32 questionHash, bytes32 txHash) public view returns (bool)',
  'function executeProposalWithIndex(string memory proposalId, bytes32[] memory txHashes, address to, uint256 value, bytes memory data, uint8 operation, uint256 txIndex) public',
  'function getTransactionHash(address to, uint256 value, bytes memory data, uint8 operation, uint256 nonce) public view returns (bytes32)'
];

export async function handleExecuteTransaction(
  moduleAddress: string,
  question: Question,
  transaction: ProposalTransaction,
  txIndex: number,
  transactionDetails: Record<string, ProposalTransaction[]>,
  expectedChainId: number
): Promise<Record<string, TransactionStatus[]>> {
  if (!moduleAddress) return {};

  try {
    // For transaction execution, we need to use the wallet's connected provider and signer
    // This is because executing transactions requires the user to sign them
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Check which chain the wallet is connected to
    const network = await provider.getNetwork();
    const walletChainId = network.chainId;
    console.log("Wallet connected to chain:", walletChainId.toString());
    console.log("Expected chain for this Safe/Module:", expectedChainId.toString());
    
    // Validate that the wallet is connected to the correct chain
    if (walletChainId.toString() !== expectedChainId.toString()) {
      const expectedChainName = CHAIN_CONFIG[expectedChainId]?.name || `Chain ID ${expectedChainId}`;
      throw new Error(`Chain mismatch: Your wallet is connected to chain ID ${walletChainId}, but this Safe/Module is on ${expectedChainName} (Chain ID ${expectedChainId}). Please switch your wallet network.`);
    }
    
    const realityModule = new Contract(moduleAddress, REALITY_MODULE_ABI, signer);

    const { proposalId } = parseQuestionData(question.data);
    console.log("DEBUG proposalId:", proposalId)
    const transactions = transactionDetails[question.id];

    // Calculate all transaction hashes
    const txHashes = await Promise.all(transactions.map(async (tx: ProposalTransaction, index: number) => {
      return realityModule.getTransactionHash(
        tx.to,
        tx.value,
        tx.data,
        tx.operation,
        index
      );
    }));

    // Execute the transaction
    const tx = await realityModule.executeProposalWithIndex(
      proposalId,
      txHashes,
      transaction.to,
      transaction.value,
      transaction.data,
      transaction.operation,
      txIndex
    );
    await tx.wait();

    // Update status after execution
    console.log('DEBUG proposalId:', proposalId);
    console.log('DEBUG txHashes:', txHashes);
    console.log('DEBUG transactions:', transactions);
    const questionString = await realityModule.buildQuestion(proposalId, txHashes);
    console.log ('DEBUG questionString:',questionString);
    const questionHash = keccak256(toUtf8Bytes(questionString));
    console.log('DEBUG questionHash:', questionHash);
    const newStatuses = await Promise.all(txHashes.map(async (txHash, index) => {
      const isExecuted = await realityModule.executedProposalTransactions(questionHash, txHash);
      const canExecute = question.currentAnswer === "1" &&
        !isExecuted &&
        (index === 0 || await realityModule.executedProposalTransactions(questionHash, txHashes[index - 1]));

      return { isExecuted, canExecute };
    }));

    return { [question.id]: newStatuses };
  } catch (err) {
    console.error('Error executing transaction:', err);
    // Make sure to propagate the error to be handled by the caller
    throw err;
  }
}

function parseQuestionData(data: string): { proposalId: string; txHashesHash: string } {
  const [proposalId, txHashesHash] = data.split('␟');
  return { proposalId, txHashesHash };
} 
