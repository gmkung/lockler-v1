import { useState, useEffect } from "react";
import { Question } from "reality-kleros-subgraph";
import { BrowserProvider, Contract, keccak256, toUtf8Bytes, JsonRpcProvider } from "ethers";
import { fetchFromIPFS } from "../lib/ipfs";
import { REALITY_MODULE_ABI } from "../abis/realityModule";
import { ProposalTransaction, TransactionStatus } from "../lib/types";
import { getRpcUrl } from "../lib/constants";

function normalizeIpfsPath(proposalId: string): string {
  // Remove '/ipfs/' prefix if it exists
  const withoutPrefix = proposalId.replace(/^\/ipfs\//, '');
  
  // Remove any file extension or path after the CID
  const justCid = withoutPrefix.split('/')[0];
  
  // Return normalized format
  return `/ipfs/${justCid}`;
}

export function useTransactionStatus(
  questions: Question[],
  moduleAddress: string | null,
  chainId?: number | null
) {
  const [transactionDetails, setTransactionDetails] = useState<
    Record<string, ProposalTransaction[]>
  >({});
  const [transactionStatuses, setTransactionStatuses] = useState<
    Record<string, TransactionStatus[]>
  >({});
  const [loadingStatuses, setLoadingStatuses] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (!questions.length || !moduleAddress || !chainId) return;

    const fetchTransactionDetails = async () => {
      // Use a chain-specific RPC provider to ensure we're querying the correct chain
      const provider = new JsonRpcProvider(getRpcUrl(chainId));
      console.log("Created RPC provider for chain:", chainId);
      
      // No signer needed for read-only operations
      const realityModule = new Contract(
        moduleAddress,
        REALITY_MODULE_ABI,
        provider
      );

      for (const question of questions) {
        try {
          setLoadingStatuses((prev) => ({ ...prev, [question.id]: true }));

          const { proposalId } = parseQuestionData(question.data);
          console.log("Parsed question data - proposalId:", proposalId);

          // Normalize IPFS path to consistent format
          const ipfsPath = normalizeIpfsPath(proposalId);
          console.log("Normalized IPFS path:", ipfsPath);

          const transactions = await fetchFromIPFS(ipfsPath);

          // Calculate transaction hashes
          const txHashes = await Promise.all(
            transactions.map(async (tx: ProposalTransaction, index: number) => {
              console.log(`tx:${index.toString()} `, JSON.stringify(tx));
              return realityModule.getTransactionHash(
                tx.to,
                tx.value,
                tx.data,
                tx.operation,
                index
              );
            })
          );
          console.log("txHashes: ", txHashes);

          // Get the question string from the contract (this handles the proper encoding)
          const questionString = await realityModule.buildQuestion(
            proposalId,
            txHashes
          );
          console.log("Question string:", questionString);

          // Hash the question string to get the question hash, matching the contract's keccak256(bytes(question))
          const questionHash = keccak256(toUtf8Bytes(questionString));
          console.log("questionHash: ", questionHash);

          const statuses = await Promise.all(
            txHashes.map(async (txHash, index) => {
              const isExecuted =
                await realityModule.executedProposalTransactions(
                  questionHash,
                  txHash
                );

              // Log execution status
              if (isExecuted) {
                console.log(`Transaction ${index} is already executed`);
              }

              // Check and log answer status
              console.log(question.currentAnswer)
              const isTxApproved =
                question.currentAnswer ==
                "0x0000000000000000000000000000000000000000000000000000000000000001";
              if (isTxApproved) {
                console.log(
                  `Transaction ${index} cannot execute: Question answer is ${question.currentAnswer} (needs to be "1")`
                );
              }

              // Check and log previous transaction status if not first transaction
              let previousTxExecuted = true;
              if (index > 0) {
                previousTxExecuted =
                  await realityModule.executedProposalTransactions(
                    questionHash,
                    txHashes[index - 1]
                  );
                if (!previousTxExecuted) {
                  console.log(
                    `Transaction ${index} cannot execute: Previous transaction (${index - 1}) not executed yet`
                  );
                }
              }

              const canExecute =
                isTxApproved && // Positive answer
                !isExecuted && // Not already executed
                (index === 0 || previousTxExecuted); // First tx or previous executed

              console.log(`Transaction ${index} execution status:`, {
                isTxApproved: isTxApproved,
                isExecuted,
                isFirstTx: index === 0,
                previousTxExecuted,
              });

              return { isExecuted, canExecute };
            })
          );

          setTransactionDetails((prev) => ({
            ...prev,
            [question.id]: transactions,
          }));
          setTransactionStatuses((prev) => ({
            ...prev,
            [question.id]: statuses,
          }));
        } catch (err) {
          console.error(
            `Error fetching details for question ${question.id}:`,
            err
          );
          setTransactionDetails((prev) => ({
            ...prev,
            [question.id]: [
              {
                to: "0x0000000000000000000000000000000000000000",
                value: "0",
                data: "0x",
                operation: 0,
                error: `Failed to fetch transaction details: ${err.message}`,
              },
            ],
          }));
          setTransactionStatuses((prev) => ({
            ...prev,
            [question.id]: [{ isExecuted: false, canExecute: false }],
          }));
        } finally {
          setLoadingStatuses((prev) => ({ ...prev, [question.id]: false }));
        }
      }
    };

    fetchTransactionDetails();
  }, [questions, moduleAddress, chainId]);

  return {
    transactionDetails,
    transactionStatuses,
    loadingStatuses,
    setTransactionStatuses,
  };
}
function parseQuestionData(data: string): {
  proposalId: string;
  txHashesHash: string;
} {
  const [proposalId, txHashesHash] = data.split("␟");
  return { proposalId, txHashesHash };
}

