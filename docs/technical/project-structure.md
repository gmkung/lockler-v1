# Lockler Technical Project Structure

This document provides a comprehensive overview of the Lockler codebase architecture, file organization, and key interfaces.

## Directory Structure

```
lockler-v1-app/
├── src/
│   ├── abis/                          # Contract ABIs and interfaces
│   │   ├── arbitratorproxy.ts        # Kleros ArbitratorProxy ABI
│   │   ├── contracts.ts              # Safe, Module Factory, DDH, Multisend ABIs
│   │   ├── erc20.ts                  # ERC-20 token standard ABI
│   │   ├── erc721.ts                 # ERC-721 NFT standard ABI
│   │   ├── realityModule.ts          # Reality Module (Zodiac) ABI
│   │   └── realityv3.ts              # Reality.eth Oracle ABI
│   │
│   ├── components/                    # React UI components
│   │   ├── intro/                    # Landing page components
│   │   ├── release/                  # Release page components
│   │   │   ├── ErrorState.tsx
│   │   │   ├── FundReleaseConditions.tsx
│   │   │   ├── LoadingState.tsx
│   │   │   ├── ModuleAddressCard.tsx
│   │   │   ├── SecurityChecks.tsx
│   │   │   ├── SecurityChecksModal.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── TransactionList.tsx
│   │   │   ├── TransactionModal.tsx
│   │   │   └── utils.tsx
│   │   ├── setup/                    # Setup flow components
│   │   │   ├── CounterpartyInput.tsx
│   │   │   ├── DeploymentModal.tsx
│   │   │   ├── ModeSelection.tsx
│   │   │   ├── RoleSelection.tsx
│   │   │   └── SuccessStep.tsx
│   │   ├── ui/                       # Reusable UI primitives (shadcn/ui)
│   │   ├── AppTopBar.tsx
│   │   ├── ContractTermsForm.tsx
│   │   ├── DeploymentStatus.tsx
│   │   ├── MetamaskConnect.tsx
│   │   ├── NetworkInfo.tsx
│   │   ├── ProposeTransactionModal.tsx
│   │   ├── SafeDeployForm.tsx
│   │   ├── StepProgressBar.tsx
│   │   ├── StepWrapper.tsx
│   │   └── VouchProposal.tsx
│   │
│   ├── hooks/                        # React custom hooks
│   │   ├── useChainSelection.ts      # Chain switching logic
│   │   ├── useDeployment.ts          # Safe & Module deployment orchestration
│   │   ├── useLocklers.ts            # Lockler discovery and storage
│   │   ├── useQuestions.ts           # Reality.eth question streaming
│   │   ├── useRealityModule.ts       # Module validation and queries
│   │   ├── useTransactionStatus.ts   # Transaction execution state
│   │   └── use-toast.ts              # Toast notifications
│   │
│   ├── lib/                          # Core business logic
│   │   ├── cid.ts                    # IPFS CID encoding/decoding
│   │   ├── constants.ts              # Chain configs, contract addresses
│   │   ├── currency.ts               # Token formatting utilities
│   │   ├── deployment.ts             # Module deployment logic
│   │   ├── ipfs.ts                   # IPFS upload/download
│   │   ├── moduleUtils.ts            # Module encoding/signing utilities
│   │   ├── polyfills.ts              # Browser polyfills (Buffer, etc.)
│   │   ├── templates.ts              # Question template generation
│   │   ├── transactionUtils.ts       # Transaction encoding helpers
│   │   ├── transactions.ts           # Transaction execution logic
│   │   ├── types.ts                  # TypeScript type definitions
│   │   └── web3.ts                   # Web3 provider, Safe deployment
│   │
│   ├── pages/                        # Route components
│   │   ├── Index.tsx                 # Landing page
│   │   ├── MyLocklers.tsx            # User's Locklers list
│   │   ├── NotFound.tsx              # 404 page
│   │   ├── Release.tsx               # Release page (main app)
│   │   ├── SelectSafe.tsx            # Safe selection interface
│   │   └── Setup.tsx                 # Lockler creation wizard
│   │
│   ├── types/                        # Additional type definitions
│   │   ├── contracts.ts
│   │   └── window.d.ts               # Browser globals
│   │
│   ├── App.tsx                       # Root component with routing
│   └── main.tsx                      # Entry point
│
└── docs/
    └── technical/                    # Technical documentation
        ├── project-structure.md      # This file
        ├── contract-interactions.md  # Contract architecture & C4 diagrams
        └── sequences.md              # Sequence diagrams for user actions
```

## Core Data Types

### Chain Configuration

```typescript
interface Chain {
  id: number;                          // Chain ID (1 = Mainnet, 100 = Gnosis)
  name: string;                        // Human-readable name
  rpcUrl: string;                      // RPC endpoint
  blockExplorer: string;               // Block explorer URL
  nativeCurrency: NativeCurrency;      // Native token details
  contracts: ChainContracts;           // Contract addresses
  locklerSubgraphEndpoint: string;     // Subgraph API URL
}

interface ChainContracts {
  safeProxyFactory: string;            // 0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67
  safeSingleton: string;               // 0x41675C099F32341bf84BFc5382aF534df5C7461a
  fallbackHandler: string;             // 0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99
  moduleProxyFactory: string;          // 0x000000000000aDdB49795b0f9bA5BC298cDda236
  realityMasterCopy: string;           // 0x4e35DA39Fa5893a70A40Ce964F993d891E607cC0
  ddhAddress: string;                  // 0x0961F418E0B6efaA073004989EF1B2fd1bc4a41c
  safeMultisend: string;               // 0x40A2aCCbd92BCA938b02010E17A5b8929b49130D
  defaultOracle: string;               // Reality.eth (differs by chain)
  defaultArbitrator: string;           // Kleros ArbitratorProxy (differs by chain)
}
```

### Module Configuration

```typescript
interface SetupParams {
  owner: string;                       // Initial owner (DDH during deployment)
  avatar: string;                      // Safe address (avatar = target)
  target: string;                      // Safe address (executes transactions)
  oracle: string;                      // Reality.eth oracle address
  timeout: number;                     // Challenge window (seconds)
  cooldown: number;                    // Post-answer wait period (seconds)
  expiration: number;                  // Answer validity window (seconds, 0 = none)
  bond: string;                        // Minimum bond requirement (wei)
  templateId: number;                  // Question template ID (0 = first)
  arbitrator: string;                  // Kleros ArbitratorProxy address
}
```

### Transaction Types

```typescript
interface ProposalTransaction {
  to: string;                          // Recipient address
  value: string;                       // Native token amount (wei)
  data: string;                        // Call data (0x for transfers)
  operation: number;                   // 0 = CALL, 1 = DELEGATECALL
  type?: TransactionType;              // UI metadata
  justification?: {                    // Proposal evidence
    title: string;
    description: string;
  };
}

type TransactionType = "native" | "erc20" | "erc721" | "custom";

interface MultiSendTx {
  operation: number;                   // Always 0 (CALL) for multisend
  to: string;                          // Target contract
  value: string;                       // ETH value (wei)
  data: string;                        // Encoded function call
}
```

### Safe Transaction

```typescript
interface SafeTransaction {
  to: string;                          // Target address
  value: string;                       // ETH value (wei)
  data: string;                        // Call data
  operation: number;                   // 0 = CALL, 1 = DELEGATECALL
  safeTxGas: string;                   // Gas limit for Safe execution
  baseGas: string;                     // Gas for pre/post processing
  gasPrice: string;                    // Gas price (0 for no refund)
  gasToken: string;                    // Token for gas payment (0x0 = ETH)
  refundReceiver: string;              // Refund recipient (0x0 = none)
  nonce: string;                       // Safe transaction nonce
}
```

### Escrow Terms

```typescript
interface EscrowContractTerms {
  title: string;                       // Contract title
  description: string;                 // Markdown-formatted terms
  type: "p2p" | "grant";              // Escrow mode
  createdAt: number;                   // Unix timestamp
  bond?: string;                       // Minimum bond (optional)
  timeout?: number;                    // Timeout duration (optional)
  cooldown?: number;                   // Cooldown duration (optional)
  expiration?: number;                 // Expiration period (optional)
}
```

## Key Contract Interfaces

### Safe Proxy Factory

```typescript
// Deploy a new Gnosis Safe
function createProxyWithNonce(
  address singleton,      // safeSingleton address
  bytes memory initializer, // Encoded setup() call
  uint256 saltNonce       // Deterministic salt
) external returns (address proxy);

// Event emitted on deployment
event ProxyCreation(address indexed proxy, address singleton);
```

### Safe (Singleton Implementation)

```typescript
// Initialize Safe proxy
function setup(
  address[] calldata _owners,           // Initial owners
  uint256 _threshold,                   // Signature threshold
  address to,                           // Optional setup contract
  bytes calldata data,                  // Optional setup call
  address fallbackHandler,              // Fallback handler address
  address paymentToken,                 // Payment token (0x0 = ETH)
  uint256 payment,                      // Payment amount
  address payable paymentReceiver       // Payment recipient
) external;

// Execute a Safe transaction
function execTransaction(
  address to,
  uint256 value,
  bytes calldata data,
  Enum.Operation operation,
  uint256 safeTxGas,
  uint256 baseGas,
  uint256 gasPrice,
  address gasToken,
  address payable refundReceiver,
  bytes memory signatures
) external payable returns (bool);

// Module management
function enableModule(address module) external;
function disableModule(address prevModule, address module) external;
function isModuleEnabled(address module) external view returns (bool);
function getModulesPaginated(
  address start,
  uint256 pageSize
) external view returns (address[] memory array, address next);

// Owner management
function addOwnerWithThreshold(address owner, uint256 _threshold) external;
function removeOwner(address prevOwner, address owner, uint256 _threshold) external;
function isOwner(address owner) external view returns (bool);
function getOwners() external view returns (address[] memory);
function getThreshold() external view returns (uint256);

// Transaction utilities
function getTransactionHash(
  address to,
  uint256 value,
  bytes calldata data,
  Enum.Operation operation,
  uint256 safeTxGas,
  uint256 baseGas,
  uint256 gasPrice,
  address gasToken,
  address refundReceiver,
  uint256 _nonce
) public view returns (bytes32);

function nonce() external view returns (uint256);
```

### Module Proxy Factory

```typescript
// Deploy a minimal proxy of a module
function deployModule(
  address masterCopy,     // Module implementation address
  bytes memory initializer, // Encoded setUp() call
  uint256 saltNonce       // Deterministic salt
) external returns (address proxy);

// Event emitted on deployment
event ModuleProxyCreation(
  address indexed proxy,
  address indexed masterCopy
);
```

### Reality Module (Zodiac)

```typescript
// Initialize module
function setUp(bytes memory initializeParams) public;

// Proposal management
function addProposal(
  string memory proposalId,  // IPFS CID
  bytes32[] memory txHashes  // Transaction hashes
) external;

function buildQuestion(
  string memory proposalId,
  bytes32[] memory txHashes
) public view returns (string memory);

// Transaction execution
function executeProposalWithIndex(
  string memory proposalId,
  bytes32[] memory txHashes,
  address to,
  uint256 value,
  bytes memory data,
  Enum.Operation operation,
  uint256 txIndex
) public;

// Transaction hash computation
function getTransactionHash(
  address to,
  uint256 value,
  bytes memory data,
  Enum.Operation operation,
  uint256 nonce
) public view returns (bytes32);

// State queries
function executedProposalTransactions(
  bytes32 questionHash,
  bytes32 txHash
) external view returns (bool);

function questionIds(bytes32 questionHash) external view returns (bytes32);

// Configuration getters
function oracle() external view returns (address);
function template() external view returns (uint256);
function minimumBond() external view returns (uint256);
function questionTimeout() external view returns (uint32);
function questionCooldown() external view returns (uint32);
function answerExpiration() external view returns (uint32);
function arbitrator() external view returns (address);
```

### DDH (Designated Dispute Helper)

```typescript
// Deploy module and register template atomically
function deployWithEncodedParams(
  address factory,              // moduleProxyFactory
  address masterCopy,           // realityMasterCopy
  bytes calldata initParams,    // Encoded SetupParams
  uint256 saltNonce,            // Deterministic salt
  address realityOracle,        // Reality.eth oracle
  string calldata templateContent, // Question template
  address finalModuleOwner      // Safe address (future owner)
) external returns (address moduleAddress);
```

### Multisend

```typescript
// Execute multiple transactions atomically
function multiSend(bytes memory transactions) public payable;

// Transaction encoding format:
// [operation (1 byte)][to (20 bytes)][value (32 bytes)]
// [dataLength (32 bytes)][data (dataLength bytes)]
// Repeat for each transaction
```

### Reality.eth Oracle

```typescript
// Create a question
function askQuestionWithMinBond(
  uint256 template_id,
  string memory question,
  address arbitrator,
  uint32 timeout,
  uint32 opening_ts,
  uint256 nonce,
  uint256 min_bond
) public payable returns (bytes32);

// Submit an answer
function submitAnswer(
  bytes32 question_id,
  bytes32 answer,
  uint256 max_previous
) external payable;

// Query functions
function getMinBond(bytes32 question_id) external view returns (uint256);
function getBond(bytes32 question_id) external view returns (uint256);
function getBestAnswer(bytes32 question_id) external view returns (bytes32);
function getFinalAnswer(bytes32 question_id) external view returns (bytes32);
function isFinalized(bytes32 question_id) external view returns (bool);
function isPendingArbitration(bytes32 question_id) external view returns (bool);
```

### Kleros ArbitratorProxy

```typescript
// Request arbitration
function requestArbitration(
  bytes32 questionId,
  uint256 maxPrevious
) external payable returns (uint256);

// Query arbitration fee
function getDisputeFee(bytes32 questionId) external view returns (uint256);
```

## Key Utility Functions

### Module Encoding (`src/lib/moduleUtils.ts`)

```typescript
// Encode module setup parameters
function encodeSetupParams(params: SetupParams): string;

// Create setUp() calldata
function createSetUpCalldata(initializerParams: SetupParams): string;

// Encode multisend transaction
function encodeMultiSendTx(tx: MultiSendTx): string;

// Format EIP-1271 signature for Safe
function formatSignature(signerAddress: string): string;

// Prepare Safe for transaction signing
function prepareSafeTransaction(
  provider: BrowserProvider,
  safeAddress: string
): Promise<SafeTransactionPreparation>;
```

### Web3 Utilities (`src/lib/web3.ts`)

```typescript
// Deploy a new Safe
async function deploySafe(
  provider: BrowserProvider,
  owners: string[],
  threshold: number,
  chainId: number
): Promise<string>; // Returns Safe address

// Create Safe setup initializer
function createSafeSetupInitializer(
  owners: string[],
  threshold: number,
  chainId: number
): string;

// Find and validate Reality Module
async function getRealityModulesForSafe(
  provider: BrowserProvider,
  safeAddress: string,
  chainId: number
): Promise<string | null>; // Returns module address or null
```

### Deployment Orchestration (`src/lib/deployment.ts`)

```typescript
// Deploy Reality Module atomically
async function deployRealityModule(
  provider: BrowserProvider,
  safeAddress: string,
  setupParams: SetupParams,
  chainId: number
): Promise<string>; // Returns module address
```

### Transaction Execution (`src/lib/transactions.ts`)

```typescript
// Execute an approved transaction
async function handleExecuteTransaction(
  provider: BrowserProvider,
  realityModuleAddress: string,
  questionData: any,
  chainId: number,
  txIndex: number
): Promise<void>;
```

### IPFS Integration (`src/lib/ipfs.ts`)

```typescript
// Upload data to IPFS
async function uploadToIPFS(data: any): Promise<string>; // Returns CID

// Download from IPFS
async function downloadFromIPFS<T>(cid: string): Promise<T>;
```

## Security Model

### Safe Ownership
- **Initial:** User-controlled owners, threshold = 1
- **After Module:** Module added as owner, threshold = 2
- **Protection:** Requires both module (Reality.eth) AND user signature for standard transactions

### Module Permissions
- Module is both an **owner** (can sign) and **enabled module** (can call `execTransactionFromModule`)
- Module can only execute transactions from approved proposals
- Proposals require Reality.eth question to finalize with "Yes" answer

### Bond Economics
- First answer: Must meet minimum bond
- Subsequent answers: Must be ≥ 2x previous bond
- Winner receives loser's bond as reward
- Economic incentive for truthful answers

### Arbitration Safety
- Kleros provides final, binding resolution
- Arbitrator decision overrides oracle
- Prevents bond escalation wars
- Protects against collusion

## Development Notes

### Building Transaction Data

Native transfer:
```typescript
{ to: recipient, value: amount, data: "0x", operation: 0 }
```

ERC-20 transfer:
```typescript
{
  to: tokenAddress,
  value: "0",
  data: erc20Interface.encodeFunctionData("transfer", [recipient, amount]),
  operation: 0
}
```

ERC-721 transfer:
```typescript
{
  to: nftAddress,
  value: "0",
  data: erc721Interface.encodeFunctionData("transferFrom", [from, to, tokenId]),
  operation: 0
}
```

### Computing Transaction Hash

Transaction hashes MUST match between proposal and execution:
```typescript
const hash = await realityModule.getTransactionHash(
  to,
  value,
  data,
  operation,
  nonce  // Use Safe's current nonce at proposal time!
);
```

### Multisend Encoding

For atomic deployment (enable module + add owner):
```typescript
const txs = [
  { operation: 0, to: module, value: "0", data: enableData },
  { operation: 0, to: safe, value: "0", data: addOwnerData }
];
const encoded = encodeMultiSendTx(txs);
await safe.execTransaction(
  multisendAddress,
  "0",
  encoded,
  1,  // DELEGATECALL
  ...
);
```

### IPFS CID Format

All IPFS content uses **base58btc CIDv0** for compatibility:
- Question templates reference: `{CID}`
- Transaction arrays stored at CID
- Contract terms stored at CID
- Frontend displays clickable IPFS gateway links

---

This structure enables Lockler to function as a decentralized, trustless escrow system with social consensus (Reality.eth), judicial escalation (Kleros), and secure execution (Gnosis Safe + Reality Module).
