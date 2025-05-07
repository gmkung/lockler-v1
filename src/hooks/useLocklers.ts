import { useAccount, useChainId } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getChainConfig } from "@/lib/constants";

// Type for the response from the subgraph
interface LocklerResponse {
  locklers: Array<{
    id: string;
    owners: string[];
    safe: {
      id: string;
    };
    realityModules: Array<{
      id: string;
    }>;
    threshold: string;
    createdAt: string;
  }>;
}

// Helper function to make the GraphQL query
const fetchLocklers = async (
  endpoint: string,
  address: string
): Promise<LocklerResponse> => {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        {
          locklers(
            where: { owners_contains: ["${address.toLowerCase()}"] }
            orderBy: createdAt
            orderDirection: desc
          ) {
            id
            owners
            safe {
              id
            }
            realityModules {
              id
            }
            threshold
            createdAt
          }
        }
      `,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch locklers");
  }

  const data = await response.json();
  return data.data;
}

export function useLocklers() {
  const { address } = useAccount();
  const chainId = useChainId();
  
  return useQuery({
    queryKey: ["locklers", chainId, address],
    queryFn: async () => {
      if (!address || !chainId) {
        return { locklers: [] };
      }
      
      const chainConfig = getChainConfig(chainId);
      return fetchLocklers(chainConfig.locklerSubgraphEndpoint, address);
    },
    enabled: !!address && !!chainId,
  });
}
