import { Card } from "../ui/card";
import { ExternalLink } from "../ui/external-link";
import { Payment } from "@/lib/types";
import { TOKENS, CHAIN_CONFIG } from "@/lib/constants";
import ReactMarkdown from 'react-markdown';
import { getTokenInfo, formatAmount } from '../../lib/currency';
import { AlertTriangle, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FundReleaseConditionsProps {
  formattedTerms: {
    title?: string;
    description?: string;
    type?: string;
    payments?: Payment[];
    ipfsUrl?: string;
  } | null;
  chainId: number;
  moduleCooldown: number | null;
  moduleExpiration: number | null;
  moduleTimeout: number | null;
  moduleBond: bigint | null;
  constantsLoading: boolean;
  constantsError: string | null;
  formatSeconds: (seconds: number | null | undefined) => string;
  formatBond: (bondValue: bigint | null | undefined, chainId: number | null) => string;
}

const getCurrencyInfo = (payment: Payment, chainId: number) => {
  const { symbol } = getTokenInfo(payment.currency, chainId);
  return {
    amount: formatAmount(payment.amount, payment.currency, chainId),
    symbol
  };
};

export function FundReleaseConditions({
  formattedTerms,
  chainId,
  moduleCooldown,
  moduleExpiration,
  moduleTimeout,
  moduleBond,
  constantsLoading,
  constantsError,
  formatSeconds,
  formatBond
}: FundReleaseConditionsProps) {
  if (!formattedTerms) return null;

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-3xl border border-gray-800 p-5 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2 font-typewriter">
            Fund Release Conditions
            {formattedTerms.ipfsUrl && (
              <ExternalLink
                href={formattedTerms.ipfsUrl}
                className="text-purple-400 hover:text-purple-300"
                iconOnly
                title="View Full Terms on IPFS"
              />
            )}
          </h2>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 divide-y divide-gray-700">
          <div className="p-4">
            <h3 className="text-xs font-medium text-gray-400 mb-1 font-typewriter">Title</h3>
            <p className="text-xs text-gray-200 font-typewriter">{formattedTerms.title}</p>
          </div>
          <div className="p-4">
            <h3 className="text-xs font-medium text-gray-400 mb-1 font-typewriter">Description</h3>
            <div className="prose prose-invert prose-xs max-w-none font-typewriter">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-base font-bold text-gray-200 mt-3 mb-1 font-typewriter" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-sm font-semibold text-gray-200 mt-2 mb-1 font-typewriter" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-xs font-medium text-gray-300 mt-1 mb-1 font-typewriter" {...props} />,
                  p: ({ node, ...props }) => <p className="text-xs text-gray-200 mb-2 font-typewriter" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc list-inside text-gray-200 mb-2 font-typewriter text-xs" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal list-inside text-gray-200 mb-2 font-typewriter text-xs" {...props} />,
                  li: ({ node, ...props }) => <li className="text-gray-200 ml-2 font-typewriter text-xs" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-semibold text-gray-100 font-typewriter" {...props} />,
                  code: ({ node, ...props }) => <code className="bg-gray-800 px-1 py-0.5 rounded text-xs text-gray-200 font-typewriter" {...props} />,
                  blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-700 pl-4 italic text-gray-300 font-typewriter text-xs" {...props} />,
                }}
              >
                {formattedTerms.description || ''}
              </ReactMarkdown>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-xs font-medium text-gray-400 mb-1 font-typewriter">Type</h3>
            <p className="text-xs text-gray-200 capitalize font-typewriter">{formattedTerms.type}</p>
          </div>
          {formattedTerms.payments && formattedTerms.payments.length > 0 && (
            <div className="p-4">
              <h3 className="text-xs font-medium text-gray-400 mb-2 font-typewriter">Participants</h3>
              <div className="space-y-3">
                {formattedTerms.payments.map((payment, index) => {
                  const currencyInfo = getCurrencyInfo(payment, chainId);
                  return (
                    <div key={index} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg">
                      <div>
                        <span className="text-xs text-gray-400 capitalize font-typewriter">{payment.role}</span>
                        <p className="text-xs text-gray-200 font-mono font-typewriter">
                          {payment.address.slice(0, 6)}...{payment.address.slice(-4)}
                        </p>
                      </div>
                      <div className="text-right font-typewriter">
                        <span className="text-xs text-gray-200 ">{currencyInfo.amount}</span>
                        <p className="text-2xs text-gray-400">{currencyInfo.symbol}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">
        <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center">
          <Info className="w-5 h-5 mr-2 text-blue-400" />
          Module Configuration
        </h3>
        {constantsLoading ? (
          <div className="space-y-2">
            <div className="animate-pulse h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="animate-pulse h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        ) : constantsError ? (
          <div className="flex items-center text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Error loading configuration: {constantsError}
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-gray-400 underline decoration-dotted cursor-help">
                    Execution Cooldown:
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    The delay required after an approved proposal is finalized before its transactions can be executed.
                  </p>
                </TooltipContent>
              </Tooltip>
              <span className="text-gray-100 font-medium">{formatSeconds(moduleCooldown)}</span>
            </div>

            <div className="flex justify-between items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-gray-400 underline decoration-dotted cursor-help">
                    Answer Expiration:
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    How long an approved answer remains valid after finalization. If it expires, the proposal cannot be executed unless re-approved (if applicable). 'Never' means it's valid indefinitely.
                  </p>
                </TooltipContent>
              </Tooltip>
              <span className="text-gray-100 font-medium">
                {moduleExpiration === 0 ? "Never Expires" : formatSeconds(moduleExpiration)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-gray-400 underline decoration-dotted cursor-help">
                    Timeout:
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    The duration (set on the oracle) for which a question remains open for answers before it can be finalized.
                  </p>
                </TooltipContent>
              </Tooltip>
              <span className="text-gray-100 font-medium">{formatSeconds(moduleTimeout)}</span>
            </div>

            <div className="flex justify-between items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-gray-400 underline decoration-dotted cursor-help">
                    Minimum Bond:
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    The minimum bond required on the final answer (on the oracle) for this module to allow proposal execution.
                  </p>
                </TooltipContent>
              </Tooltip>
              <span className="text-gray-100 font-medium">{formatBond(moduleBond, chainId)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
