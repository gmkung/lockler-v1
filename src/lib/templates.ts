
import { TOKENS } from './constants';
import type { EscrowContractTerms, Payment } from './types';
import { DEFAULT_TIMEOUTS, DEFAULT_BOND } from './constants';

type EscrowMode = 'p2p' | 'grant';
type P2PRole = 'sender' | 'receiver';

export const getDefaultContractTerms = (
    mode: EscrowMode,
    signerAddress: string,
    counterpartyAddress: string = "",
    role: P2PRole = 'sender'
): EscrowContractTerms => {
    if (mode === 'p2p') {
        return {
            title: "P2P Escrow Agreement",
            description: "Agreement between two parties for a secure transaction",
            type: 'p2p',
            payments: [
                {
                    address: role === 'sender' ? signerAddress : counterpartyAddress,
                    amount: "0.1",
                    currency: TOKENS.NATIVE.address,
                    role: 'sender'
                },
                {
                    address: role === 'receiver' ? signerAddress : counterpartyAddress,
                    amount: "0.1",
                    currency: TOKENS.NATIVE.address,
                    role: 'receiver'
                }
            ],
            bond: DEFAULT_BOND,
            timeout: DEFAULT_TIMEOUTS.TIMEOUT,
            cooldown: DEFAULT_TIMEOUTS.COOLDOWN,
            expiration: DEFAULT_TIMEOUTS.EXPIRATION,
            createdAt: Date.now()
        };
    } else {
        return {
            title: "Grant Escrow Agreement",
            description: "Agreement for grant distribution",
            type: 'grant',
            payments: [
                {
                    address: signerAddress,
                    amount: "0.1",
                    currency: TOKENS.NATIVE.address,
                    role: 'sender'
                }
            ],
            bond: DEFAULT_BOND,
            timeout: DEFAULT_TIMEOUTS.TIMEOUT,
            cooldown: DEFAULT_TIMEOUTS.COOLDOWN,
            expiration: DEFAULT_TIMEOUTS.EXPIRATION,
            createdAt: Date.now()
        };
    }
};
