import { useState, useEffect } from 'react';
import { retrieveQuestions, Question, QuestionProgress, retrieveTemplate } from 'reality-kleros-subgraph';
import { useParams, Navigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { DEFAULT_CHAIN_ID } from '../lib/constants';
import { ProposeTransactionModal, Transaction } from '../components/ProposeTransactionModal';
import { BrowserProvider, Contract, keccak256 } from 'ethers';
import { uploadJSONToIPFS, fetchFromIPFS } from '../lib/ipfs';
import { getRealityModulesForSafe } from '../lib/web3';

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
      if (!realityModuleAddress) return;

      try {
        setIsLoading(true);
        setQuestions([]);
        setProgress({ total: 0, processed: 0, failed: 0 });

        // Process questions as they come in
        for await (const question of retrieveQuestions(
          DEFAULT_CHAIN_ID,
          {
            user: realityModuleAddress.toLowerCase(), // The Reality Module that created the questions
            batchSize: 100
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

export function useRealityModule(safeAddress: string) {
  const [moduleState, setModuleState] = useState<{
    address: string | null;
    isLoading: boolean;
    error: string | null;
    modules: {
      address: string;
      isEnabled: boolean;
      isRealityModule: boolean;
      templateId: string;
      oracle: string;
      validationChecks: {
        isMinimalProxy: boolean;
        implementationMatches: boolean;
        isOwner: boolean;
        hasValidThreshold: boolean;
        hasValidOwnerCount: boolean;
        isOnlyEnabledModule: boolean;
      };
    }[];
    templateContent: string | null;
  }>({
    address: null,
    isLoading: true,
    error: null,
    modules: [],
    templateContent: null
  });

  useEffect(() => {
    if (!safeAddress) {
      setModuleState({
        address: null,
        isLoading: false,
        error: "No Safe address provided",
        modules: [],
        templateContent: null
      });
      return;
    }

    const findRealityModule = async () => {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const modules = await getRealityModulesForSafe(provider, safeAddress, DEFAULT_CHAIN_ID);

        // Find the valid Reality Module
        const validModule = modules.find(m => m.isEnabled && m.isRealityModule &&
          m.validationChecks.isMinimalProxy &&
          m.validationChecks.implementationMatches &&
          m.validationChecks.isOwner &&
          m.validationChecks.hasValidThreshold &&
          m.validationChecks.hasValidOwnerCount &&
          m.validationChecks.isOnlyEnabledModule
        );

        let templateContent = null;
        console.log("validModule.templateId",parseInt(validModule.templateId))
        if (validModule) {
          try {
            const template = await retrieveTemplate(
              DEFAULT_CHAIN_ID,
              validModule.oracle,
              parseInt(validModule.templateId)
            );
            
            if (template?.questionText) {
              try {
                // Extract IPFS URI from template
                const ipfsMatch = template.questionText.match(/\/ipfs\/([^?]+)/);
                if (!ipfsMatch) {
                  throw new Error('No valid IPFS URI found in template');
                }
                
                const ipfsPath = ipfsMatch[0];
                const cdnUrl = `https://cdn.kleros.link${ipfsPath}`;
                
                // Fetch JSON from CDN
                const response = await fetch(cdnUrl);
                if (!response.ok) {
                  throw new Error('Failed to fetch agreement from CDN');
                }
                
                const agreement = await response.json();
                templateContent = JSON.stringify(agreement, null, 2);
              } catch (err) {
                console.error('Error fetching agreement:', err);
                templateContent = 'Error: This is not a proper module - Invalid IPFS agreement';
              }
            } else {
              templateContent = null;
            }
          } catch (err) {
            console.error('Error retrieving template:', err);
          }
        }

        if (!validModule) {
          setModuleState({
            address: null,
            isLoading: false,
            error: "No valid Reality Module found for this Safe",
            modules,
            templateContent
          });
          return;
        }

        setModuleState({
          address: validModule.address,
          isLoading: false,
          error: null,
          modules,
          templateContent
        });
      } catch (err) {
        console.error('Error finding Reality Module:', err);
        setModuleState({
          address: null,
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to find Reality Module",
          modules: [],
          templateContent: null
        });
      }
    };

    findRealityModule();
  }, [safeAddress]);

  return moduleState;
}

export default function Control() {
  const { address: safeAddress } = useParams<{ address: string }>();
  const { address: moduleAddress, isLoading, error, modules, templateContent } = useRealityModule(safeAddress || '');
  const { questions, isLoading: questionsLoading, error: questionsError, progress } =
    useQuestions(moduleAddress || '');
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<Record<string, ProposalTransaction[]>>({});
  const [transactionStatuses, setTransactionStatuses] = useState<Record<string, TransactionStatus[]>>({});
  const [loadingStatuses, setLoadingStatuses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!questions.length || !moduleAddress) return;

    const fetchTransactionDetails = async () => {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const realityModule = new Contract(moduleAddress, REALITY_MODULE_ABI, signer);

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
  }, [questions, moduleAddress]);

  const handleExecuteTransaction = async (
    question: Question,
    transaction: ProposalTransaction,
    txIndex: number
  ) => {
    if (!moduleAddress) return;

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

      setTransactionStatuses(prev => ({ ...prev, [question.id]: newStatuses }));
    } catch (err) {
      console.error('Error executing transaction:', err);
    }
  };

  const handleProposeTransactions = async (transactions: ProposalTransaction[]) => {
    // TODO: Implement transaction proposal logic
    console.log('Proposing transactions:', transactions);
  };

  if (!safeAddress) {
    return <div>No Safe address provided</div>;
  }

  if (isLoading) {
    return <div>Finding Reality Module for Safe...</div>;
  }

  if (error || !moduleAddress) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Reality Module Control</h2>
            <Button onClick={() => setIsProposeModalOpen(true)}>
              Propose Transaction
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            {/* Left side - Safe and Module info */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Safe Address: {safeAddress}</p>
                <p className="text-sm text-gray-600">Reality Module: {moduleAddress}</p>
              </div>
              {modules?.map(module => (
                <div key={module.address} className="p-4 border rounded">
                  <p className="font-semibold">Module: {module.address}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <p className={module.isEnabled ? "text-green-600" : "text-red-600"}>
                      Enabled: {module.isEnabled ? "✓" : "✗"}
                    </p>
                    <p className={module.isRealityModule ? "text-green-600" : "text-red-600"}>
                      Reality Module: {module.isRealityModule ? "✓" : "✗"}
                    </p>
                    <p className={module.validationChecks.isMinimalProxy ? "text-green-600" : "text-red-600"}>
                      Minimal Proxy: {module.validationChecks.isMinimalProxy ? "✓" : "✗"}
                    </p>
                    <p className={module.validationChecks.implementationMatches ? "text-green-600" : "text-red-600"}>
                      Implementation Matches: {module.validationChecks.implementationMatches ? "✓" : "✗"}
                    </p>
                    <p className={module.validationChecks.isOwner ? "text-green-600" : "text-red-600"}>
                      Is Owner: {module.validationChecks.isOwner ? "✓" : "✗"}
                    </p>
                    <p className={module.validationChecks.hasValidThreshold ? "text-green-600" : "text-red-600"}>
                      Valid Threshold: {module.validationChecks.hasValidThreshold ? "✓" : "✗"}
                    </p>
                    <p className={module.validationChecks.hasValidOwnerCount ? "text-green-600" : "text-red-600"}>
                      Valid Owner Count: {module.validationChecks.hasValidOwnerCount ? "✓" : "✗"}
                    </p>
                    <p className={module.validationChecks.isOnlyEnabledModule ? "text-green-600" : "text-red-600"}>
                      Only Enabled Module: {module.validationChecks.isOnlyEnabledModule ? "✓" : "✗"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right side - Agreement and Proposals */}
            <div className="space-y-4">
              {templateContent && (
                <div className="border rounded p-4">
                  <h3 className="text-lg font-semibold mb-2">Agreement</h3>
                  <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-60">
                    {templateContent}
                  </pre>
                </div>
              )}

              <div className="border rounded p-4">
                <h3 className="text-lg font-semibold mb-2">Proposals</h3>
                {questionsLoading ? (
                  <div>
                    <p>Loading proposals...</p>
                    <p>Processed: {progress.processed} of {progress.total}</p>
                  </div>
                ) : questionsError ? (
                  <div className="text-red-500">Error: {questionsError}</div>
                ) : questions.length === 0 ? (
                  <p>No proposals found</p>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question) => (
                      <Card key={question.id}>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <p className="font-semibold">Proposal ID: {question.id}</p>
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
            </div>
          </div>
        </CardContent>
      </Card>

      <ProposeTransactionModal
        isOpen={isProposeModalOpen}
        onClose={() => setIsProposeModalOpen(false)}
        onPropose={handleProposeTransactions}
        chainId={DEFAULT_CHAIN_ID}
        realityModuleAddress={moduleAddress}
      />
    </div>
  );
} 