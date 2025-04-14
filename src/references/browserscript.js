// Only load ethers if it's not already available
if (typeof ethers === 'undefined') {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.9.0/ethers.umd.min.js';
  script.type = 'application/javascript';
  document.head.appendChild(script);

  // Wait for ethers to load
  await new Promise((resolve) => {
    script.onload = resolve;
  });
}

// Initialize provider and signer without declarations
if (typeof window._provider === 'undefined') {
  window._provider = new ethers.BrowserProvider(window.ethereum);
  window._signer = await window._provider.getSigner();
}

await window._provider.send("eth_requestAccounts", []);

// Contract addresses - REPLACE THESE WITH ACTUAL ADDRESSES for Ethereum
const DETERMINISTIC_HELPER_ADDRESS = "0x0961F418E0B6efaA073004989EF1B2fd1bc4a41c"; // Address of DeterministicDeploymentHelper
const MODULE_PROXY_FACTORY_ADDRESS = "0x00000000000DC7F163742Eb4aBEf650037b1f588"; // Address of ModuleProxyFactory
const REALITY_MODULE_MASTER_COPY = "0x4e35DA39Fa5893a70A40Ce964F993d891E607cC0"; // Address of RealityModule master copy
const REALITY_ORACLE_ADDRESS = "0x5b7dD1E86623548AF054A4985F7fc8Ccbb554E2c"; // Address of RealitioV3 oracle
const KLEROS_ARBITRATOR_ADDRESS = "0xf72CfD1B34a91A64f9A98537fe63FBaB7530AdcA"; // Address of Kleros arbitrator

// Parameters - REPLACE THESE WITH ACTUAL VALUES
const SAFE_ADDRESS = "0x2c142C4EbFbe2597d09F584fa35f94Ba69ccd011"; // Address of the Safe klerosexperiments
const TIMEOUT = 86400; // Timeout in seconds (e.g., 1 day)
const COOLDOWN = 3600; // Cooldown in seconds (e.g., 1 hour)
const EXPIRATION = 604800; // Expiration in seconds (e.g., 1 week)
const BOND = ethers.parseEther("0.1"); // Bond amount in wei
const TEMPLATE_QUESTION = "Should this proposal be executed?"; // The question template

// Add network check
const network = await window._provider.getNetwork();
console.log("Connected to network:", network);

// Add contract existence checks
async function checkContract(address, name) {
    const code = await window._provider.getCode(address);
    console.log(`${name} contract at ${address}: ${code === '0x' ? 'Does NOT exist' : 'Exists'}`);
}

await checkContract(DETERMINISTIC_HELPER_ADDRESS, 'DeterministicHelper');
await checkContract(MODULE_PROXY_FACTORY_ADDRESS, 'ModuleProxyFactory');
await checkContract(REALITY_MODULE_MASTER_COPY, 'RealityModuleMasterCopy');
await checkContract(SAFE_ADDRESS, 'Safe');

// Add parameter logging
console.log("Parameters:", {
    helper: DETERMINISTIC_HELPER_ADDRESS,
    factory: MODULE_PROXY_FACTORY_ADDRESS,
    masterCopy: REALITY_MODULE_MASTER_COPY,
    safe: SAFE_ADDRESS,
    oracle: REALITY_ORACLE_ADDRESS,
    arbitrator: KLEROS_ARBITRATOR_ADDRESS,
    timeout: TIMEOUT,
    cooldown: COOLDOWN,
    expiration: EXPIRATION,
    bond: BOND.toString()
});

// Create the contract instance
const deterministicHelper = new ethers.Contract(
  DETERMINISTIC_HELPER_ADDRESS,
  [
    "function deployWithEncodedParams(address factory, address masterCopy, bytes initParams, uint256 saltNonce, address realityOracle, string templateContent, address finalModuleOwner) returns (address)",
  ],
  window._signer
);

// Log raw parameter values first
console.log("Raw Parameters:", {
    TIMEOUT,
    COOLDOWN,
    EXPIRATION,
    BOND: BOND.toString(),
    templateId: 0
});

// Log the encoded parameters in hex to verify encoding
const initParams = ethers.AbiCoder.defaultAbiCoder().encode(
  [
    "address", // owner
    "address", // avatar
    "address", // target
    "address", // oracle
    "uint32",  // timeout
    "uint32",  // cooldown
    "uint32",  // expiration
    "uint256", // bond
    "uint256", // templateId
    "address"  // arbitrator
  ],
  [
    DETERMINISTIC_HELPER_ADDRESS,
    SAFE_ADDRESS,
    SAFE_ADDRESS,
    REALITY_ORACLE_ADDRESS,
    TIMEOUT,
    COOLDOWN,
    EXPIRATION,
    BOND,
    0,
    KLEROS_ARBITRATOR_ADDRESS,
  ]
);

console.log("Encoded Parameters:", {
    raw: initParams,
    decoded: ethers.AbiCoder.defaultAbiCoder().decode(
        [
            "address", "address", "address", "address",
            "uint32", "uint32", "uint32",
            "uint256", "uint256", "address"
        ],
        initParams
    )
});

// Prepare template content
const templateContent = JSON.stringify({
  type: "bool",
  title: TEMPLATE_QUESTION,
  category: "DAO proposal",
  lang: "en",
});

// Generate a unique salt nonce
const saltNonce = Date.now().toString() + Math.floor(Math.random() * 1000000);

// Now we can log the parameters
console.log("Full deployment parameters:", {
    factory: MODULE_PROXY_FACTORY_ADDRESS,
    masterCopy: REALITY_MODULE_MASTER_COPY,
    initParams: initParams,
    saltNonce,
    realityOracle: REALITY_ORACLE_ADDRESS,
    templateContent,
    finalOwner: SAFE_ADDRESS
});

// Deploy the module
try {
  const tx = await deterministicHelper.deployWithEncodedParams(
    MODULE_PROXY_FACTORY_ADDRESS,
    REALITY_MODULE_MASTER_COPY,
    initParams,
    saltNonce,
    REALITY_ORACLE_ADDRESS,
    templateContent,
    SAFE_ADDRESS // final owner (the Safe)
  );

  console.log("Transaction sent:", tx.hash);
  const receipt = await tx.wait();
  console.log("Transaction confirmed:", receipt);

  // Try to extract the module address from logs
  let moduleAddress = null;
  for (const log of receipt.logs) {
    if (log.topics.length === 3) {
      // ModuleProxyCreation event has 3 topics
      const proxyAddress = "0x" + log.topics[1].substring(26);
      console.log("Module deployed at:", proxyAddress);
      moduleAddress = proxyAddress;
      break;
    }
  }

  if (!moduleAddress) {
    console.log(
      "Could not find module address in logs, but transaction was successful"
    );
  }
} catch (error) {
  console.error("Error deploying Reality Module:", error);
}
