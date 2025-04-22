
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { getBlockExplorer, CHAIN_CONFIG, getRpcUrl, SUPPORTED_CHAINS, TOKENS } from '../lib/constants';
import { ProposeTransactionModal } from '../components/ProposeTransactionModal';
import { useQuestions } from '../hooks/useQuestions';
import { useRealityModule } from '../hooks/useRealityModule';
import { handleExecuteTransaction } from '../lib/transactions';
import { useTransactionStatus } from '../hooks/useTransactionStatus';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Wallet } from 'lucide-react';
import { ErrorState } from '../components/release/ErrorState';
import { LoadingState } from '../components/release/LoadingState';
import { SecurityChecks } from '../components/release/SecurityChecks';
import { TransactionList } from '../components/release/TransactionList';
import { JsonRpcProvider } from 'ethers';
import { FundReleaseConditions } from '../components/release/FundReleaseConditions';
import { Logo } from "../components/ui/logo";
import { Question } from 'reality-kleros-subgraph';
import { ProposalTransaction } from '../lib/types';

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

  const getCurrencyInfo = (address: string, chainId: number | null) => {
    if (address === TOKENS.NATIVE.address) {
      return {
        symbol: chainId === SUPPORTED_CHAINS.GNOSIS ? 'xDAI' : TOKENS.NATIVE.symbol,
        decimals: TOKENS.NATIVE.decimals
      };
    }

    if (chainId && TOKENS.USDC[chainId as keyof typeof TOKENS.USDC]) {
      return TOKENS.USDC[chainId as keyof typeof TOKENS.USDC];
    }

    if (chainId === SUPPORTED_CHAINS.MAINNET && TOKENS.PNK[SUPPORTED_CHAINS.MAINNET as keyof typeof TOKENS.PNK]) {
      return TOKENS.PNK[SUPPORTED_CHAINS.MAINNET as keyof typeof TOKENS.PNK];
    }

    return {
      symbol: 'UNKNOWN',
      decimals: 18
    };
  };

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
    <div className="min-h-screen bg-gradient-to-br from-[#23213A] to-[#2D274B] py-6 px-4">
      <div className="container mx-auto max-w-7xl">
        <Card className="bg-[#2D274B] border-gray-800 rounded-3xl shadow-2xl">
          <CardHeader className="border-b border-gray-800 p-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex-grow">
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  <Logo className="h-7 w-7 text-pink-400" />
                  Lockler Control
                </h1>
                <p className="text-gray-300 mt-1">Secure fund management, secured by the Kleros Optimistic Oracle</p>
              </div>
              <div className="flex gap-4 items-center">
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
                  onClick={() => navigate('/setup')}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
                >
                  Setup New Lockler
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
                  chainId={chainId}
                />
              </div>
              <div className="md:col-span-2 space-y-6">
                {formattedTerms && (
                  <FundReleaseConditions
                    formattedTerms={formattedTerms}
                    chainId={chainId}
                  />
                )}

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
    </div>
  );
}
