import { useState, useEffect } from "react";
import { Question } from "reality-kleros-subgraph";
import { BrowserProvider, Contract, keccak256, toUtf8Bytes } from "ethers";
import { fetchFromIPFS } from "../lib/ipfs";
import { REALITY_MODULE_ABI } from "../abis/realityModule";
import { ProposalTransaction, TransactionStatus } from "../lib/types";
import { bytes32ToCidV0 } from "../lib/cid";

export function useTransactionStatus(
  questions: Question[],
  moduleAddress: string | null
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
    if (!questions.length || !moduleAddress) return;

    const fetchTransactionDetails = async () => {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const realityModule = new Contract(
        moduleAddress,
        REALITY_MODULE_ABI,
        signer
      );

      for (const question of questions) {
        try {
          setLoadingStatuses((prev) => ({ ...prev, [question.id]: true }));

          const { proposalId } = parseQuestionData(question.data);
          console.log("Parsed question data - proposalId:", proposalId);

          // Convert bytes32 to CID and fetch from IPFS
          const cidV0 = bytes32ToCidV0(proposalId);
          const ipfsPath = `/ipfs/${cidV0}/item.json`;
          console.log("Fetching from IPFS:", ipfsPath);

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
          const questionString = await realityModule.buildQuestion(proposalId, txHashes);
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
              console.log("question.currentAnswer: ", question.currentAnswer);
              const canExecute =
                question.currentAnswer === "1" && // Positive answer
                !isExecuted && // Not already executed
                (index === 0 ||
                  (await realityModule.executedProposalTransactions(
                    questionHash,
                    txHashes[index - 1]
                  ))); // First tx or previous executed

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
  }, [questions, moduleAddress]);

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
