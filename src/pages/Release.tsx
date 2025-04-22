import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { getBlockExplorer, getChainConfig, CHAIN_CONFIG, getRpcUrl } from '../lib/constants';
import { ProposeTransactionModal } from '../components/ProposeTransactionModal';
import { useQuestions } from '../hooks/useQuestions';
import { useRealityModule } from '../hooks/useRealityModule';
import { Question } from 'reality-kleros-subgraph';
import { handleExecuteTransaction } from '../lib/transactions';
import { useTransactionStatus } from '../hooks/useTransactionStatus';
import ReactMarkdown from 'react-markdown';
import { ethers } from 'ethers';
import { VouchProposal } from '../components/VouchProposal';
import { useAccount, useConnect, usePublicClient } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { CircleCheck, ExternalLink, Info, Lock, Shield, Wallet } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { StepWrapper } from '../components/StepWrapper';
import { ProposalTransaction, TransactionStatus } from '../lib/types';

export default function Release() {
  const { chainId: chainIdParam, address: safeAddress } = useParams<{ chainId: string; address: string }>();
  const navigate = useNavigate();
  const chainId = chainIdParam ? parseInt(chainIdParam) : null;
  const blockExplorer = chainId ? getBlockExplorer(chainId) : null;
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const [safeExists, setSafeExists] = useState<boolean>(true);

  const { address: moduleAddress, isLoading, error, modules, templateContent } = useRealityModule(
    safeAddress || '',
    chainId
  );
  const { questions, isLoading: questionsLoading, error: questionsError, progress, refetch: refetchQuestions } =
    useQuestions(
      moduleAddress || '', 
      chainId as number // No fallback, will be null or undefined if no chainId
    );
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
  const { transactionDetails, transactionStatuses, loadingStatuses, setTransactionStatuses } = useTransactionStatus(questions, moduleAddress, chainId);

  const { connect } = useConnect();

  useEffect(() => {
    const validateSafe = async () => {
      if (!chainId || !safeAddress) return;
      
      try {
        const rpcUrl = getRpcUrl(chainId);
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        const code = await provider.getCode(safeAddress);
        setSafeExists(!!code && code !== '0x');
      } catch (err) {
        console.error('Error validating Safe:', err);
        setSafeExists(false);
      }
    };
    
    validateSafe();
  }, [chainId, safeAddress]);

  const handleExecuteTransactionWrapper = async (
    question: Question,
    transaction: ProposalTransaction,
    txIndex: number
  ) => {
    if (!moduleAddress || !chainId) return;

    if (window.ethereum) {
      try {
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        const walletChainId = parseInt(chainIdHex, 16);
        
        if (walletChainId !== chainId) {
          alert(`Please switch your wallet to ${CHAIN_CONFIG[chainId].name} to execute this transaction.`);
          return;
        }
      } catch (err) {
        console.error("Error checking chain ID:", err);
      }
    }

    const newStatuses = await handleExecuteTransaction(
      moduleAddress,
      question,
      transaction,
      txIndex,
      transactionDetails,
      Number(chainId)
    );

    setTransactionStatuses(prev => ({ ...prev, ...newStatuses }));
  };

  const getStatusBadge = (phase: string) => {
    switch (phase) {
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

  const getStatusIcon = (status: TransactionStatus) => {
    if (status?.isExecuted) {
      return (
        <div className="text-green-600 flex items-center">
          <CircleCheck className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">Executed</span>
        </div>
      );
    } else if (status?.canExecute) {
      return (
        <div className="text-blue-600 flex items-center">
          <Info className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">Ready to Execute</span>
        </div>
      );
    }
    return (
      <div className="text-gray-400 flex items-center">
        <Info className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">Not Ready</span>
      </div>
    );
  };

  if (!chainId || !CHAIN_CONFIG[chainId]) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1831] to-[#231a2c] p-4">
        <StepWrapper>
          <Info className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-white">Invalid Chain</h2>
          <p className="text-purple-200 mb-4">Please select a valid chain from the list below:</p>
          <div className="space-y-2">
            {Object.entries(CHAIN_CONFIG).map(([id, config]) => (
              <Button
                key={id}
                variant="outline"
                className="w-full bg-purple-900/20 border-purple-700 text-white hover:bg-purple-800/30"
                onClick={() => navigate(`/release/${id}/${safeAddress}`)}
              >
                {config.name}
              </Button>
            ))}
          </div>
        </StepWrapper>
      </div>
    );
  }

  if (!safeExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1831] to-[#231a2c] p-4">
        <StepWrapper>
          <Info className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-white">Safe Not Found</h2>
          <p className="text-purple-200">
            This Safe does not exist on {chainId && CHAIN_CONFIG[chainId] ? CHAIN_CONFIG[chainId].name : "the selected network"}
          </p>
        </StepWrapper>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1831] to-[#231a2c] p-4">
        <StepWrapper>
          <div className="animate-pulse space-y-4">
            <div className="h-16 w-16 bg-purple-500/20 rounded-full mx-auto"></div>
            <div className="h-8 bg-purple-500/20 rounded mx-auto w-3/4"></div>
            <div className="h-4 bg-purple-500/20 rounded w-full"></div>
            <div className="h-4 bg-purple-500/20 rounded w-5/6"></div>
            <div className="h-4 bg-purple-500/20 rounded w-4/6"></div>
          </div>
        </StepWrapper>
      </div>
    );
  }

  if (error || !moduleAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1831] to-[#231a2c] p-4">
        <StepWrapper>
          <Info className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-white">Error</h2>
          <p className="text-purple-200">{error || "No Reality Module found for this Lockler"}</p>
        </StepWrapper>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1831] to-[#231a2c] py-6 px-4">
      <div className="container mx-auto max-w-7xl">
        <Card className="border-purple-800/20 bg-white/5 backdrop-blur">
          <CardHeader className="border-b border-purple-800/20 p-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  <Lock className="h-7 w-7 text-purple-400" />
                  Lockler Control
                </h1>
                <p className="text-purple-200 mt-1">Secure fund management with Kleros verification</p>
              </div>
              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-purple-200">Network:</span>
                  <Select
                    value={chainId.toString()}
                    onValueChange={(value) => navigate(`/release/${value}/${safeAddress}`)}
                  >
                    <SelectTrigger className="w-[180px] bg-purple-900/20 border-purple-700 text-white">
                      <SelectValue placeholder="Select network" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CHAIN_CONFIG).map(([id, config]) => (
                        <SelectItem key={id} value={id.toString()}>
                          {config.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!address ? (
                  <Button
                    onClick={() => connect({ connector: injected() })}
                    variant="outline"
                    className="flex items-center gap-2 bg-purple-900/20 border-purple-700 text-white hover:bg-purple-800/30"
                  >
                    <Wallet className="h-4 w-4" />
                    Connect Wallet
                  </Button>
                ) : (
                  <div className="flex items-center gap-3 bg-purple-900/20 px-4 py-2 rounded-lg border border-purple-700">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    <p className="text-sm font-medium text-purple-200">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </p>
                  </div>
                )}
                <Button
                  onClick={() => setIsProposeModalOpen(true)}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600"
                >
                  Propose Fund Release
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                        {blockExplorer && (
                          <a
                            href={`${blockExplorer}/address/${safeAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm text-gray-600">Reality Module:</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm bg-gray-50 p-1.5 rounded border border-gray-200 flex-grow">
                          {moduleAddress}
                        </p>
                        {blockExplorer && (
                          <a
                            href={`${blockExplorer}/address/${moduleAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
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

              <div className="md:col-span-2 space-y-6">
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
                        return (
                          <Card key={question.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <CardContent className="p-0">
                              <div className="bg-gray-50 p-4 border-b border-gray-100">
                                <div className="flex justify-between">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                      <div className="text-xs font-mono text-gray-500">ID: {question.id.slice(0, 8)}...{question.id.slice(-6)}</div>
                                      {getStatusBadge(question.phase)}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center gap-3">
                                  <span className="text-sm text-gray-600">Answer: </span>
                                  <span className={`font-medium ${
                                    !question.currentAnswer ? "text-gray-500" :
                                    question.currentAnswer === "0x0000000000000000000000000000000000000000000000000000000000000001" ? "text-green-600" : "text-red-600"
                                  }`}>
                                    {!question.currentAnswer ? "Pending" :
                                     question.currentAnswer === "0x0000000000000000000000000000000000000000000000000000000000000001" ? "Approved" : "Rejected"}
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
                                          {tx.justification && (
                                            <div className="mb-3">
                                              <h4 className="font-medium text-gray-800">{tx.justification.title}</h4>
                                              {tx.justification.description && (
                                                <div className="prose prose-sm max-w-none mt-1">
                                                  <ReactMarkdown components={{
                                                    p: ({node, ...props}) => <p className="text-sm text-gray-600" {...props} />,
                                                    h1: ({node, ...props}) => <h1 className="text-lg font-semibold text-gray-800" {...props} />,
                                                    h2: ({node, ...props}) => <h2 className="text-base font-semibold text-gray-800" {...props} />,
                                                    h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-gray-800" {...props} />,
                                                    ul: ({node, ...props}) => <ul className="list-disc list-inside text-sm text-gray-600" {...props} />,
                                                    ol: ({node, ...props}) => <ol className="list-decimal list-inside text-sm text-gray-600" {...props} />,
                                                    li: ({node, ...props}) => <li className="text-sm text-gray-600" {...props} />,
                                                    a: ({node, ...props}) => <a className="text-indigo-600 hover:text-indigo-800" {...props} />,
                                                    code: ({node, ...props}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props} />,
                                                    pre: ({node, ...props}) => <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto" {...props} />
                                                  }}>
                                                    {tx.justification.description}
                                                  </ReactMarkdown>
                                                </div>
                                              )}
                                            </div>
                                          )}
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
                                  chainId={Number(chainId)}
                                  disabled={question.phase !== "OPEN"}
                                  onVouchComplete={async () => {
                                    await refetchQuestions();
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
          onPropose={async (transactions) => {
            await refetchQuestions();
            setIsProposeModalOpen(false);
          }}
          chainId={chainId}
          realityModuleAddress={moduleAddress}
        />
      </div>
    </div>
  );
}
