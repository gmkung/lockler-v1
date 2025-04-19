import { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { retrieveTemplate } from 'reality-kleros-subgraph';
import { getRealityModulesForSafe } from '../lib/web3';
import { DEFAULT_CHAIN_ID } from '../lib/constants';

export function useRealityModule(safeAddress: string) {
  const [moduleState, setModuleState] = useState<{
    address: string | null;
    isLoading: boolean;
    error: string | null;
    modules: {
      address: string;
      isEnabled: boolean;
      isRealityModule: boolean;
      templateId: string;
      oracle: string;
      validationChecks: {
        isMinimalProxy: boolean;
        implementationMatches: boolean;
        isOwner: boolean;
        hasValidThreshold: boolean;
        hasValidOwnerCount: boolean;
        isOnlyEnabledModule: boolean;
      };
    }[];
    templateContent: string | null;
  }>({
    address: null,
    isLoading: true,
    error: null,
    modules: [],
    templateContent: null
  });

  useEffect(() => {
    if (!safeAddress) {
      setModuleState({
        address: null,
        isLoading: false,
        error: "No Safe address provided",
        modules: [],
        templateContent: null
      });
      return;
    }

    const findRealityModule = async () => {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const modules = await getRealityModulesForSafe(provider, safeAddress, DEFAULT_CHAIN_ID);

        // Find the valid Reality Module
        const validModule = modules.find(m => m.isEnabled && m.isRealityModule &&
          m.validationChecks.isMinimalProxy &&
          m.validationChecks.implementationMatches &&
          m.validationChecks.isOwner &&
          m.validationChecks.hasValidThreshold &&
          m.validationChecks.hasValidOwnerCount &&
          m.validationChecks.isOnlyEnabledModule
        );

        let templateContent = null;
        if (validModule) {
          try {
            const template = await retrieveTemplate(
              DEFAULT_CHAIN_ID,
              validModule.oracle,
              parseInt(validModule.templateId)
            );
            
            if (template?.questionText) {
              try {
                // Extract IPFS URI from template
                const ipfsMatch = template.questionText.match(/\/ipfs\/([^?]+)/);
                if (!ipfsMatch) {
                  throw new Error('No valid IPFS URI found in template');
                }
                
                const ipfsPath = ipfsMatch[0];
                const cdnUrl = `https://cdn.kleros.link${ipfsPath}`;
                
                // Fetch JSON from CDN
                const response = await fetch(cdnUrl);
                if (!response.ok) {
                  throw new Error('Failed to fetch agreement from CDN');
                }
                
                const agreement = await response.json();
                templateContent = JSON.stringify(agreement, null, 2);
              } catch (err) {
                console.error('Error fetching agreement:', err);
                templateContent = 'Error: This is not a proper module - Invalid IPFS agreement';
              }
            } else {
              templateContent = null;
            }
          } catch (err) {
            console.error('Error retrieving template:', err);
          }
        }

        if (!validModule) {
          setModuleState({
            address: null,
            isLoading: false,
            error: "No valid Reality Module found for this Safe",
            modules,
            templateContent
          });
          return;
        }

        setModuleState({
          address: validModule.address,
          isLoading: false,
          error: null,
          modules,
          templateContent
        });
      } catch (err) {
        console.error('Error finding Reality Module:', err);
        setModuleState({
          address: null,
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to find Reality Module",
          modules: [],
          templateContent: null
        });
      }
    };

    findRealityModule();
  }, [safeAddress]);

  return moduleState;
} 