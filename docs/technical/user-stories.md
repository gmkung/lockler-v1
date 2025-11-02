# Lockler User Personas & Journeys

Comprehensive guide to user types, goals, and workflows within the Lockler platform.

---

## Personas Overview

Lockler serves multiple user types across different stages of conditional payment workflows: **Payers/Granters**, **Payees/Grantees**, **Random Community Members**, **Grant Managers**, **Freelancers**, **Clients**, and **Arbitrators**.

---

## Core Personas

### 1. Payers / Granters

Organizations or individuals funding work, grants, or conditional payments control a Safe and want objective, reviewable conditions for releasing funds. Their primary goal is disbursing funds only when conditions are met while gaining transparent review and dispute controls through automated multisig and oracle mechanisms. They want protection against fraud and reduced manual verification overhead but struggle with ambiguity around deliverables, manual verification burdens, risk of premature payments, difficulty enforcing complex conditions, and lack of transparent dispute resolution.

They use Lockler for paying freelancers with milestone-based releases, distributing grants with completion criteria, escrow for purchases with delivery conditions, and bounty programs requiring proof-of-work. These users need medium to high technical proficiency since they must understand Safe multisig and oracle concepts. When evaluating Lockler, they prioritize security guarantees through Safe multisig, arbitration options via Kleros, cost considerations including bond requirements and gas fees, ease of setup, and flexibility of terms.

---

### 2. Payees / Grantees

Builders, contractors, and grantees seek payment releases tied to transparent milestones. They want clear and fair payment terms while demonstrating completion with verifiable evidence, reducing delays, getting paid promptly when conditions are met, and having recourse against unfair denials. However, they face unclear expectations and moving goalposts, opaque approval processes, delayed payouts, no protection against bad-faith denials, and difficulty proving work completion.

They use Lockler for freelancing (dev work, design, content), grant applications (research, open source), service delivery with escrow protection, and milestone-based projects. Since they need simple interfaces, their technical proficiency ranges from low to medium. They care most about speed to payment, fairness of disputes, clarity of terms, evidence submission processes, and bond affordability.

---

### 3. Random Community Members

External reviewers verify requests, provide challenges, or support correct outcomes to improve payment integrity through bond staking incentives. They help surface correct outcomes while earning rewards by participating in Reality Oracle, contributing to platform integrity, and building reputation as reliable reviewers.

They encounter challenges including low-signal evidence, ambiguous terms difficult to enforce, insufficient incentives for thorough review, and slashing risk when assessments prove wrong. They participate by validating grant applications, challenging fraudulent requests, vouching for legitimate payouts, and participating in Reality Oracle consensus. With medium to high technical proficiency required to understand oracle mechanics, they evaluate opportunities based on term clarity, evidence quality, bond requirements versus potential rewards, and time investment.

---

### 4. Grant Managers

DAOs, foundations, or organizations manage grant programs by creating Grant Locklers with public terms that applicants can claim from. They aim to automate distribution at scale while ensuring transparent and objective evaluation, reducing administrative overhead, preventing fraud, and building applicant community trust. However, they struggle with manual review bottlenecks, subjective decision-making leading to disputes, lack of approval transparency, difficulty tracking outcomes, and high operational costs.

They deploy Lockler for open source development bounties, research grants with milestone payments, community project funding, bug bounty programs, and public goods funding. High technical proficiency is required since they need to understand Safe, modules, and oracles. They focus on distribution scalability, term flexibility, arbitration quality, auditability and transparency, and cost per grant disbursement.

---

### 5. Freelancers / Service Providers (P2P Sender)

Independent workers provide services in exchange for payment by initiating P2P Locklers and proposing payment releases upon work completion. They want payment commitment secured upfront while protecting against non-payment, automating payment upon milestone completion, having clear dispute resolution, and maintaining professional reputation. They deal with clients refusing payment after delivery, scope creep without compensation, payment delays, lack of escrow protection, and unfair dispute processes.

They use Lockler for software development contracts, design and creative services, content creation and marketing, consulting, and fixed-scope project work. Needing low to medium technical proficiency for simple setup, they prioritize payment protection guarantees, disbursement speed, dispute fairness, setup simplicity, and gas costs.

---

### 6. Clients / Buyers (P2P Receiver)

Individuals or businesses purchase services or goods via P2P escrow, funding Locklers created by service providers and approving payment upon satisfactory delivery. They want work completion ensured before payment while having recourse for substandard deliverables, understanding transparent terms, accessing fair dispute processes, and minimizing escrow costs.

They worry about paying upfront without protection, service providers disappearing mid-project, difficulty proving non-completion, opaque escrow terms, and high fees. They use Lockler when hiring freelancers, purchasing digital goods, commissioning creative work, contracting project-based work, and completing marketplace transactions. Needing very simple interfaces (low technical proficiency), they evaluate based on ease of use, fraud protection, arbitration quality, cost, and speed.

---

### 7. Arbitrators (Kleros Participants)

Kleros court jurors vote on disputed payment requests by reviewing evidence and terms to determine if conditions have been met. They aim to vote accurately for earning rewards while maintaining juror reputation, contributing to fair dispute resolution, maximizing coherence with other jurors, and minimizing time per case.

They encounter ambiguous contract terms, insufficient evidence, complex technical disputes, time constraints, and stake-losing risk. They participate in resolving freelance work disputes, validating grant milestone completion, reviewing payment term compliance, and interpreting contract language. With medium to high technical proficiency required for understanding Kleros mechanics, they assess cases based on evidence clarity, potential rewards versus stake at risk, case complexity, expertise alignment, and time commitment.

---

## User Journeys

### Journey 1: Set up a Lockler to Pay Someone

**Audience**: Payers / Granters, Clients, Grant Managers

**Scenario**: A client wants to hire a freelancer and set up milestone-based payments with escrow protection.

**Steps**:

1. **Connect wallet and select chain** - The user opens the Lockler app and connects their Web3 wallet (MetaMask, WalletConnect, or similar), then selects their preferred chain between Ethereum Mainnet or Gnosis Chain based on gas cost preferences and where they hold funds.

2. **Deploy Safe (multisig)** - The Safe is automatically deployed with owners configured based on escrow mode (**PRESET - automatic**). P2P mode creates 2 owners (user and counterparty) with initial threshold of 1, while Grant mode creates 1 owner (user only) with threshold 1. The user signs the Safe deployment transaction. The threshold automatically changes to 2 when the Reality Module is enabled, as the module itself becomes an owner.

3. **Configure Lockler module** - The Oracle (Reality v3 address) and Arbitrator (Kleros court address) are automatically selected based on the chosen chain (**PRESET - hardcoded**). The user can then configure timing parameters with sensible defaults (**PRESET but configurable**): question bond defaults to 0.1 ETH/xDAI but can be set to any amount, timeout defaults to 1 day (challenge window), cooldown defaults to 1 hour (waiting period after answer before execution), and expiration defaults to 7 days (answer validity window, can be set to 0 for no expiration).

4. **Select escrow mode** - In P2P Mode, the user enters the counterparty address (typically the freelancer) and selects their role as either Sender or Receiver. In Grant Mode, no counterparty is needed as it provides open access for applicants.

5. **Draft contract terms** - The user writes clear, objective release conditions such as "Payment released upon delivery of 3 logo design concepts in PNG format by April 30th", defining a title and detailed description with Markdown formatting supported for structured terms.

6. **Add proposed transactions** - The user selects the transaction type (Native ETH, ERC-20 token, ERC-721 NFT, or Custom), enters the recipient address (usually the freelancer), specifies the amount and token, and adds justification with both title and description. Multiple transactions can be added for milestone-based payment structures.

7. **Deploy module and fund Safe** - After reviewing all settings, the user signs the deployment transaction for the Reality Module which enables the module on the Safe, then transfers funds to the Safe address to establish the escrow balance.

8. **Share Lockler details** - The user copies the Safe address and shares it with the freelancer, optionally sharing the IPFS link to the full terms for reference.

**Outcome**: The funded escrow is ready and operational, allowing the freelancer to propose payment release upon completing the agreed work.

---

### Journey 2: Set up a Lockler to Request Payment

**Audience**: Payees / Grantees, Freelancers

**Scenario**: A freelancer has completed work and wants to request milestone payment from their client's Lockler.

**Steps**:

1. **Connect wallet and navigate to Lockler** - The freelancer connects their wallet using the same address specified in the Lockler terms, selects the correct chain matching the Lockler deployment, and enters the Safe address or selects it from their "My Locklers" list.

2. **Review Lockler details** - They view the contract terms and conditions to confirm requirements have been met, check the security status (module validation), and review any existing proposals to understand the current state.

3. **Propose transaction** - The freelancer clicks "Propose Transaction" and selects the transaction type (usually ERC-20 for USDC or Native for ETH), enters their address as recipient and payment amount per agreement, then adds justification with evidence providing a title like "Milestone 1: Logo concepts delivered" and description such as "Delivered 3 logo concepts in PNG format via [link]. Completed on time per terms."

4. **Post bond and create question** - They review the minimum bond requirement (set by Lockler creator during module deployment, e.g., 0.1 ETH), ensure their wallet has sufficient balance, and sign the transaction to post the question to Reality Oracle with status beginning as OPEN.

5. **Submit evidence** - The freelancer attaches proof of work through links, files, or screenshots, adding context for reviewers with evidence stored on IPFS or via external links.

6. **Vouch for proposal (optional)** - If they have additional bond available, they can vouch for their own proposal by submitting answer "YES", which increases proposal credibility and moves question status to ANSWERED.

7. **Wait for review period** - The client and community can review during the timeout period (**PRESET but configurable**: default 1 day). The client can either vouch (approve) or challenge (dispute) the proposal. If no challenges occur, the question automatically finalizes after timeout, moving to FINALIZED status.

8. **Execute transaction** - After the cooldown period passes (**PRESET but configurable**: default 1 hour), the freelancer clicks "Execute" where the system calls the Reality Module to execute the Safe transaction and payment is sent to their address.

**Outcome**: The freelancer receives payment to their wallet with the transaction recorded on-chain with full audit trail.

---

### Journey 3: Checking Correctness and Legality of Payment Requests

**Audience**: Random Community Members, Arbitrators

**Scenario**: A community member wants to review a pending payment request to verify it meets stated terms and decide whether to vouch or challenge.

**Steps**:

1. **Discover pending question** - The reviewer browses the Lockler dashboard or Reality Oracle interface and sees open questions with bonds available, noticing question details and proposed payment amounts.

2. **Read terms and proposal** - They view the question text and referenced IPFS content, reading contract terms including title, description, and conditions while reviewing proposed transactions to understand recipients, amounts, and tokens involved, determining what will execute if approved.

3. **Review evidence** - The reviewer opens linked evidence from IPFS, GitHub, Google Drive, or other sources, comparing deliverables against stated conditions, checking timestamps and completion dates, and evaluating work quality and compliance.

4. **Assess compliance** - They ask themselves: Do deliverables meet stated terms? They check for objective criteria such as dates, formats, and quantities while looking for red flags like mismatched addresses, wrong amounts, or spam.

5. **Vouch or Challenge** - If the proposal is legitimate (Vouch), they click "Vouch" and must post bond equal to 2x the current bond (or minimum bond if no previous answer exists - **minimum set by Lockler creator at deployment**), signing the transaction to submit answer "YES" where question status moves to ANSWERED and they earn potential rewards if answer finalizes. If the proposal is fraudulent (Challenge), they click "Challenge" and must post bond equal to 2x the current bond, cite specific term violations in description, and sign the transaction to submit counter-answer "NO" where the question enters dispute state.

6. **Escalation to arbitration (if needed)** - If dispute occurs, either party can request arbitration by paying the arbitration fee (Kleros court fee - **PRESET - hardcoded**) where the case is escalated to Kleros, arbitrators vote on the correct answer, and the arbitrator decision is final and overrides the oracle.

7. **Resolution** - If their answer wins, they earn bond rewards. If they lose, they lose their bond (slashed). The transaction becomes executable if final answer is YES or not executable if NO.

**Outcome**: The community maintains payment integrity through economic incentives where correct reviewers earn rewards while dishonest actors lose their stake.

---

### Journey 4: Denying Payment

**Audience**: Payers / Granters, Clients

**Scenario**: A client reviews a freelancer's payment request and determines the work does not meet agreed terms, wanting to deny payment.

**Steps**:

1. **Review payment proposal** - The client sees the pending question in their "My Locklers" dashboard, reads the question text and proposed transactions, checks that the recipient address matches the freelancer, and reviews submitted evidence.

2. **Identify non-compliance** - They compare deliverables against original contract terms and document specific deficiencies which might include incomplete work, missing or substandard deliverables, missed deadlines without prior agreement, or wrong formats or specifications.

3. **Challenge payment** - The client clicks "Challenge" and enters bond amount equal to or greater than existing bond, writes clear justification citing specific term violations such as "Only 2 of 3 logo concepts delivered", "Files provided in JPG format, terms specified PNG", or "Missed April 30th deadline without prior agreement", then signs the transaction to post the challenge.

4. **Await freelancer response** - The timeout clock resets (**PRESET but configurable**: default 1 day). The freelancer can accept the challenge (give up and lose bond), counter-challenge with higher bond, or request arbitration.

5. **Arbitration (if escalated)** - If either party requests arbitration and pays Kleros arbitration fee (**PRESET - hardcoded**), Kleros jurors review evidence and terms, vote on the correct answer, and their decision is final.

6. **Outcome** - If challenge wins (final answer NO), the proposed transaction cannot execute, the client retains escrowed funds and receives the freelancer's bond as compensation. If freelancer wins (final answer YES), the transaction becomes executable and the freelancer receives payment plus the client's challenge bond.

7. **Next steps** - If payment is denied, parties can renegotiate or the freelancer can provide corrected deliverables. The freelancer can submit a new proposal with corrections or both parties can mutually close the Lockler.

**Outcome**: The client is protected from paying for substandard work with disputes resolved fairly through arbitration if needed.

---

### Journey 5: Funding a Grant Pool

**Audience**: Grant Managers, Payers / Granters

**Scenario**: A DAO wants to create a public grant program with automated distribution based on objective criteria.

**Steps**:

1. **Plan grant program** - The grant manager defines grant purpose and eligibility, sets objective acceptance criteria, and determines total budget and per-grant amount.

2. **Set up Grant Lockler** - They connect their wallet and select the chain, then deploy a Safe or use an existing one where Oracle and Arbitrator are automatically configured (**PRESET - hardcoded**). They configure timing parameters (**PRESET but configurable**) considering longer timeout for community review (e.g., 2-3 days), higher minimum bond to prevent spam applications (e.g., 0.2 ETH), shorter cooldown for faster distribution (e.g., 30 minutes), and setting expiration based on grant timeline (e.g., 30 days), then select Grant Mode requiring no counterparty.

3. **Draft grant terms** - They write clear, objective conditions such as "Grant pays 1000 USDC for each merged PR that fixes a critical bug" or "Grant pays 500 USDC for each community translation (>90% quality score)", including submission requirements like "Submit PR link and brief description" and "Include evidence of bug severity and fix verification".

4. **Configure payment structure** - The grant manager creates template transactions for reference, sets maximum claim amounts per applicant, and defines eligible tokens and amounts.

5. **Deploy and fund** - They deploy the Reality Module and enable it on the Safe, then transfer grant pool funds to the Safe address (e.g., 10,000 USDC).

6. **Publish grant announcement** - The grant manager shares the Safe address and chain publicly, posts the IPFS link to full terms, announces via social media, forums, and Discord, and provides clear application instructions.

7. **Monitor applications** - Applicants create Reality questions (following Journey 2 steps) while the grant manager or community reviews each application (following Journey 3 steps), vouching for valid applications and challenging invalid ones.

8. **Automated distribution** - Valid applications with finalized YES answers become executable where applicants execute transactions to claim their grants, funds are distributed automatically per terms, and remaining grant pool balance is tracked.

**Outcome**: The decentralized grant program operates autonomously with transparent, objective distribution requiring no manual approvals.

---

### Journey 6: Applying for a Grant

**Audience**: Payees / Grantees, Random Community Members

**Scenario**: A developer sees a public grant Lockler for bug bounties and wants to claim a grant for their fix.

**Steps**:

1. **Discover grant opportunity** - The developer sees a grant announcement on Twitter, Discord, or other channels, clicks the Lockler link or enters the Safe address, and views the grant terms and conditions.

2. **Review requirements** - They read contract terms including eligibility, conditions, and payment amounts, understand the submission format and evidence needed, check the minimum bond requirement (**set by grant creator at deployment, e.g., 0.2 ETH**), and assess if they qualify.

3. **Complete eligible work** - The developer fixes the bug and submits a PR, waits for the PR to be merged, and collects evidence including PR link, commit hash, and maintainer approval.

4. **Submit grant application** - They connect their wallet and navigate to the Grant Lockler, click "Propose Transaction", and add a transaction with their address and grant amount, add justification with title like "Bug bounty claim: Fix memory leak in parser" and description such as "Fixed critical bug #1234. PR merged: [link]. Verified by maintainer [name]", attach evidence links, post required bond (amount set by grant creator), and create the question on Reality Oracle.

5. **Await community review** - The grant manager and community review the submission checking that the PR is merged, the bug was critical severity, and the fix is valid, with review period being the timeout duration (**PRESET but configurable by grant creator**: varies per grant).

6. **Address challenges (if any)** - If challenged, the developer can accept (withdraw application and forfeit bond), defend with higher bond and additional evidence, or request arbitration by paying Kleros fee (**PRESET - hardcoded**).

7. **Claim grant upon approval** - If final answer is YES, the question finalizes after timeout. After waiting for cooldown period (**set by grant creator at deployment, e.g., 30 minutes to 1 hour**), they click "Execute" to claim the grant and receive payment plus their bond back and any rewards if others vouched.

**Outcome**: The developer receives grant payment for verified work while the grant program continues operating for other applicants.

---

### Journey 7: Disputing as a Third Party

**Audience**: Random Community Members, Arbitrators

**Scenario**: A community member notices a fraudulent grant application and wants to challenge it to protect the grant pool.

**Steps**:

1. **Discover suspicious proposal** - The community member browses the Lockler dashboard or Reality Oracle and sees an open question with large payment, noticing red flags such as suspicious address or weak evidence.

2. **Investigate proposal** - They read the question text and contract terms, review submitted evidence, and check the proposal against stated terms, identifying violations such as fake PR link, work not actually completed, duplicate claim, or wrong recipient address.

3. **Gather counter-evidence** - They document specific violations and collect proof of fraud which might include GitHub showing the PR was not merged, the work being claimed by someone else, or a previous identical claim, then prepare clear justification.

4. **Submit challenge** - The community member clicks "Challenge" and must post bond equal to 2x the current bond (bond doubling mechanism enforced by Reality Oracle), writes detailed justification such as "This PR link returns 404 - does not exist", "Claimed work is identical to approved grant #123 by different user", or "GitHub shows PR was rejected, not merged", then signs the transaction to post the challenge.

5. **Escalation** - The original proposer can accept the challenge (withdraw and lose bond), counter-challenge (escalate bond war), or request arbitration by paying Kleros fee (**PRESET - hardcoded**) where if arbitration is requested, they prepare their case for Kleros jurors.

6. **Resolution** - If the challenge wins (final answer NO), the fraudulent transaction cannot execute, the challenger receives the proposer's bond as reward, and the grant pool is protected from theft. If they lose (final answer YES), they lose their challenge bond and the proposer receives payment plus their bond.

**Outcome**: The community member earns rewards for protecting grant integrity while fraudsters are deterred by economic penalties.

---

## Notes

### Best Practices for Terms

Contract terms should be specific rather than vague. Write "Deliver 3 logo concepts in PNG format" instead of just "Deliver logos". Use objective criteria including dates, quantities, and formats rather than subjective quality assessments. Define required evidence upfront such as "Submit PR link" rather than vague requirements like "Show you did the work". Anticipate potential disputes by including clear examples of what would constitute term violations.

### Gas & Cost Optimization

Using Gnosis Chain provides approximately 1000x cheaper gas compared to Ethereum Mainnet. Batching multiple payments in one proposal saves gas costs. Reusing Safes across multiple projects is more efficient than deploying a new Safe for each escrow. Minimizing bond escalations helps control costs since each challenge incurs both gas fees and bond requirements.

### Security Considerations

Always verify Safe ownership before funding to ensure you control the Safe. Check module configuration carefully since incorrect arbitrator or oracle settings create risk. Test with small amounts when creating your first Lockler to understand the process. Review security checks displayed in the UI which show module validation status.

### Understanding Preset vs Configurable

What's always preset (hardcoded in contracts): Oracle addresses (Reality v3, which differs by chain), Arbitrator addresses (Kleros, which differs by chain), Safe infrastructure contracts, and all contract addresses are hardcoded per chain.

What's automatically set based on your escrow mode selection: Safe owners (P2P mode creates 2 owners being you and your counterparty, while Grant mode creates 1 owner being you only) and Safe threshold (starts at 1, automatically becomes 2 when the module is enabled).

What has defaults but you can configure: Question bond amount (defaults to 0.1 ETH/xDAI but commonly customized based on use case), Timeout period (defaults to 1 day), Cooldown period (defaults to 1 hour), and Expiration period (defaults to 7 days, can be set to 0 for no expiration).

What you always configure: Contract title and description, Escrow type (P2P or Grant), Counterparty address (P2P only), and Transaction recipients and amounts.

### Dispute Resolution Tips

Document everything thoroughly because evidence wins disputes. Cite specific terms by referencing exact language from contract terms. Be timely with challenges which must occur within the timeout window (configurable by Lockler creator). Consider arbitration costs carefully since Kleros fees (hardcoded) can exceed small payment amounts.

### Grant Program Tips

Clear acceptance criteria reduce disputes and review time. Requiring bonds serves as an anti-spam measure for public grants (you configure the minimum bond amount at deployment - higher amounts like 0.2-0.5 ETH deter spam while 0.05-0.1 ETH remain accessible). Using milestone structure by breaking large grants into smaller payments makes verification easier. Consider shorter cooldown periods (30 minutes to 1 hour) for faster grant distribution. Active monitoring by reviewing applications promptly helps maintain program quality.

---

## Summary

Lockler serves a diverse user base with different goals, technical proficiency levels, and use cases. The platform balances automation (oracle-based execution) with human oversight (arbitration), decentralization (no admin keys) with usability (guided workflows), security (Safe multisig and bonds) with flexibility (custom terms), and preset infrastructure (hardcoded contracts) with configurable parameters (bonds and timeouts).

Every persona shares the same underlying infrastructure (Safe, Reality Module, and Kleros) but interacts with it through different lenses. Payers focus on conditions and control, Payees focus on evidence and speed, Reviewers focus on accuracy and incentives, and Grant managers focus on scale and automation. The platform succeeds when all personas trust the system to resolve conflicts fairly and execute correctly.
