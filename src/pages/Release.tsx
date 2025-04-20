
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
import { CircleCheck, ExternalLink, Info, Lock, Shield, Wallet } from 'lucide-react';

export default function Release() {
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

  const getStatusBadge = (phase: string) => {
    switch(phase) {
      case "OPEN":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Posted</span>;
      case "PENDING":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending</span>;
      case "ANSWERED":
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Answered</span>;
      case "FINALIZED":
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Finalized</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{phase}</span>;
    }
  };

  const getSecurityIcon = (isValid: boolean) => {
    return isValid ? 
      <CircleCheck className="h-4 w-4 text-green-600" /> : 
      <Info className="h-4 w-4 text-red-600" />;
  };

  if (!safeAddress) {
    return (
      <div className="container mx-auto p-8 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Lockler Address</h2>
            <p className="text-gray-600">Please provide a valid Lockler address to view its control panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <Card className="max-w-md mx-auto animate-pulse">
          <CardContent className="p-6">
            <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-8 bg-gray-200 rounded mb-4 mx-auto w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !moduleAddress) {
    return (
      <div className="container mx-auto p-8 text-center">
        <Card className="max-w-md mx-auto border-red-200">
          <CardContent className="p-6">
            <Info className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-red-600">Error</h2>
            <p className="text-gray-600">{error || "No Reality Module found for this Lockler"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <Card className="border-0 shadow-lg rounded-xl overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="bg-white border-b border-gray-100 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Lock className="h-7 w-7 text-indigo-600" />
                Lockler Control
              </h1>
              <p className="text-gray-500 mt-1">Secure fund management with Kleros verification</p>
            </div>
            <div className="flex gap-4 items-center">
              {!address ? (
                <Button 
                  onClick={() => connect({ connector: injected() })}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </Button>
              ) : (
                <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <p className="text-sm font-medium text-gray-700">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                </div>
              )}
              <Button 
                onClick={() => setIsProposeModalOpen(true)} 
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Propose Fund Release
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Panel - Security Information */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-600" />
                  Lockler Security Checks
                </h2>
                
                <div className="space-y-4">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm text-gray-600">Safe Address:</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm bg-gray-50 p-1.5 rounded border border-gray-200 flex-grow">
                        {safeAddress}
                      </p>
                      <a 
                        href={`https://etherscan.io/address/${safeAddress}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm text-gray-600">Reality Module:</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm bg-gray-50 p-1.5 rounded border border-gray-200 flex-grow">
                        {moduleAddress}
                      </p>
                      <a 
                        href={`https://etherscan.io/address/${moduleAddress}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>

                {modules?.map(module => (
                  <div key={module.address} className="mt-5 border-t border-gray-100 pt-4">
                    <h3 className="font-semibold text-gray-700 mb-3">Security Verification</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex justify-between items-center p-2 rounded hover:bg-gray-50">
                        <span className="text-sm text-gray-600">Module Enabled:</span>
                        <span className={module.isEnabled ? "text-green-600" : "text-red-600"}>
                          {getSecurityIcon(module.isEnabled)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 rounded hover:bg-gray-50">
                        <span className="text-sm text-gray-600">Reality Module Verification:</span>
                        <span className={module.isRealityModule ? "text-green-600" : "text-red-600"}>
                          {getSecurityIcon(module.isRealityModule)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 rounded hover:bg-gray-50">
                        <span className="text-sm text-gray-600">Proxy Implementation:</span>
                        <span className={module.validationChecks.implementationMatches ? "text-green-600" : "text-red-600"}>
                          {getSecurityIcon(module.validationChecks.implementationMatches)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 rounded hover:bg-gray-50">
                        <span className="text-sm text-gray-600">Safe Owner Status:</span>
                        <span className={module.validationChecks.isOwner ? "text-green-600" : "text-red-600"}>
                          {getSecurityIcon(module.validationChecks.isOwner)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 rounded hover:bg-gray-50">
                        <span className="text-sm text-gray-600">Threshold Configuration:</span>
                        <span className={module.validationChecks.hasValidThreshold ? "text-green-600" : "text-red-600"}>
                          {getSecurityIcon(module.validationChecks.hasValidThreshold)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 rounded hover:bg-gray-50">
                        <span className="text-sm text-gray-600">Owner Count Validation:</span>
                        <span className={module.validationChecks.hasValidOwnerCount ? "text-green-600" : "text-red-600"}>
                          {getSecurityIcon(module.validationChecks.hasValidOwnerCount)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 rounded hover:bg-gray-50">
                        <span className="text-sm text-gray-600">Exclusive Module:</span>
                        <span className={module.validationChecks.isOnlyEnabledModule ? "text-green-600" : "text-red-600"}>
                          {getSecurityIcon(module.validationChecks.isOnlyEnabledModule)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel - Agreement & Proposals */}
            <div className="md:col-span-2 space-y-6">
              {/* Agreement Section */}
              {templateContent && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Fund Release Conditions</h2>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 max-h-60 overflow-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {templateContent}
                    </pre>
                  </div>
                </div>
              )}

              {/* Proposals Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Fund Release Requests</h2>
                
                {questionsLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading requests...</p>
                    <p className="text-sm text-gray-500 mt-2">Processed: {progress.processed} of {progress.total}</p>
                  </div>
                ) : questionsError ? (
                  <div className="p-4 text-center text-red-600">
                    <Info className="h-8 w-8 mx-auto mb-2" />
                    <p>Error: {questionsError}</p>
                  </div>
                ) : questions.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-gray-200 rounded-lg">
                    <p className="text-gray-500">No fund release requests found</p>
                    <p className="text-sm text-gray-400 mt-2">Create a new request by clicking "Propose Fund Release"</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {questions.map((question) => {
                      const ipfsLink = getIpfsLink(question.id);

                      return (
                        <Card key={question.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <CardContent className="p-0">
                            <div className="bg-gray-50 p-4 border-b border-gray-100">
                              <div className="flex justify-between">
                                <div>
                                  <h3 className="font-semibold text-gray-800 mb-1">{question.title}</h3>
                                  <div className="flex items-center gap-3">
                                    <div className="text-xs font-mono text-gray-500">ID: {question.id.slice(0, 8)}...{question.id.slice(-6)}</div>
                                    {getStatusBadge(question.phase)}
                                  </div>
                                </div>
                                {ipfsLink && (
                                  <a 
                                    href={ipfsLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    IPFS Details
                                  </a>
                                )}
                              </div>
                              <div className="mt-2 flex items-center gap-3">
                                <span className="text-sm text-gray-600">Answer: </span>
                                <span className={`font-medium ${question.currentAnswer === "0x0000000000000000000000000000000000000000000000000000000000000001" ? "text-green-600" : "text-red-600"}`}>
                                  {question.currentAnswer === "0x0000000000000000000000000000000000000000000000000000000000000001" ? "Approved" : "Rejected"}
                                </span>
                              </div>
                            </div>

                            {loadingStatuses[question.id] ? (
                              <div className="p-4">
                                <div className="animate-pulse h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="animate-pulse h-6 bg-gray-200 rounded w-1/2"></div>
                              </div>
                            ) : transactionDetails[question.id]?.map((tx, index) => (
                              <div key={index} className="p-4 border-b border-gray-100 last:border-b-0">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium text-gray-800 mb-1">Transaction {index + 1}</p>
                                    {tx.error ? (
                                      <p className="text-red-600 text-sm">{tx.error}</p>
                                    ) : (
                                      <>
                                        <p className="text-sm text-gray-600 mb-1">To: <span className="font-mono">{tx.to.slice(0, 10)}...{tx.to.slice(-8)}</span></p>
                                        <div className="flex gap-4">
                                          <p className="text-sm text-gray-600">Value: {tx.value}</p>
                                          <p className="text-sm text-gray-600">Data: {tx.data.slice(0, 10)}...</p>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  {!tx.error && (
                                    <div>
                                      {transactionStatuses[question.id]?.[index]?.isExecuted ? (
                                        <div className="text-green-600 flex items-center">
                                          <CircleCheck className="h-4 w-4 mr-1" />
                                          <span className="text-sm font-medium">Executed</span>
                                        </div>
                                      ) : (
                                        <Button
                                          disabled={!transactionStatuses[question.id]?.[index]?.canExecute}
                                          onClick={() => handleExecuteTransactionWrapper(question, tx, index)}
                                          size="sm"
                                          className={transactionStatuses[question.id]?.[index]?.canExecute 
                                            ? "bg-indigo-600 hover:bg-indigo-700" 
                                            : "bg-gray-300 hover:bg-gray-300 cursor-not-allowed"}
                                        >
                                          Execute Transaction
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}

                            <div className="p-4 bg-gray-50 border-t border-gray-100">
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
