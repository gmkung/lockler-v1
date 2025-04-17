import { ipfs } from "light-curate-data-service";
import { EscrowContractTerms, TemplateData } from "./types";

export const uploadToIPFS = ipfs.uploadToIPFS;
export const uploadJSONToIPFS = ipfs.uploadJSONToIPFS;
export const fetchFromIPFS = ipfs.fetchFromIPFS;

export const uploadContractTerms = async (
  terms: EscrowContractTerms
): Promise<string> => {
  // Add timestamp if not present
  if (!terms.createdAt) {
    terms.createdAt = Date.now();
  }

  // Upload to IPFS and return the CID
  return await uploadJSONToIPFS(terms);
};
