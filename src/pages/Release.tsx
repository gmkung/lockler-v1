import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { DEFAULT_CHAIN_ID } from '../lib/constants';
import { ProposeTransactionModal } from '../components/ProposeTransactionModal';
import { useQuestions } from '../hooks/useQuestions';
import { useRealityModule } from '../hooks/useRealityModule';
import { Question } from 'reality-kleros-subgraph';
import { handleExecuteTransaction } from '../lib/transactions';
import { useTransactionStatus } from '../hooks/useTransactionStatus';
import { ProposalTransaction } from '../lib/types';
import { bytes32ToCidV0 } from '../lib/cid';
import { VouchProposal } from '../components/VouchProposal';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export default function Control() {
  const { address: safeAddress } = useParams<{ address: string }>();
  const { address: moduleAddress, isLoading, error, modules, templateContent } = useRealityModule(safeAddress || '');
  const { questions, isLoading: questionsLoading, error: questionsError, progress } =
    useQuestions(moduleAddress || '');
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
  const { transactionDetails, transactionStatuses, loadingStatuses, setTransactionStatuses } = useTransactionStatus(questions, moduleAddress);
  const { address } = useAccount();
  const { connect } = useConnect();

  const handleExecuteTransactionWrapper = async (
    question: Question,
    transaction: ProposalTransaction,
    txIndex: number
  ) => {
    if (!moduleAddress) return;

    const newStatuses = await handleExecuteTransaction(
      moduleAddress,
      question,
      transaction,
      txIndex,
      transactionDetails
    );

    setTransactionStatuses(prev => ({ ...prev, ...newStatuses }));
  };

  const getIpfsLink = (proposalId: string): string | null => {
    try {
      const cidV0 = bytes32ToCidV0(proposalId);
      return `https://ipfs.io/ipfs/${cidV0}`;
    } catch (error) {
      console.warn('Failed to decode proposalId as CID:', proposalId, error);
      return null;
    }
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
            <div className="flex gap-4">
              {!address ? (
                <Button 
                  onClick={() => connect({ connector: injected() })}
                  variant="outline"
                >
                  Connect Wallet
                </Button>
              ) : (
                <p className="text-sm text-gray-600 self-center">Connected: {address.slice(0, 6)}...{address.slice(-4)}</p>
              )}
              <Button onClick={() => setIsProposeModalOpen(true)}>
                Propose Transaction
              </Button>
            </div>
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
                    {questions.map((question) => {
                      const ipfsLink = getIpfsLink(question.id);

                      return (
                        <Card key={question.id}>
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex flex-col gap-1">
                                <p className="font-semibold">Proposal ID: {question.id}</p>
                                {ipfsLink && (
                                  <p className="text-sm text-blue-600">
                                    <a href={ipfsLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                      View on IPFS
                                    </a>
                                  </p>
                                )}
                              </div>
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
                                          onClick={() => handleExecuteTransactionWrapper(question, tx, index)}
                                        >
                                          Execute
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              ))}
                              {(question.phase !== "OPEN").toString()}
                              <VouchProposal
                                questionId={question.id}
                                moduleAddress={moduleAddress}
                                disabled={question.phase !== "OPEN"}
                                onVouchComplete={() => {
                                  // Optionally refresh data
                                }}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
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
        onPropose={() => { }}
        chainId={DEFAULT_CHAIN_ID}
        realityModuleAddress={moduleAddress}
      />
    </div>
  );
} 