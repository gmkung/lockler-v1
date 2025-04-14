export const MODULE_PROXY_FACTORY_ABI = [
    {
        inputs: [
            {
                internalType: 'address',
                name: 'masterCopy',
                type: 'address',
            },
            {
                internalType: 'bytes',
                name: 'initializer',
                type: 'bytes',
            },
            {
                internalType: 'uint256',
                name: 'saltNonce',
                type: 'uint256',
            },
        ],
        name: 'deployModule',
        outputs: [
            {
                internalType: 'address',
                name: 'proxy',
                type: 'address',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

export const DDH_ABI = [
    {
        inputs: [
            { name: "factory", type: "address" },
            { name: "masterCopy", type: "address" },
            { name: "initParams", type: "bytes" },
            { name: "saltNonce", type: "uint256" },
            { name: "realityOracle", type: "address" },
            { name: "templateContent", type: "string" },
            { name: "finalModuleOwner", type: "address" }
        ],
        name: "deployWithEncodedParams",
        outputs: [{ name: "realityModuleProxy", type: "address" }],
        stateMutability: "nonpayable",
        type: "function"
    }
] as const;

export const MULTISEND_ABI = [
    {
        inputs: [{ internalType: 'bytes', name: 'transactions', type: 'bytes' }],
        name: 'multiSend',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
] as const;

export const SAFE_ABI = [
    {
        inputs: [{ internalType: "address", name: "module", type: "address" }],
        name: "enableModule",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "value", type: "uint256" },
            { internalType: "bytes", name: "data", type: "bytes" },
            { internalType: "uint8", name: "operation", type: "uint8" },
            { internalType: "uint256", name: "safeTxGas", type: "uint256" },
            { internalType: "uint256", name: "baseGas", type: "uint256" },
            { internalType: "uint256", name: "gasPrice", type: "uint256" },
            { internalType: "address", name: "gasToken", type: "address" },
            { internalType: "address payable", name: "refundReceiver", type: "address" },
            { internalType: "bytes", name: "signatures", type: "bytes" }
        ],
        name: "execTransaction",
        outputs: [{ internalType: "bool", name: "success", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "owner", type: "address" }],
        name: "isOwner",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "getThreshold",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "nonce",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "value", type: "uint256" },
            { internalType: "bytes", name: "data", type: "bytes" },
            { internalType: "uint8", name: "operation", type: "uint8" },
            { internalType: "uint256", name: "safeTxGas", type: "uint256" },
            { internalType: "uint256", name: "baseGas", type: "uint256" },
            { internalType: "uint256", name: "gasPrice", type: "uint256" },
            { internalType: "address", name: "gasToken", type: "address" },
            { internalType: "address", name: "refundReceiver", type: "address" },
            { internalType: "uint256", name: "_nonce", type: "uint256" }
        ],
        name: "getTransactionHash",
        outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "domainSeparator",
        outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        stateMutability: "view",
        type: "function"
    }
] as const; 