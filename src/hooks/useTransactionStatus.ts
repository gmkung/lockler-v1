import { useState, useEffect } from 'react';
import { Question } from 'reality-kleros-subgraph';
import { BrowserProvider, Contract, keccak256 } from 'ethers';
import { fetchFromIPFS } from '../lib/ipfs';
import { REALITY_MODULE_ABI } from '../abis/realityModule';
import { ProposalTransaction, TransactionStatus } from '../lib/types';

export function useTransactionStatus(questions: Question[], moduleAddress: string | null) {
  const [transactionDetails, setTransactionDetails] = useState<Record<string, ProposalTransaction[]>>({});
  const [transactionStatuses, setTransactionStatuses] = useState<Record<string, TransactionStatus[]>>({});
  const [loadingStatuses, setLoadingStatuses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!questions.length || !moduleAddress) return;

    const fetchTransactionDetails = async () => {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const realityModule = new Contract(moduleAddress, REALITY_MODULE_ABI, signer);

      for (const question of questions) {
        try {
          setLoadingStatuses(prev => ({ ...prev, [question.id]: true }));

          const { proposalId } = parseQuestionData(question.data);

          // Check if proposalId is an IPFS CID
          if (!proposalId.startsWith('/ipfs/')) {
            setTransactionDetails(prev => ({
              ...prev,
              [question.id]: [{
                to: '0x0000000000000000000000000000000000000000',
                value: '0',
                data: '0x',
                operation: 0,
                error: 'Not a compatible proposal (not an IPFS CID)'
              }]
            }));
            setTransactionStatuses(prev => ({
              ...prev,
              [question.id]: [{ isExecuted: false, canExecute: false }]
            }));
            continue;
          }

          const transactions = await fetchFromIPFS(proposalId);

          // Calculate transaction hashes
          const txHashes = await Promise.all(transactions.map(async (tx: ProposalTransaction, index: number) => {
            return realityModule.getTransactionHash(
              tx.to,
              tx.value,
              tx.data,
              tx.operation,
              index
            );
          }));

          // Get question hash and check execution status
          const questionHash = keccak256(await realityModule.buildQuestion(proposalId, txHashes));

          const statuses = await Promise.all(txHashes.map(async (txHash, index) => {
            const isExecuted = await realityModule.executedProposalTransactions(questionHash, txHash);
            const canExecute = question.currentAnswer === "1" && // Positive answer
              !isExecuted && // Not already executed
              (index === 0 || await realityModule.executedProposalTransactions(questionHash, txHashes[index - 1])); // First tx or previous executed

            return { isExecuted, canExecute };
          }));

          setTransactionDetails(prev => ({ ...prev, [question.id]: transactions }));
          setTransactionStatuses(prev => ({ ...prev, [question.id]: statuses }));
        } catch (err) {
          console.error(`Error fetching details for question ${question.id}:`, err);
        } finally {
          setLoadingStatuses(prev => ({ ...prev, [question.id]: false }));
        }
      }
    };

    fetchTransactionDetails();
  }, [questions, moduleAddress]);

  return { transactionDetails, transactionStatuses, loadingStatuses, setTransactionStatuses };
}

function parseQuestionData(data: string): { proposalId: string; txHashesHash: string } {
  const [proposalId, txHashesHash] = data.split('␟');
  return { proposalId, txHashesHash };
} 