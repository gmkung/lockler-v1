import { useState, useEffect } from 'react';
import { retrieveQuestions, Question, QuestionProgress } from 'reality-kleros-subgraph';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { DEFAULT_CHAIN_ID } from '../lib/constants';
import { ProposeTransactionModal, Transaction } from '../components/ProposeTransactionModal';
import { BrowserProvider, Contract, keccak256 } from 'ethers';
import { uploadJSONToIPFS, fetchFromIPFS } from '../lib/ipfs';

interface ParsedQuestionData {
  proposalId: string;  // IPFS CID
  txHashesHash: string; // keccak256 of concatenated EIP-712 hashes
}

interface TransactionStatus {
  isExecuted: boolean;
  canExecute: boolean;
}

interface ProposalTransaction {
  to: string;
  value: string;
  data: string;
  operation: number;
  error?: string;
}

const REALITY_MODULE_ABI = [
  'function buildQuestion(string memory proposalId, bytes32[] memory txHashes) public pure returns (string memory)',
  'function executedProposalTransactions(bytes32 questionHash, bytes32 txHash) public view returns (bool)',
  'function executeProposalWithIndex(string memory proposalId, bytes32[] memory txHashes, address to, uint256 value, bytes memory data, uint8 operation, uint256 txIndex) public',
  'function getTransactionHash(address to, uint256 value, bytes memory data, uint8 operation, uint256 nonce) public view returns (bytes32)'
];

function parseQuestionData(data: string): ParsedQuestionData {
  const [proposalId, txHashesHash] = data.split('␟');
  return { proposalId, txHashesHash };
}

export function useQuestions(realityModuleAddress: string) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<QuestionProgress>({
    total: 0,
    processed: 0,
    failed: 0
  });

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setIsLoading(true);
        setQuestions([]);
        setProgress({ total: 0, processed: 0, failed: 0 });

        // Process questions as they come in
        for await (const question of retrieveQuestions(
          DEFAULT_CHAIN_ID,
          {
            batchSize: 100,
            user: realityModuleAddress
          },
          (progress) => {
            setProgress(progress);
          }
        )) {
          setQuestions(prev => [...prev, question]);
        }

        setError(null);
      } catch (err) {
        console.error('Error loading questions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [realityModuleAddress]);

  return { questions, isLoading, error, progress };
}

export default function Control() {
  const { address } = useParams<{ address: string }>();
  const { questions, isLoading, error, progress } = useQuestions(address || '');
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<Record<string, ProposalTransaction[]>>({});
  const [transactionStatuses, setTransactionStatuses] = useState<Record<string, TransactionStatus[]>>({});
  const [loadingStatuses, setLoadingStatuses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!questions.length || !address) return;

    const fetchTransactionDetails = async () => {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const realityModule = new Contract(address, REALITY_MODULE_ABI, signer);

      for (const question of questions) {
        try {
          setLoadingStatuses(prev => ({ ...prev, [question.id]: true }));

          const { proposalId } = parseQuestionData(question.data);

          // Check if proposalId is an IPFS CID
          if (!proposalId.startsWith('/ipfs/')) {
            setTransactionDetails(prev => ({
              ...prev,
              [question.id]: [{
                to: '0x0000000000000000000000000000000000000000',
                value: '0',
                data: '0x',
                operation: 0,
                error: 'Not a compatible proposal (not an IPFS CID)'
              }]
            }));
            setTransactionStatuses(prev => ({
              ...prev,
              [question.id]: [{ isExecuted: false, canExecute: false }]
            }));
            continue;
          }

          const transactions = await fetchFromIPFS(proposalId);

          // Calculate transaction hashes
          const txHashes = await Promise.all(transactions.map(async (tx: ProposalTransaction, index: number) => {
            return realityModule.getTransactionHash(
              tx.to,
              tx.value,
              tx.data,
              tx.operation,
              index
            );
          }));

          // Get question hash and check execution status
          const questionHash = keccak256(await realityModule.buildQuestion(proposalId, txHashes));

          const statuses = await Promise.all(txHashes.map(async (txHash, index) => {
            const isExecuted = await realityModule.executedProposalTransactions(questionHash, txHash);
            const canExecute = question.currentAnswer === "1" && // Positive answer
              !isExecuted && // Not already executed
              (index === 0 || await realityModule.executedProposalTransactions(questionHash, txHashes[index - 1])); // First tx or previous executed

            return { isExecuted, canExecute };
          }));

          setTransactionDetails(prev => ({ ...prev, [question.id]: transactions }));
          setTransactionStatuses(prev => ({ ...prev, [question.id]: statuses }));
        } catch (err) {
          console.error(`Error fetching details for question ${question.id}:`, err);
        } finally {
          setLoadingStatuses(prev => ({ ...prev, [question.id]: false }));
        }
      }
    };

    fetchTransactionDetails();
  }, [questions, address]);

  const handleExecuteTransaction = async (
    question: Question,
    transaction: ProposalTransaction,
    txIndex: number
  ) => {
    if (!address) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const realityModule = new Contract(address, REALITY_MODULE_ABI, signer);

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

      setTransactionStatuses(prev => ({ ...prev, [question.id]: newStatuses }));
    } catch (err) {
      console.error('Error executing transaction:', err);
    }
  };

  const handleProposeTransactions = async (transactions: ProposalTransaction[]) => {
    // TODO: Implement transaction proposal logic
    console.log('Proposing transactions:', transactions);
  };

  if (!address) {
    return <div>No Reality Module address provided</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Reality Module Control</h2>
              <p className="text-sm text-gray-600">Module Address: {address}</p>
            </div>
            <Button onClick={() => setIsProposeModalOpen(true)}>
              Propose Transaction
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>
              <p>Loading questions...</p>
              <p>Processed: {progress.processed} of {progress.total}</p>
            </div>
          ) : error ? (
            <div className="text-red-500">Error: {error}</div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Questions</h3>
              {questions.length === 0 ? (
                <p>No questions found</p>
              ) : (
                <div className="space-y-4">
                  {questions.map((question) => (
                    <Card key={question.id}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <p className="font-semibold">Question ID: {question.id}</p>
                          <p>Title: {question.title}</p>
                          <p>Status: {question.phase}</p>
                          <p>Answer: {question.currentAnswer}</p>

                          {loadingStatuses[question.id] ? (
                            <p>Loading transaction details...</p>
                          ) : transactionDetails[question.id]?.map((tx, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded">
                              <p>Transaction {index + 1}</p>
                              {tx.error ? (
                                <p className="text-red-600">{tx.error}</p>
                              ) : (
                                <>
                                  <p className="text-sm">To: {tx.to}</p>
                                  <p className="text-sm">Value: {tx.value}</p>
                                  <p className="text-sm">Data: {tx.data.slice(0, 10)}...</p>
                                  {transactionStatuses[question.id]?.[index]?.isExecuted ? (
                                    <p className="text-green-600">Executed ✓</p>
                                  ) : (
                                    <Button
                                      disabled={!transactionStatuses[question.id]?.[index]?.canExecute}
                                      onClick={() => handleExecuteTransaction(question, tx, index)}
                                    >
                                      Execute
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ProposeTransactionModal
        isOpen={isProposeModalOpen}
        onClose={() => setIsProposeModalOpen(false)}
        onPropose={handleProposeTransactions}
        chainId={DEFAULT_CHAIN_ID}
        realityModuleAddress={address}
      />
    </div>
  );
} 