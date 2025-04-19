export const REALITY_MODULE_ABI = [
  'function buildQuestion(string memory proposalId, bytes32[] memory txHashes) public pure returns (string memory)',
  'function executedProposalTransactions(bytes32 questionHash, bytes32 txHash) public view returns (bool)',
  'function executeProposalWithIndex(string memory proposalId, bytes32[] memory txHashes, address to, uint256 value, bytes memory data, uint8 operation, uint256 txIndex) public',
  'function getTransactionHash(address to, uint256 value, bytes memory data, uint8 operation, uint256 nonce) public view returns (bytes32)'
]; 