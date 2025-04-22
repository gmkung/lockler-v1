import { CircleCheck, ExternalLink } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Question } from "reality-kleros-subgraph";
import ReactMarkdown from 'react-markdown';
import { VouchProposal } from '../VouchProposal';
import { ProposalTransaction, type TransactionStatus } from '@/lib/types';
import { TOKENS, CHAIN_CONFIG } from '@/lib/constants';
import { ethers } from 'ethers';
import { TransactionModal } from './TransactionModal';
import { ERC20_ABI } from '@/abis/erc20';

interface TransactionListProps {
  questions: Question[];
  transactionDetails: Record<string, ProposalTransaction[]>;
  transactionStatuses: Record<string, TransactionStatus[]>;
  loadingStatuses: Record<string, boolean>;
  moduleAddress: string;
  chainId: number;
  onExecuteTransaction: (question: Question, transaction: ProposalTransaction, txIndex: number) => Promise<void>;
  onVouchComplete: () => Promise<void>;
}

function isERC20Transfer(data: string): boolean {
  try {
    const iface = new ethers.Interface(ERC20_ABI);
    const functionSig = data.slice(0, 10).toLowerCase();
    return functionSig === iface.getFunction("transfer")?.selector.toLowerCase();
  } catch {
    return false;
  }
}

function formatValue(value: string, currency: string, data: string, chainId: number): string {
  if (isERC20Transfer(data) && currency !== "0x0000000000000000000000000000000000000000") {
    if (TOKENS.USDC[chainId as keyof typeof TOKENS.USDC]?.address.toLowerCase() === currency.toLowerCase()) {
      return `${ethers.formatUnits(value, 6)} USDC`;
    }
    if (TOKENS.PNK[chainId as keyof typeof TOKENS.PNK]?.address.toLowerCase() === currency.toLowerCase()) {
      return `${ethers.formatEther(value)} PNK`;
    }
    return `${value} tokens`;
  }
  return `${ethers.formatEther(value)} ${CHAIN_CONFIG[chainId]?.nativeCurrency.symbol || 'ETH'}`;
}

function getStatusBadge(phase: string) {
  const badges = {
    "OPEN": "bg-purple-900/20 text-purple-200",
    "PENDING": "bg-yellow-900/20 text-yellow-200",
    "ANSWERED": "bg-green-900/20 text-green-200",
    "FINALIZED": "bg-blue-900/20 text-blue-200",
    "DEFAULT": "bg-gray-900/20 text-gray-200"
  };

  const badgeClass = badges[phase as keyof typeof badges] || badges.DEFAULT;
  return <span className={`px-2 py-1 ${badgeClass} rounded-full text-xs font-medium border border-current/20`}>{phase}</span>;
}

function TransactionDetails({ tx, chainId }: { tx: ProposalTransaction; chainId: number }) {
  return (
    <div className="text-gray-200 space-y-4">
      {tx.justification && (
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <h4 className="font-semibold text-white text-lg mb-2">{tx.justification.title}</h4>
          {tx.justification.description && (
            <div className="prose prose-sm max-w-none prose-invert prose-p:text-gray-300 prose-headings:text-gray-200">
              <ReactMarkdown>{tx.justification.description}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
      <div className="space-y-2 w-full">
        <div className="flex items-center">
          <span className="text-sm text-gray-400 w-16">To:</span>
          <span className="font-mono text-sm truncate">{`${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`}</span>
          <div className="ml-auto">
            <TransactionModal transaction={tx} />
          </div>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-gray-400 w-16">Value:</span>
          <span className="text-sm text-right">{formatValue(tx.value, tx.to, tx.data, chainId)}</span>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-gray-400 w-16">Data:</span>
          <span className="font-mono text-sm truncate">{tx.data.slice(0, 10)}...</span>
        </div>
      </div>
    </div>
  );
}

function TransactionStatus({ 
  status, 
  onExecute 
}: { 
  status?: TransactionStatus;
  onExecute: () => void;
}) {
  if (status?.isExecuted) {
    return (
      <div className="text-green-400 flex items-center">
        <CircleCheck className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">Executed</span>
      </div>
    );
  }
  
  return (
    <Button
      disabled={!status?.canExecute}
      onClick={onExecute}
      size="sm"
      className={status?.canExecute
        ? "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
        : "bg-purple-900/20 text-purple-400 hover:bg-purple-900/20 cursor-not-allowed border-purple-800/20"}
    >
      Execute Transaction
    </Button>
  );
}

export function TransactionList({ questions, transactionDetails, transactionStatuses, loadingStatuses, moduleAddress, chainId, onExecuteTransaction, onVouchComplete }: TransactionListProps) {
  return (
    <div className="space-y-5">
      {questions.map((question) => (
        <Card key={question.id} className="border-purple-800/20 bg-white/5 backdrop-blur">
          <CardContent className="p-0">
            <div className="bg-purple-900/10 p-4 border-b border-purple-800/20">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-mono text-purple-300">
                      ID: {question.id.slice(0, 8)}...{question.id.slice(-6)}
                    </div>
                    {getStatusBadge(question.phase)}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-sm text-purple-200">Answer: </span>
                <span className={`font-medium ${
                  !question.currentAnswer ? "text-purple-200" :
                  question.currentAnswer === "0x0000000000000000000000000000000000000000000000000000000000000001" ? "text-green-400" : "text-red-400"
                }`}>
                  {!question.currentAnswer ? "Pending" :
                   question.currentAnswer === "0x0000000000000000000000000000000000000000000000000000000000000001" ? "Approved" : "Rejected"}
                </span>
              </div>
            </div>

            {loadingStatuses[question.id] ? (
              <div className="p-4">
                <div className="animate-pulse h-6 bg-purple-800/20 rounded w-3/4 mb-2"></div>
                <div className="animate-pulse h-6 bg-purple-800/20 rounded w-1/2"></div>
              </div>
            ) : (
              transactionDetails[question.id]?.map((tx, index) => (
                <div key={index} className="p-4 border-b border-purple-800/20 last:border-b-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-purple-100">Transaction {index + 1}</p>
                      {!tx.error && (
                        <TransactionStatus
                          status={transactionStatuses[question.id]?.[index]}
                          onExecute={() => onExecuteTransaction(question, tx, index)}
                        />
                      )}
                    </div>
                    {tx.error ? (
                      <p className="text-red-400 text-sm">{tx.error}</p>
                    ) : (
                      <TransactionDetails tx={tx} chainId={chainId} />
                    )}
                  </div>
                </div>
              ))
            )}

            <div className="p-4 bg-purple-900/10 border-t border-purple-800/20">
              <VouchProposal
                questionId={question.id}
                moduleAddress={moduleAddress}
                chainId={chainId}
                disabled={question.phase !== "OPEN"}
                onVouchComplete={onVouchComplete}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
