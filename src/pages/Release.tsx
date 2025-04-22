
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
import { Lock, Wallet } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ProposalTransaction } from '../lib/types';
import { ErrorState } from '../components/release/ErrorState';
import { LoadingState } from '../components/release/LoadingState';
import { SecurityChecks } from '../components/release/SecurityChecks';
import { TransactionList } from '../components/release/TransactionList';
import { Question } from 'reality-kleros-subgraph';
import { JsonRpcProvider } from 'ethers';

export default function Release() {
  const { chainId: chainIdParam, address: safeAddress } = useParams<{ chainId: string; address: string }>();
  const navigate = useNavigate();
  const chainId = chainIdParam ? parseInt(chainIdParam) : null;
  const blockExplorer = chainId ? getBlockExplorer(chainId) : null;
  const [safeExists, setSafeExists] = useState<boolean>(true);
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);

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
        message="Please select a valid chain from the list below:"
        chainId={chainId}
        safeAddress={safeAddress}
        showChainSelector
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
                <SecurityChecks
                  safeAddress={safeAddress || ''}
                  moduleAddress={moduleAddress}
                  blockExplorer={blockExplorer}
                  modules={modules}
                />
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
                    <ErrorState title="Error" message={questionsError} />
                  ) : questions.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-gray-200 rounded-lg">
                      <p className="text-gray-500">No fund release requests found</p>
                      <p className="text-sm text-gray-400 mt-2">Create a new request by clicking "Propose Fund Release"</p>
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
