
import { Card } from "../ui/card";
import { ExternalLink } from "../ui/external-link";
import { Payment } from "@/lib/types";
import { TOKENS, CHAIN_CONFIG } from "@/lib/constants";
import ReactMarkdown from 'react-markdown';
import { getTokenInfo, formatAmount } from '../../lib/currency';

interface FundReleaseConditionsProps {
  formattedTerms: {
    title?: string;
    description?: string;
    type?: string;
    payments?: Payment[];
    ipfsUrl?: string;
  } | null;
  chainId: number;
}

const getCurrencyInfo = (payment: Payment, chainId: number) => {
  const { symbol } = getTokenInfo(payment.currency, chainId);
  return {
    amount: formatAmount(payment.amount, payment.currency, chainId),
    symbol
  };
};

export function FundReleaseConditions({ formattedTerms, chainId }: FundReleaseConditionsProps) {
  if (!formattedTerms) return null;

  return (
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
                h1: ({node, ...props}) => <h1 className="text-base font-bold text-gray-200 mt-3 mb-1 font-typewriter" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-sm font-semibold text-gray-200 mt-2 mb-1 font-typewriter" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xs font-medium text-gray-300 mt-1 mb-1 font-typewriter" {...props} />,
                p: ({node, ...props}) => <p className="text-xs text-gray-200 mb-2 font-typewriter" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside text-gray-200 mb-2 font-typewriter text-xs" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside text-gray-200 mb-2 font-typewriter text-xs" {...props} />,
                li: ({node, ...props}) => <li className="text-gray-200 ml-2 font-typewriter text-xs" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-gray-100 font-typewriter" {...props} />,
                code: ({node, ...props}) => <code className="bg-gray-800 px-1 py-0.5 rounded text-xs text-gray-200 font-typewriter" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-700 pl-4 italic text-gray-300 font-typewriter text-xs" {...props} />,
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
  );
}
