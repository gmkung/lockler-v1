
import { CircleCheck, Info } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Question } from "reality-kleros-subgraph";
import ReactMarkdown from 'react-markdown';
import { VouchProposal } from '../VouchProposal';
import { ProposalTransaction, type TransactionStatus } from '@/lib/types';

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

export function TransactionList({
  questions,
  transactionDetails,
  transactionStatuses,
  loadingStatuses,
  moduleAddress,
  chainId,
  onExecuteTransaction,
  onVouchComplete
}: TransactionListProps) {
  const getStatusBadge = (phase: string) => {
    const badges = {
      "OPEN": "bg-blue-100 text-blue-800",
      "PENDING": "bg-yellow-100 text-yellow-800",
      "ANSWERED": "bg-green-100 text-green-800",
      "FINALIZED": "bg-purple-100 text-purple-800",
      "DEFAULT": "bg-gray-100 text-gray-800"
    };

    const badgeClass = badges[phase as keyof typeof badges] || badges.DEFAULT;
    return <span className={`px-2 py-1 ${badgeClass} rounded-full text-xs font-medium`}>{phase}</span>;
  };

  return (
    <div className="space-y-5">
      {questions.map((question) => (
        <Card key={question.id} className="border border-gray-200 rounded-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gray-50 p-4 border-b border-gray-100">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-mono text-gray-500">
                      ID: {question.id.slice(0, 8)}...{question.id.slice(-6)}
                    </div>
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
            ) : (
              transactionDetails[question.id]?.map((tx, index) => (
                <div key={index} className="p-4 border-b border-gray-100 last:border-b-0">
                  <div className="flex justify-between items-center">
                    <div className="flex-grow">
                      <p className="font-medium text-gray-800 mb-1">Transaction {index + 1}</p>
                      {tx.error ? (
                        <p className="text-red-600 text-sm">{tx.error}</p>
                      ) : (
                        <TransactionDetails tx={tx} />
                      )}
                    </div>
                    {!tx.error && (
                      <TransactionStatus
                        status={transactionStatuses[question.id]?.[index]}
                        onExecute={() => onExecuteTransaction(question, tx, index)}
                      />
                    )}
                  </div>
                </div>
              ))
            )}

            <div className="p-4 bg-gray-50 border-t border-gray-100">
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

function TransactionDetails({ tx }: { tx: ProposalTransaction }) {
  return (
    <>
      {tx.justification && (
        <div className="mb-3">
          <h4 className="font-medium text-gray-800">{tx.justification.title}</h4>
          {tx.justification.description && (
            <div className="prose prose-sm max-w-none mt-1">
              <ReactMarkdown>{tx.justification.description}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
      <p className="text-sm text-gray-600 mb-1">
        To: <span className="font-mono">{tx.to.slice(0, 10)}...{tx.to.slice(-8)}</span>
      </p>
      <div className="flex gap-4">
        <p className="text-sm text-gray-600">Value: {tx.value}</p>
        <p className="text-sm text-gray-600">Data: {tx.data.slice(0, 10)}...</p>
      </div>
    </>
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
      <div className="text-green-600 flex items-center">
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
        ? "bg-indigo-600 hover:bg-indigo-700"
        : "bg-gray-300 hover:bg-gray-300 cursor-not-allowed"}
    >
      Execute Transaction
    </Button>
  );
}
