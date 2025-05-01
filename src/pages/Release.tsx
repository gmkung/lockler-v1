import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JsonRpcProvider } from 'ethers';
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { AppTopBar } from '@/components/AppTopBar';
import { TransactionList } from "../components/release/TransactionList";
import { getBlockExplorer, CHAIN_CONFIG, getRpcUrl, SUPPORTED_CHAINS, TOKENS } from '../lib/constants';
import { ProposeTransactionModal } from '../components/ProposeTransactionModal';
import { useQuestions } from '../hooks/useQuestions';
import { useRealityModule } from '../hooks/useRealityModule';
import { handleExecuteTransaction } from '../lib/transactions';
import { useTransactionStatus } from '../hooks/useTransactionStatus';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { ErrorState } from '../components/release/ErrorState';
import { LoadingState } from '../components/release/LoadingState';
import { FundReleaseConditions } from '../components/release/FundReleaseConditions';
import { TokenBalances } from '../components/release/TokenBalances';
import { Question } from 'reality-kleros-subgraph';
import { ProposalTransaction } from '../lib/types';
import { Footer } from '../components/ui/footer';

export default function Release() {
  const { chainId: chainIdParam, address: safeAddress } = useParams<{ chainId: string; address: string }>();
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-gradient-to-br from-[#23213A] to-[#2D274B] py-6 px-4 flex flex-col">
      <div className="container mx-auto max-w-7xl flex-grow">
        <AppTopBar
          chainId={chainId}
          safeAddress={safeAddress}
          moduleAddress={moduleAddress}
          modules={modules}
          pageTitle="Lockler Control"
        />
        
        <Card className="bg-[#2D274B] border-gray-800 rounded-3xl shadow-2xl">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                {/* Add TokenBalances component here */}
                {safeAddress && chainId && (
                  <TokenBalances chainId={chainId} safeAddress={safeAddress} />
                )}
                
                {formattedTerms && (
                  <FundReleaseConditions
                    formattedTerms={formattedTerms}
                    chainId={chainId}
                  />
                )}
              </div>
              
              <div>
                <div className="bg-gray-900 rounded-3xl border border-gray-800 p-5 shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Fund Release Requests</h2>
                    <Button
                      onClick={() => setIsProposeModalOpen(true)}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600"
                    >
                      Propose Fund Release
                    </Button>
                  </div>

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
      <Footer />
    </div>
  );
}
