import { BrowserProvider, Contract, keccak256 } from 'ethers';
import { Question } from 'reality-kleros-subgraph';

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
  transactionDetails: Record<string, ProposalTransaction[]>
): Promise<Record<string, TransactionStatus[]>> {
  if (!moduleAddress) return {};

  try {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const realityModule = new Contract(moduleAddress, REALITY_MODULE_ABI, signer);

    const { proposalId } = parseQuestionData(question.data);
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
    const questionHash = keccak256(await realityModule.buildQuestion(proposalId, txHashes));
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
    return {};
  }
}

function parseQuestionData(data: string): { proposalId: string; txHashesHash: string } {
  const [proposalId, txHashesHash] = data.split('␟');
  return { proposalId, txHashesHash };
} 