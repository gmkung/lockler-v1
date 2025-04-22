export const ERC721_ABI = [
  // Transfer functions
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)",
  
  // View functions
  "function balanceOf(address owner) view returns (uint256 balance)",
  "function ownerOf(uint256 tokenId) view returns (address owner)",
  "function tokenURI(uint256 tokenId) view returns (string memory)",
  "function name() view returns (string memory)",
  "function symbol() view returns (string memory)",
  
  // Approval functions
  "function approve(address to, uint256 tokenId)",
  "function getApproved(uint256 tokenId) view returns (address operator)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",

  // Events
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)"
]; 