// From REALITYETH3.sol
export const REALITYV3_ABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "question_id",
        type: "bytes32",
      },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      {
        indexed: true,
        internalType: "bytes32",
        name: "answer_hash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "answer",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "bond",
        type: "uint256",
      },
    ],
    name: "LogAnswerReveal",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "question_id",
        type: "bytes32",
      },
    ],
    name: "LogCancelArbitration",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "question_id",
        type: "bytes32",
      },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "LogClaim",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "question_id",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "answer",
        type: "bytes32",
      },
    ],
    name: "LogFinalize",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "question_id",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "bounty_added",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "bounty",
        type: "uint256",
      },
      { indexed: true, internalType: "address", name: "user", type: "address" },
    ],
    name: "LogFundAnswerBounty",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "question_id",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "min_bond",
        type: "uint256",
      },
    ],
    name: "LogMinimumBond",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "answer",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "question_id",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "history_hash",
        type: "bytes32",
      },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "bond",
        type: "uint256",
      },
      { indexed: false, internalType: "uint256", name: "ts", type: "uint256" },
      {
        indexed: false,
        internalType: "bool",
        name: "is_commitment",
        type: "bool",
      },
    ],
    name: "LogNewAnswer",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "question_id",
        type: "bytes32",
      },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "template_id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "question",
        type: "string",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "content_hash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "address",
        name: "arbitrator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "timeout",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "opening_ts",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "created",
        type: "uint256",
      },
    ],
    name: "LogNewQuestion",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "template_id",
        type: "uint256",
      },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      {
        indexed: false,
        internalType: "string",
        name: "question_text",
        type: "string",
      },
    ],
    name: "LogNewTemplate",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "question_id",
        type: "bytes32",
      },
      { indexed: true, internalType: "address", name: "user", type: "address" },
    ],
    name: "LogNotifyOfArbitrationRequest",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "question_id",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "reopened_question_id",
        type: "bytes32",
      },
    ],
    name: "LogReopenQuestion",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "arbitrator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "LogSetQuestionFee",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "LogWithdraw",
    type: "event",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "arbitrator_question_fees",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "template_id", type: "uint256" },
      { internalType: "string", name: "question", type: "string" },
      { internalType: "address", name: "arbitrator", type: "address" },
      { internalType: "uint32", name: "timeout", type: "uint32" },
      { internalType: "uint32", name: "opening_ts", type: "uint32" },
      { internalType: "uint256", name: "nonce", type: "uint256" },
    ],
    name: "askQuestion",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "template_id", type: "uint256" },
      { internalType: "string", name: "question", type: "string" },
      { internalType: "address", name: "arbitrator", type: "address" },
      { internalType: "uint32", name: "timeout", type: "uint32" },
      { internalType: "uint32", name: "opening_ts", type: "uint32" },
      { internalType: "uint256", name: "nonce", type: "uint256" },
      { internalType: "uint256", name: "min_bond", type: "uint256" },
    ],
    name: "askQuestionWithMinBond",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "question_id", type: "bytes32" },
      { internalType: "bytes32", name: "answer", type: "bytes32" },
      { internalType: "address", name: "payee_if_wrong", type: "address" },
      { internalType: "bytes32", name: "last_history_hash", type: "bytes32" },
      {
        internalType: "bytes32",
        name: "last_answer_or_commitment_id",
        type: "bytes32",
      },
      { internalType: "address", name: "last_answerer", type: "address" },
    ],
    name: "assignWinnerAndSubmitAnswerByArbitrator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "question_id", type: "bytes32" }],
    name: "cancelArbitration",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32[]", name: "question_ids", type: "bytes32[]" },
      { internalType: "uint256[]", name: "lengths", type: "uint256[]" },
      { internalType: "bytes32[]", name: "hist_hashes", type: "bytes32[]" },
      { internalType: "address[]", name: "addrs", type: "address[]" },
      { internalType: "uint256[]", name: "bonds", type: "uint256[]" },
      { internalType: "bytes32[]", name: "answers", type: "bytes32[]" },
    ],
    name: "claimMultipleAndWithdrawBalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "question_id", type: "bytes32" },
      { internalType: "bytes32[]", name: "history_hashes", type: "bytes32[]" },
      { internalType: "address[]", name: "addrs", type: "address[]" },
      { internalType: "uint256[]", name: "bonds", type: "uint256[]" },
      { internalType: "bytes32[]", name: "answers", type: "bytes32[]" },
    ],
    name: "claimWinnings",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "commitments",
    outputs: [
      { internalType: "uint32", name: "reveal_ts", type: "uint32" },
      { internalType: "bool", name: "is_revealed", type: "bool" },
      { internalType: "bytes32", name: "revealed_answer", type: "bytes32" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "content", type: "string" }],
    name: "createTemplate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "content", type: "string" },
      { internalType: "string", name: "question", type: "string" },
      { internalType: "address", name: "arbitrator", type: "address" },
      { internalType: "uint32", name: "timeout", type: "uint32" },
      { internalType: "uint32", name: "opening_ts", type: "uint32" },
      { internalType: "uint256", name: "nonce", type: "uint256" },
    ],
    name: "createTemplateAndAskQuestion",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "question_id", type: "bytes32" }],
    name: "fundAnswerBounty",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "question_id", type: "bytes32" }],
    name: "getArbitrator",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "question_id", type: "bytes32" }],
    name: "getBestAnswer",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "question_id", type: "bytes32" }],
    name: "getBond",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "question_id", type: "bytes32" }],
    name: "getBounty",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "question_id", type: "bytes32" }],
    name: "getContentHash",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "question_id", type: "bytes32" }],
    name: "getFinalAnswer",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "question_id", type: "bytes32" },
      { internalType: "bytes32", name: "content_hash", type: "bytes32" },
      { internalType: "address", name: "arbitrator", type: "address" },
      { internalType: "uint32", name: "min_timeout", type: "uint32" },
      { internalType: "uint256", name: "min_bond", type: "uint256" },
    ],
    name: "getFinalAnswerIfMatches",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "question_id", type: "bytes32" }],
    name: "getFinalizeTS",
    outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "question_id", type: "bytes32" }],
    name: "getHistoryHash",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "question_id", type: "bytes32" }],
    name: "getMinBond",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "question_id", type: "bytes32" }],
    name: "getOpeningTS",
    outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "question_id", type: "bytes32" }],
    name: "getTimeout",
    outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "question_id", type: "bytes32" }],
    name: "isFinalized",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "question_id", type: "bytes32" }],
    name: "isPendingArbitration",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "question_id", type: "bytes32" }],
    name: "isSettledTooSoon",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "question_id", type: "bytes32" },
      { internalType: "address", name: "requester", type: "address" },
      { internalType: "uint256", name: "max_previous", type: "uint256" },
    ],
    name: "notifyOfArbitrationRequest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "question_claims",
    outputs: [
      { internalType: "address", name: "payee", type: "address" },
      { internalType: "uint256", name: "last_bond", type: "uint256" },
      { internalType: "uint256", name: "queued_funds", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "questions",
    outputs: [
      { internalType: "bytes32", name: "content_hash", type: "bytes32" },
      { internalType: "address", name: "arbitrator", type: "address" },
      { internalType: "uint32", name: "opening_ts", type: "uint32" },
      { internalType: "uint32", name: "timeout", type: "uint32" },
      { internalType: "uint32", name: "finalize_ts", type: "uint32" },
      { internalType: "bool", name: "is_pending_arbitration", type: "bool" },
      { internalType: "uint256", name: "bounty", type: "uint256" },
      { internalType: "bytes32", name: "best_answer", type: "bytes32" },
      { internalType: "bytes32", name: "history_hash", type: "bytes32" },
      { internalType: "uint256", name: "bond", type: "uint256" },
      { internalType: "uint256", name: "min_bond", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "template_id", type: "uint256" },
      { internalType: "string", name: "question", type: "string" },
      { internalType: "address", name: "arbitrator", type: "address" },
      { internalType: "uint32", name: "timeout", type: "uint32" },
      { internalType: "uint32", name: "opening_ts", type: "uint32" },
      { internalType: "uint256", name: "nonce", type: "uint256" },
      { internalType: "uint256", name: "min_bond", type: "uint256" },
      { internalType: "bytes32", name: "reopens_question_id", type: "bytes32" },
    ],
    name: "reopenQuestion",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "reopened_questions",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "reopener_questions",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "question_id", type: "bytes32" }],
    name: "resultFor",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "question_id", type: "bytes32" }],
    name: "resultForOnceSettled",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "fee", type: "uint256" }],
    name: "setQuestionFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "question_id", type: "bytes32" },
      { internalType: "bytes32", name: "answer", type: "bytes32" },
      { internalType: "uint256", name: "max_previous", type: "uint256" },
    ],
    name: "submitAnswer",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "question_id", type: "bytes32" },
      { internalType: "bytes32", name: "answer", type: "bytes32" },
      { internalType: "address", name: "answerer", type: "address" },
    ],
    name: "submitAnswerByArbitrator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "question_id", type: "bytes32" },
      { internalType: "bytes32", name: "answer_hash", type: "bytes32" },
      { internalType: "uint256", name: "max_previous", type: "uint256" },
      { internalType: "address", name: "_answerer", type: "address" },
    ],
    name: "submitAnswerCommitment",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "question_id", type: "bytes32" },
      { internalType: "bytes32", name: "answer", type: "bytes32" },
      { internalType: "uint256", name: "max_previous", type: "uint256" },
      { internalType: "address", name: "answerer", type: "address" },
    ],
    name: "submitAnswerFor",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "question_id", type: "bytes32" },
      { internalType: "bytes32", name: "answer", type: "bytes32" },
      { internalType: "uint256", name: "nonce", type: "uint256" },
      { internalType: "uint256", name: "bond", type: "uint256" },
    ],
    name: "submitAnswerReveal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "template_hashes",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "templates",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// Also add types for the Question Phase
export enum QuestionPhase {
  POSTED = "POSTED",
  ANSWERED = "ANSWERED",
  PENDING = "PENDING",
  FINALIZED = "FINALIZED",
}
