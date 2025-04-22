import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { getBlockExplorer, CHAIN_CONFIG, getRpcUrl } from '../lib/constants';
import { ProposeTransactionModal } from '../components/ProposeTransactionModal';
import { useQuestions } from '../hooks/useQuestions';
import { useRealityModule } from '../hooks/useRealityModule';
import { handleExecuteTransaction } from '../lib/transactions';
import { useTransactionStatus } from '../hooks/useTransactionStatus';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Wallet, Shield } from 'lucide-react';
import { ProposalTransaction } from '../lib/types';
import { ErrorState } from '../components/release/ErrorState';
import { LoadingState } from '../components/release/LoadingState';
import { SecurityChecks } from '../components/release/SecurityChecks';
import { TransactionList } from '../components/release/TransactionList';
import type { Question } from 'reality-kleros-subgraph';
import { JsonRpcProvider } from 'ethers';
import { ExternalLink } from '../components/ui/external-link';

export default function Release() {
  const { chainId: chainIdParam, address: safeAddress } = useParams<{ chainId: string; address: string }>();
  const chainId = chainIdParam ? parseInt(chainIdParam) : null;
  const blockExplorer = chainId ? getBlockExplorer(chainId) : null;
  const [safeExists, setSafeExists] = useState<boolean>(true);
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
  const [formattedTerms, setFormattedTerms] = useState<{
    title?: string;
    description?: string;
    type?: string;
    payments?: any[];
    ipfsUrl?: string;
  } | null>(null);

  const { address } = useAccount();
  const { connect } = useConnect();

  const { 
    address: moduleAddress, 
    isLoading, 
    error, 
    modules, 
    templateContent 
  } = useRealityModule(safeAddress || '', chainId);

  const { 
    questions, 
    isLoading: questionsLoading, 
    error: questionsError, 
    progress, 
    refetch: refetchQuestions 
  } = useQuestions(moduleAddress || '', chainId as number);

  const { 
    transactionDetails, 
    transactionStatuses, 
    loadingStatuses, 
    setTransactionStatuses 
  } = useTransactionStatus(questions, moduleAddress, chainId);

  useEffect(() => {
    const validateSafe = async () => {
      if (!chainId || !safeAddress) return;
      try {
        const provider = new JsonRpcProvider(getRpcUrl(chainId));
        const code = await provider.getCode(safeAddress);
        setSafeExists(!!code && code !== '0x');
      } catch (err) {
        console.error('Error validating Safe:', err);
        setSafeExists(false);
      }
    };
    validateSafe();
  }, [chainId, safeAddress]);

  useEffect(() => {
    const parseTemplateContent = () => {
      if (!templateContent) return;
      try {
        const terms = JSON.parse(templateContent);
        const ipfsMatch = terms?.uri?.match(/\/ipfs\/([^?]+)/);
        const ipfsUrl = ipfsMatch ? `https://cdn.kleros.link${ipfsMatch[0]}` : null;
        
        setFormattedTerms({
          title: terms.title,
          description: terms.description,
          type: terms.type,
          payments: terms.payments,
          ipfsUrl
        });
      } catch (err) {
        console.error('Error parsing template content:', err);
      }
    };
    
    parseTemplateContent();
  }, [templateContent]);

  const handleExecuteTransactionWrapper = async (
    question: Question,
    transaction: ProposalTransaction,
    txIndex: number
  ) => {
    if (!moduleAddress || !chainId) return;

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

  if (!chainId || !CHAIN_CONFIG[chainId]) {
    return (
      <ErrorState
        title="Invalid Chain"
        message="The specified chain is not supported"
      />
    );
  }

  if (!safeExists) {
    return (
      <ErrorState
        title="Safe Not Found"
        message={`This Safe does not exist on ${chainId && CHAIN_CONFIG[chainId] ? CHAIN_CONFIG[chainId].name : "the selected network"}`}
      />
    );
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !moduleAddress) {
    return (
      <ErrorState
        title="Error"
        message={error || "No Reality Module found for this Lockler"}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#23213A] to-[#2D274B] py-6 px-4">
      <div className="container mx-auto max-w-7xl">
        <Card className="bg-[#2D274B] border-gray-800 rounded-3xl shadow-2xl">
          <CardHeader className="border-b border-gray-800 p-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  <Shield className="h-7 w-7 text-pink-400" />
                  Lockler Control
                </h1>
                <p className="text-gray-300 mt-1">Secure fund management with Kleros verification</p>
              </div>
              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-200">
                    {CHAIN_CONFIG[chainId]?.name || 'Unknown Network'}
                  </span>
                </div>
                {!address ? (
                  <Button
                    onClick={() => connect({ connector: injected() })}
                    variant="outline"
                    className="flex items-center gap-2 bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                  >
                    <Wallet className="h-4 w-4" />
                    Connect Wallet
                  </Button>
                ) : (
                  <div className="flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    <p className="text-sm font-medium text-gray-200">
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
                <SecurityChecks
                  safeAddress={safeAddress || ''}
                  moduleAddress={moduleAddress}
                  blockExplorer={blockExplorer}
                  modules={modules}
                />
              </div>

              <div className="md:col-span-2 space-y-6">
                {formattedTerms && (
                  <div className="bg-gray-900 rounded-3xl border border-gray-800 p-5 shadow-2xl">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-semibold text-white">Fund Release Conditions</h2>
                      {formattedTerms.ipfsUrl && (
                        <ExternalLink 
                          href={formattedTerms.ipfsUrl}
                          className="bg-purple-900/30 hover:bg-purple-900/50 px-3 py-1 rounded-md border border-purple-500/30"
                        >
                          View Full Terms
                        </ExternalLink>
                      )}
                    </div>
                    <div className="bg-gray-800 rounded-lg border border-gray-700 divide-y divide-gray-700">
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-1">Title</h3>
                        <p className="text-gray-200">{formattedTerms.title}</p>
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-1">Description</h3>
                        <p className="text-gray-200">{formattedTerms.description}</p>
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-1">Type</h3>
                        <p className="text-gray-200 capitalize">{formattedTerms.type}</p>
                      </div>
                      {formattedTerms.payments && formattedTerms.payments.length > 0 && (
                        <div className="p-4">
                          <h3 className="text-sm font-medium text-gray-400 mb-2">Participants</h3>
                          <div className="space-y-3">
                            {formattedTerms.payments.map((payment, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg">
                                <div>
                                  <span className="text-xs text-gray-400 capitalize">{payment.role}</span>
                                  <p className="text-sm text-gray-200 font-mono">
                                    {payment.address.slice(0, 6)}...{payment.address.slice(-4)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm text-gray-200">{payment.amount}</span>
                                  <p className="text-xs text-gray-400">{payment.currency}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-gray-900 rounded-3xl border border-gray-800 p-5 shadow-2xl">
                  <h2 className="text-xl font-semibold text-white mb-4">Fund Release Requests</h2>

                  {questionsLoading ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                      <p className="text-gray-300">Loading requests...</p>
                      <p className="text-sm text-gray-400 mt-2">Processed: {progress.processed} of {progress.total}</p>
                    </div>
                  ) : questionsError ? (
                    <ErrorState title="Error" message={questionsError} />
                  ) : questions.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-gray-700 rounded-lg">
                      <p className="text-gray-400">No fund release requests found</p>
                      <p className="text-sm text-gray-500 mt-2">Create a new request by clicking "Propose Fund Release"</p>
                    </div>
                  ) : (
                    <TransactionList
                      questions={questions}
                      transactionDetails={transactionDetails}
                      transactionStatuses={transactionStatuses}
                      loadingStatuses={loadingStatuses}
                      moduleAddress={moduleAddress}
                      chainId={chainId}
                      onExecuteTransaction={handleExecuteTransactionWrapper}
                      onVouchComplete={refetchQuestions}
                    />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <ProposeTransactionModal
          isOpen={isProposeModalOpen}
          onClose={() => setIsProposeModalOpen(false)}
          onPropose={async () => {
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
