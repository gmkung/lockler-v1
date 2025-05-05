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
import { useToast } from "@/hooks/use-toast";
import { formatAmount } from '../../lib/currency';
import { analyzeTransaction } from '@/lib/transactionUtils';
import React, { useState, useEffect } from 'react';


interface TransactionListProps {
  questions: Question[];
  transactionDetails: Record<string, ProposalTransaction[]>;
  transactionStatuses: Record<string, TransactionStatus[]>;
  loadingStatuses: Record<string, boolean>;
  moduleAddress: string;
  chainId: number;
  onExecuteTransaction: (question: Question, transaction: ProposalTransaction, txIndex: number) => Promise<void>;
  onVouchComplete: () => Promise<void>;
  moduleCooldown: number | null;
  moduleExpiration: number | null;
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
  const details = analyzeTransaction(tx, chainId);

  return (
    <div className="text-gray-200 space-y-4">
      {tx.justification && (
        <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-900/50 font-typewriter text-xs relative">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-700/50 rounded-l-lg"></div>
          <h4 className="font-semibold text-sm mb-1 text-gray-300 font-typewriter pl-2">{tx.justification.title}</h4>
          {tx.justification.description && (
            <div className="prose prose-xs max-w-none prose-invert prose-p:text-gray-500 prose-headings:text-gray-400 prose-p:text-xs prose-headings:text-xs font-typewriter pl-2 italic">
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
          <span className="text-sm text-right">
            {formatAmount(details.value, TOKENS.NATIVE.address, chainId)}
          </span>
        </div>
        {details.type === 'erc20' && (
          <div className="flex items-center">
            <span className="text-sm text-gray-400 w-16">Transfer:</span>
            <span className="text-sm text-right">
              {formatAmount(details.amount, details.to, chainId)} to {`${details.recipient.slice(0, 6)}...${details.recipient.slice(-4)}`}
            </span>
          </div>
        )}
        {details.type === 'erc721' && (
          <div className="flex items-center">
            <span className="text-sm text-gray-400 w-16">Transfer:</span>
            <span className="text-sm text-right">
              NFT #{details.tokenId} to {`${details.recipient.slice(0, 6)}...${details.recipient.slice(-4)}`}
            </span>
          </div>
        )}
        <div className="flex items-center">
          <span className="text-sm text-gray-400 w-16">Data:</span>
          <span className="font-mono text-sm truncate">
            {details.type === 'custom' && details.decodedCalldata
              ? `${details.decodedCalldata.functionName}(${details.decodedCalldata.params.join(', ')})`
              : tx.data.slice(0, 10) + '...'}
          </span>
        </div>
      </div>
    </div>
  );
}

function TransactionStatus({
  status,
  onExecute,
  question
}: {
  status?: TransactionStatus;
  onExecute: () => void;
  question: Question;
}) {
  const { toast } = useToast();

  const handleExecute = async () => {
    try {
      await onExecute();
    } catch (error: any) {
      let errorMessage = "Failed to execute transaction";

      if (error.message) {
        if (error.reason) {
          errorMessage = `Error: ${error.reason}`;
        } else if (error.message.includes("reason=")) {
          const reasonMatch = error.message.match(/reason="([^"]+)"/);
          if (reasonMatch && reasonMatch[1]) {
            errorMessage = `Error: ${reasonMatch[1]}`;
          } else {
            errorMessage = error.message;
          }
        } else if (error.shortMessage) {
          errorMessage = error.shortMessage;
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        variant: "destructive",
        title: "Transaction Failed",
        description: errorMessage,
      });

      console.error("Transaction error details:", error);
    }
  };

  // If transaction is already executed, show executed state
  if (status?.isExecuted) {
    return (
      <div className="text-green-400 flex items-center">
        <CircleCheck className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">Executed</span>
      </div>
    );
  }

  // If answer is not finalized yet, don't show execute button at all
  if (question.phase !== "FINALIZED") {
    return (
      <div className="text-yellow-400/70 text-sm">
        Awaiting finalization
      </div>
    );
  }

  // If answer is finalized but in cooldown or has some other issue
  if (!status?.canExecute) {
    return (
      <div className="text-purple-400/70 text-sm">
        Not yet executable
      </div>
    );
  }

  // Only show the Execute button when transaction is finalized AND executable
  return (
    <Button
      onClick={handleExecute}
      size="sm"
      className="bg-gradient-to-r from-emerald-800 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
    >
      Execute Transaction
    </Button>
  );
}

function TimeRemaining({ question }: { question: Question }) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  if (question.phase === 'FINALIZED') {
    return null;
  }

  const finalizableTs = typeof question.currentScheduledFinalizationTimestamp === 'number'
                        ? question.currentScheduledFinalizationTimestamp
                        : (typeof question.currentScheduledFinalizationTimestamp === 'string'
                           ? parseInt(question.currentScheduledFinalizationTimestamp, 10)
                           : 0);

  if (!question.currentAnswer || !finalizableTs || finalizableTs <= 0) {
    return null;
  }

  if (now >= finalizableTs) {
    if ((question.phase as string) === 'ANSWERED') {
      return <div className="text-sm text-yellow-300">Ready to finalize</div>;
    }
    return null;
  }

  const timeToFinalization = finalizableTs - now;

  return (
    <div className="text-sm text-yellow-400" title={`Scheduled finalization timestamp: ${finalizableTs}`}>
      Finalizable in: {formatTime(timeToFinalization)}
    </div>
  );
}

function formatTime(timeInSeconds: number): string {
  if (timeInSeconds <= 0) {
    return '';
  }
  const days = Math.floor(timeInSeconds / 86400);
  const hours = Math.floor((timeInSeconds % 86400) / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;

  let timeStr = '';
  if (days > 0) timeStr += `${days}d `;
  if (hours > 0) timeStr += `${hours}h `;
  if (minutes > 0) timeStr += `${minutes}m `;
  if (days === 0 && hours === 0 && minutes === 0 && seconds > 0) timeStr += `${seconds}s`;
  else if (timeStr !== '' && seconds === 0) {}
  else if (timeStr !== '') timeStr += `${seconds}s`;

  return timeStr.trim();
}

interface ExecutionCountdownProps {
  question: Question;
  cooldown: number | null;
  expiration: number | null;
}

const ExecutionCountdown = ({ question, cooldown, expiration }: ExecutionCountdownProps) => {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const isApproved = question.currentAnswer === "0x0000000000000000000000000000000000000000000000000000000000000001";
  const isFinalized = question.phase === "FINALIZED";
  const finalizedTs = typeof question.answerFinalizedTimestamp === 'number'
    ? question.answerFinalizedTimestamp
    : (typeof question.answerFinalizedTimestamp === 'string'
      ? parseInt(question.answerFinalizedTimestamp, 10)
      : 0);

  // Show appropriate messages based on the current state
  if (!isFinalized) {
    return null; // Handled by TimeRemaining component
  }
  
  if (!isApproved) {
    return <div className="text-sm text-red-400">Rejected</div>;
  }
  
  if (!finalizedTs || finalizedTs <= 0 || cooldown === null || expiration === null) {
    return <div className="text-sm text-gray-400">Awaiting data...</div>;
  }

  const executionAvailableTs = finalizedTs + cooldown;
  const expiryTs = expiration > 0 ? finalizedTs + expiration : Infinity;

  // If the proposal has expired
  if (now >= expiryTs) {
    return <div className="text-sm text-red-400">Expired</div>;
  }

  // If the proposal is ready for execution
  if (now >= executionAvailableTs) {
    let expiryInfo = '';
    if (expiryTs !== Infinity) {
      const timeToExpire = expiryTs - now;
      expiryInfo = ` (expires in ${formatTime(timeToExpire)})`;
    }
    return (
      <div className="text-sm font-medium text-green-400 flex flex-col">
        <div className="flex items-center">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>
          Ready to execute
        </div>
        {expiryInfo && (
          <div className="text-xs text-gray-400 mt-0.5">
            Expires in {formatTime(expiryTs - now)}
          </div>
        )}
      </div>
    );
  }

  // If the proposal is in cooldown period
  const timeToExecution = executionAvailableTs - now;
  return (
    <div className="text-sm text-purple-200">
      In cooldown: {formatTime(timeToExecution)} remaining
    </div>
  );
};

export function TransactionList({ questions, transactionDetails, transactionStatuses, loadingStatuses, moduleAddress, chainId, onExecuteTransaction, onVouchComplete, moduleCooldown, moduleExpiration }: TransactionListProps) {
  return (
    <div className="space-y-5">
      {questions.map((question) => (
        <Card key={question.id} className="border-gray-800/30 bg-white/5 backdrop-blur">
          <CardContent className="p-0">
            <div className="bg-gray-800/30 p-4 border-b border-gray-700/30">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-xs font-mono text-purple-300 whitespace-nowrap">
                    ID: {question.id.slice(0, 8)}...{question.id.slice(-6)}
                  </div>
                  {getStatusBadge(question.phase)}
                  {question.phase !== "FINALIZED" && <TimeRemaining question={question} />}
                </div>
                <a
                  href={`https://reality.eth.limo/app/#!/network/${chainId}/question/${moduleAddress}-${question.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 transition-colors flex-shrink-0 ml-2"
                  title="View on Reality.eth"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              </div>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-purple-200">Answer:</span>
                  <span className={`font-medium ${!question.currentAnswer ? "text-purple-200" :
                    question.currentAnswer === "0x0000000000000000000000000000000000000000000000000000000000000001" ? "text-green-400" : "text-red-400"
                  }`}>
                    {!question.currentAnswer ? "Pending" :
                      question.currentAnswer === "0x0000000000000000000000000000000000000000000000000000000000000001" ? "Approved" : "Rejected"}
                  </span>
                </div>
                <ExecutionCountdown
                  question={question}
                  cooldown={moduleCooldown}
                  expiration={moduleExpiration}
                />
              </div>
            </div>

            {loadingStatuses[question.id] ? (
              <div className="p-4">
                <div className="animate-pulse h-6 bg-purple-800/20 rounded w-3/4 mb-2"></div>
                <div className="animate-pulse h-6 bg-purple-800/20 rounded w-1/2"></div>
              </div>
            ) : (
              transactionDetails[question.id]?.map((tx, index) => (
                <div key={index} className="p-4 border-b border-gray-700/30 last:border-b-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-purple-100">Transaction {index + 1}</p>
                      <div className="flex items-center gap-3">
                        {/* Only show execution button for finalized questions with approved answers */}
                        {!tx.error && (
                          <TransactionStatus
                            status={transactionStatuses[question.id]?.[index]}
                            onExecute={() => onExecuteTransaction(question, tx, index)}
                            question={question}
                          />
                        )}
                      </div>
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

            <div className="p-4 bg-gray-800/30 border-t border-gray-700/30">
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

function formatValue(value: string, currency: string, data: string, chainId: number): string {
  try {
    if (isERC20Transfer(data) && currency !== "0x0000000000000000000000000000000000000000") {
      return formatAmount(value, currency, chainId);
    }
    return formatAmount(value, TOKENS.NATIVE.address, chainId);
  } catch (error) {
    console.error("Error formatting value:", error);
    return `${value} (format error)`;
  }
}
