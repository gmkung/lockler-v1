import { TOKENS } from './constants';
import type { EscrowContractTerms } from './types';
import { DEFAULT_TIMEOUTS, DEFAULT_BOND } from './constants';

type EscrowMode = 'p2p' | 'grant';
type P2PRole = 'sender' | 'receiver';

export const getDefaultContractTerms = (
    mode: EscrowMode,
    signerAddress: string,
    counterpartyAddress: string = "",
    role: P2PRole = 'sender'
): EscrowContractTerms => {
    const senderAddress = role === 'sender' ? signerAddress : counterpartyAddress;
    const receiverAddress = role === 'receiver' ? signerAddress : counterpartyAddress;
    
    if (mode === 'p2p') {
        return {
            title: "Freelancer Contract Payment",
            description: `# Freelancer Smart Contract Development Agreement\n\n## Parties\n- **Client**: ${senderAddress}\n- **Freelancer**: ${receiverAddress}\n\n## Project Scope\nDevelopment of a complete web3 application with smart contract integration.\n\n## Payment Milestones\n\n### 1. Frontend Development (40% - 2 ETH)\n- Responsive React/Next.js dashboard\n- Wallet integration components\n- Transaction history visualization\n- User profile management\n- **Deadline**: 2 weeks\n\n### 2. Smart Contract Integration (30% - 1.5 ETH)\n- Wallet connection handling\n- Transaction signing flow\n- Gas optimization\n- Contract interaction hooks\n- **Deadline**: 2 weeks\n\n### 3. Testing & Deployment (30% - 1.5 ETH)\n- Unit test coverage (>90%)\n- Integration testing\n- Security audit fixes\n- Production deployment\n- Documentation\n- **Deadline**: 1 week\n\n## Release Conditions\nEach milestone payment will be released upon:\n1. Code review approval\n2. Passing test coverage\n3. Client acceptance testing\n4. No critical security issues`,
            type: 'p2p',
            bond: DEFAULT_BOND,
            timeout: DEFAULT_TIMEOUTS.TIMEOUT,
            cooldown: DEFAULT_TIMEOUTS.COOLDOWN,
            expiration: DEFAULT_TIMEOUTS.EXPIRATION,
            createdAt: Date.now()
        };
    } else {
        return {
            title: "Web3 Foundation Grant Distribution",
            description: `# Web3 Infrastructure Development Grant\n\n## Total Grant: 100,000 DAI\n\n## Recipients and Deliverables\n\n### ${signerAddress} (40% - 40,000 DAI)\n**Core Protocol Development**\n- Layer 2 scaling implementation\n- Cross-chain bridge protocols\n- Performance optimization\n- **Milestones**:\n  1. Architecture design (10,000 DAI)\n  2. Implementation (20,000 DAI)\n  3. Testing & Integration (10,000 DAI)\n\n### Grantee2 (35% - 35,000 DAI)\n**Security & Auditing**\n- Smart contract security audit\n- Penetration testing\n- Vulnerability assessment\n- **Milestones**:\n  1. Initial audit (15,000 DAI)\n  2. Fix verification (10,000 DAI)\n  3. Final security report (10,000 DAI)\n\n### Grantee3 (25% - 25,000 DAI)\n**Documentation & Tools**\n- Technical documentation\n- API specifications\n- Developer tooling\n- **Milestones**:\n  1. Documentation framework (10,000 DAI)\n  2. Tool development (10,000 DAI)\n  3. Community resources (5,000 DAI)\n\n## Release Requirements\n1. Monthly progress reports\n2. Public repository contributions\n3. Community feedback integration\n4. Milestone demonstration calls`,
            type: 'grant',
            bond: DEFAULT_BOND,
            timeout: DEFAULT_TIMEOUTS.TIMEOUT,
            cooldown: DEFAULT_TIMEOUTS.COOLDOWN,
            expiration: DEFAULT_TIMEOUTS.EXPIRATION,
            createdAt: Date.now()
        };
    }
};
