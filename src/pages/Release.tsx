import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JsonRpcProvider, formatUnits } from 'ethers';
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
import { useAccount, useConnect, useReadContract } from 'wagmi';
import { ErrorState } from '../components/release/ErrorState';
import { LoadingState } from '../components/release/LoadingState';
import { FundReleaseConditions } from '../components/release/FundReleaseConditions';
import { Question } from 'reality-kleros-subgraph';
import { ProposalTransaction } from '../lib/types';
import { Footer } from '../components/ui/footer';
import { REALITY_MODULE_ABI } from '@/abis/realityModule';
import { TooltipProvider } from "@/components/ui/tooltip";
import { ModuleAddressCard } from '../components/release/ModuleAddressCard';
import { Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function formatSeconds(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return 'N/A';
  if (seconds === 0) return 'Never';

  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor(seconds % (3600 * 24) / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = Math.floor(seconds % 60);

  const dDisplay = d > 0 ? d + (d === 1 ? " day, " : " days, ") : "";
  const hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
  const mDisplay = m > 0 ? m + (m === 1 ? " minute, " : " minutes, ") : "";
  const sDisplay = s > 0 ? s + (s === 1 ? " second" : " seconds") : "";

  let result = (dDisplay + hDisplay + mDisplay + sDisplay).trim();
  if (result.endsWith(',')) {
    result = result.slice(0, -1);
  }
  return result || '0 seconds';
}

// Helper to format bond (uint256 in wei) using native currency info
function formatBond(bondValue: bigint | number | null | undefined, chainId: number | null): string {
  if (bondValue === null || bondValue === undefined || chainId === null) return 'N/A';
  try {
    const nativeCurrency = CHAIN_CONFIG[chainId]?.nativeCurrency;
    if (!nativeCurrency) return `${bondValue.toString()} wei`; // Fallback

    // Ensure bondValue is bigint for formatUnits
    const bondBigInt = typeof bondValue === 'number' ? BigInt(bondValue) : bondValue;

    const formatted = formatUnits(bondBigInt, nativeCurrency.decimals);
    // Optional: Improve formatting for very small/large numbers if needed
    return `${formatted} ${nativeCurrency.symbol}`;
  } catch (e) {
    console.error("Error formatting bond:", e);
    return `${bondValue.toString()} wei`; // Fallback on error
  }
}

export default function Release() {
  const { chainId: chainIdParam, address: safeAddress } = useParams<{ chainId: string; address: string }>();
  const navigate = useNavigate();
  const chainId = chainIdParam ? parseInt(chainIdParam) : null;
  const blockExplorer = chainId ? getBlockExplorer(chainId) : null;
  const [safeExists, setSafeExists] = useState<boolean>(true);
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [formattedTerms, setFormattedTerms] = useState<{
    title?: string;
    description?: string;
    type?: string;
    payments?: any[];
    ipfsUrl?: string;
  } | null>(null);
  const [moduleCooldown, setModuleCooldown] = useState<number | null>(null);
  const [moduleExpiration, setModuleExpiration] = useState<number | null>(null);
  const [moduleTimeout, setModuleTimeout] = useState<number | null>(null);
  const [moduleBond, setModuleBond] = useState<bigint | null>(null);
  const [moduleArbitrator, setModuleArbitrator] = useState<string | null>(null);
  const [constantsLoading, setConstantsLoading] = useState<boolean>(true);
  const [constantsError, setConstantsError] = useState<string | null>(null);

  const {
    address: moduleAddress,
    isLoading: moduleIsLoading,
    error: moduleError,
    modules,
    templateContent
  } = useRealityModule(safeAddress || '', chainId);

  const { data: cooldownData, isLoading: cooldownLoading, error: cooldownError } = useReadContract({
    address: moduleAddress as `0x${string}` | undefined,
    abi: REALITY_MODULE_ABI,
    functionName: 'questionCooldown',
    chainId: chainId ?? undefined,
    query: {
      enabled: !!moduleAddress && !!chainId,
    },
  });

  const { data: expirationData, isLoading: expirationLoading, error: expirationError } = useReadContract({
    address: moduleAddress as `0x${string}` | undefined,
    abi: REALITY_MODULE_ABI,
    functionName: 'answerExpiration',
    chainId: chainId ?? undefined,
    query: {
      enabled: !!moduleAddress && !!chainId,
    },
  });

  // Fetch Timeout
  const { data: timeoutData, isLoading: timeoutLoading, error: timeoutError } = useReadContract({
    address: moduleAddress as `0x${string}` | undefined,
    abi: REALITY_MODULE_ABI,
    functionName: 'questionTimeout',
    chainId: chainId ?? undefined,
    query: {
      enabled: !!moduleAddress && !!chainId,
    },
  });

  // Fetch Bond
  const { data: bondData, isLoading: bondLoading, error: bondError } = useReadContract({
    address: moduleAddress as `0x${string}` | undefined,
    abi: REALITY_MODULE_ABI,
    functionName: 'minimumBond',
    chainId: chainId ?? undefined,
    query: {
      enabled: !!moduleAddress && !!chainId,
    },
  });

  // Fetch Arbitrator - Renamed from questionArbitrator in contract to arbitrator in hook result
  const { data: arbitratorData, isLoading: arbitratorLoading, error: arbitratorError } = useReadContract({
    address: moduleAddress as `0x${string}` | undefined, // The Reality Module contract address
    abi: REALITY_MODULE_ABI,                             // The ABI containing the function definitions
    functionName: 'questionArbitrator',                 // The specific function to call
    chainId: chainId ?? undefined,                       // The chain to interact with
    query: {
      enabled: !!moduleAddress && !!chainId,           // Only run if moduleAddress and chainId are available
    },
  });

  useEffect(() => {
    console.log('[Constants Effect] Running check...');
    console.log('[Constants Effect] Raw Arbitrator State:', {
      arbitratorData,
      arbitratorLoading,
      arbitratorError,
    });

    const isLoading = cooldownLoading || expirationLoading || timeoutLoading || bondLoading || arbitratorLoading;
    setConstantsLoading(isLoading);

    const combinedError = cooldownError || expirationError || timeoutError || bondError || arbitratorError;

    if (combinedError) {
      console.error('[Constants Effect] Error detected:', combinedError);
      if (arbitratorError) {
          console.error('[Constants Effect] Arbitrator specific error:', arbitratorError);
      }
      setConstantsError(combinedError.message || 'Failed to load module constants');
      setModuleCooldown(null);
      setModuleExpiration(null);
      setModuleTimeout(null);
      setModuleBond(null);
      setModuleArbitrator(null); 
    } else if (!isLoading && cooldownData !== undefined && expirationData !== undefined && timeoutData !== undefined && bondData !== undefined && arbitratorData !== undefined) {
      console.log('[Constants Effect] All data loaded successfully. Setting states.');
      setModuleCooldown(typeof cooldownData === 'number' ? cooldownData : null);
      setModuleExpiration(typeof expirationData === 'number' ? expirationData : null);
      setModuleTimeout(typeof timeoutData === 'number' ? timeoutData : null);
      setModuleBond(typeof bondData === 'bigint' ? bondData : null);
      
      const finalArbitratorValue = typeof arbitratorData === 'string' ? arbitratorData : null;
      console.log(`[Constants Effect] Setting arbitrator to: ${finalArbitratorValue}`);
      setModuleArbitrator(finalArbitratorValue);
      
      setConstantsError(null);
    } else {
      if (!isLoading) {
         console.warn('[Constants Effect] Loading finished, but some data is still undefined.', {
             cooldownData, expirationData, timeoutData, bondData, arbitratorData
         });
      }
    }
  }, [
      cooldownData, expirationData, timeoutData, bondData, arbitratorData,
      cooldownLoading, expirationLoading, timeoutLoading, bondLoading, arbitratorLoading,
      cooldownError, expirationError, timeoutError, bondError, arbitratorError,
      moduleAddress, chainId
  ]);

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

  if (moduleIsLoading) {
    return <LoadingState />;
  }

  if (moduleError || !moduleAddress) {
    return (
      <ErrorState
        title="Error"
        message={moduleError || "No Reality Module found for this Lockler"}
      />
    );
  }

  const termsModalMarkdownComponents = {
      h1: ({node, ...props}) => <h1 className="text-indigo-200 font-medium text-lg mt-4 mb-2" {...props} />,
      h2: ({node, ...props}) => <h2 className="text-indigo-200 font-medium text-base mt-4 mb-2" {...props} />,
      h3: ({node, ...props}) => <h3 className="text-indigo-200 font-medium text-sm mt-3 mb-1" {...props} />,
      p: ({node, ...props}) => <p className="text-gray-100 text-sm mb-3" {...props} />,
      ul: ({node, ...props}) => <ul className="text-gray-100 text-sm pl-5 mb-3 list-disc" {...props} />,
      ol: ({node, ...props}) => <ol className="text-gray-100 text-sm pl-5 mb-3 list-decimal" {...props} />,
      li: ({node, ...props}) => <li className="text-gray-100 text-sm my-1" {...props} />,
      a: ({node, ...props}) => <a className="text-indigo-300 hover:underline text-sm" {...props} />,
      strong: ({node, ...props}) => <strong className="text-gray-50 text-sm font-semibold" {...props} />,
      em: ({node, ...props}) => <em className="text-gray-200 text-sm italic" {...props} />,
      code: ({node, ...props}) => <code className="text-gray-200 text-sm bg-gray-800/70 px-1.5 py-0.5 rounded" {...props} />,
      blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-gray-500 pl-3 text-sm italic text-gray-300 my-3" {...props} />,
      hr: ({node, ...props}) => <hr className="border-gray-700 my-4" {...props} />
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-gradient-to-br from-[#23213A] to-[#2D274B] flex flex-col justify-between">
        <AppTopBar
          chainId={chainId}
          pageTitle="Lockler Control"
        />
        <div className="container mx-auto max-w-7xl flex-grow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              {safeAddress && chainId && moduleAddress && (
                <ModuleAddressCard 
                  className="h-full"
                  chainId={chainId}
                  safeAddress={safeAddress}
                  moduleAddress={moduleAddress}
                  modules={modules}
                  moduleCooldown={moduleCooldown}
                  moduleExpiration={moduleExpiration}
                  moduleTimeout={moduleTimeout}
                  moduleBond={moduleBond}
                  moduleArbitrator={moduleArbitrator}
                  formatSeconds={formatSeconds}
                  formatBond={formatBond}
                />
              )}
            </div>

            <div>
              {formattedTerms && (
                <Card className="bg-gray-900 rounded-3xl border border-gray-800 p-5 shadow-2xl h-full flex flex-col">
                  <div className="flex items-center mb-4 flex-shrink-0">
                    <Info className="h-5 w-5 text-purple-400 mr-2" />
                    <h2 className="text-xl font-semibold text-white">Escrow Terms</h2>
                  </div>
                  <div className="flex-grow overflow-hidden space-y-3 flex flex-col">
                    <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700 flex-shrink-0">
                        <h3 className="text-sm text-purple-300 mb-1 font-medium">Title</h3>
                        <p className="text-white text-sm font-typewriter">{formattedTerms.title}</p>
                    </div>
                    {formattedTerms.description && (
                        <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700 flex-grow flex flex-col overflow-hidden">
                            <h3 className="text-sm text-purple-300 mb-2 font-medium flex-shrink-0">Description</h3>
                            <div className="relative flex-grow overflow-hidden"> 
                                <div className="absolute inset-0 overflow-hidden">
                                    <div className="escrow-terms-markdown font-typewriter text-xs leading-relaxed line-clamp-10 text-gray-100">
                                        <ReactMarkdown>{formattedTerms.description}</ReactMarkdown>
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-800/70 to-transparent pointer-events-none"></div>
                                <div className="absolute bottom-0 right-0 p-1">
                                    <Button 
                                        variant="link"
                                        className="text-xs h-auto p-0 text-purple-300 hover:text-purple-200 pointer-events-auto"
                                        onClick={() => setIsTermsModalOpen(true)}
                                    >
                                        Read More
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>

          <div className="mb-6">
            <Card className="bg-gray-900 border-gray-800 rounded-3xl shadow-2xl h-full">
              <CardContent className="p-5 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                  <h2 className="text-xl font-semibold text-white">Fund Release Requests</h2>
                  <Button
                    onClick={() => setIsProposeModalOpen(true)}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600"
                  >
                    Propose Fund Release
                  </Button>
                </div>

                <div className="flex-grow overflow-y-auto">
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
                    moduleArbitrator ? (
                      <TransactionList
                        questions={questions}
                        transactionDetails={transactionDetails}
                        transactionStatuses={transactionStatuses}
                        loadingStatuses={loadingStatuses}
                        moduleAddress={moduleAddress}
                        chainId={chainId}
                        onExecuteTransaction={handleExecuteTransactionWrapper}
                        onVouchComplete={refetchQuestions}
                        moduleCooldown={moduleCooldown}
                        moduleExpiration={moduleExpiration}
                        arbitrator={moduleArbitrator}
                      />
                    ) : (
                      <div className="p-4 text-center text-gray-400">
                        Loading arbitrator details...
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

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

          <Dialog open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen}>
            <DialogContent className="max-w-3xl bg-gray-900 border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">{formattedTerms?.title || "Escrow Terms"}</DialogTitle>
              </DialogHeader>
              <div className="mt-4 max-h-[70vh] overflow-y-auto pr-4">
                {formattedTerms?.description ? (
                  <ReactMarkdown components={termsModalMarkdownComponents}>
                    {formattedTerms.description}
                  </ReactMarkdown>
                ) : (
                  <p>No description available.</p>
                )}
              </div>
            </DialogContent>
          </Dialog>

        </div>
        <Footer />
      </div>
    </TooltipProvider>
  );
}
