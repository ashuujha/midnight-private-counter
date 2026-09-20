# Product Proposal

## What is the product, and who uses it?

**Midnight Private Counter** is an educational dApp that lets users experience a complete zero-knowledge contract interaction: connect a wallet, prove a condition about a private value, approve a transaction, and see a confirmed public result.

It serves developers learning Compact, students exploring programmable privacy, and workshop organizers who need a small, inspectable example. The problem it addresses is the gap between understanding zero-knowledge proofs in theory and seeing how private inputs, public state, wallet approval, and transaction confirmation work together.

The working Preprod application generates a private integer between `1` and `10` in the browser. Its `increment` circuit proves that the value is within that range, increments the public counter by exactly one, and sets `lastProofAccepted` to `true`. The interface displays the confirmed transaction ID and block height without displaying the witness.

The current product demonstrates private range validation. The generated value is not a verified real-world credential, and the counter measures successful calls rather than unique people. Identity checks, one-person-one-vote rules, and protection against repeated participation are outside this version's scope.

The [live application](https://midnight-private-counter.vercel.app), [source code](https://github.com/ashuujha/midnight-private-counter), and [demo video](https://youtu.be/Xa65AHEurZg) provide the implementation and demonstration evidence.

## Why Midnight specifically?

The product needs a public, verifiable state change without publishing the value that makes the change valid. A conventional transparent contract that accepts the raw value in public transaction input would expose it to observers.

Midnight's Compact model lets this application express the private witness, range constraint, public counter, and deliberate disclosure of the acceptance result within the same contract. The network can verify the proof and accept the counter update without receiving the original witness as public contract input or ledger state. A transparent chain could support a comparable application with additional zero-knowledge infrastructure; Midnight provides a development model built around this separation of private computation and public verification.

The privacy claim is specific: observers can see the counter, acceptance flag, and public transaction metadata, but the application does not publish the exact witness. This does not provide transaction anonymity. The browser and configured proof service process the witness, so a hosted prover and its operator are inside the privacy trust boundary. Wallet balancing and DUST fee preparation also use the wallet's own proving configuration.

## Data Model

| Data Point | Type | Disclosed To |
|------------|------|--------------|
| `count` | Public ledger: `Counter` | Everyone; increases by one for each successful call |
| `lastProofAccepted` | Public ledger: `Boolean` | Everyone; records that the range condition was satisfied |
| Contract address and circuit definition | Public contract metadata and source | Everyone |
| Allowed range, `1 <= value <= 10` | Public circuit constraint | Everyone; the rule itself is not secret |
| `privateIncrement` | Private witness: `Uint<16>`, generated in browser memory | The browser and configured prover; excluded from public contract state and outputs |
| Zero-knowledge proof | Public verification data | Network verifiers and observers; establishes validity without publishing the witness |
| Transaction ID and block height | Public transaction metadata | Everyone; also displayed in the dApp after confirmation |
| Wallet signing keys and recovery material | Private wallet data | The user and their wallet; never requested by this dApp or sent by it to the prover |

## Mainnet Feasibility

A limited educational Mainnet release is a realistic **Level 6 target**, subject to validation and review. The core scope is small: one contract, one state-changing circuit, two public ledger fields, and no application-managed deposits or payouts. The repository already contains a Preprod implementation, automated contract and error-recovery tests, a CI build, a deployed frontend, and a hosted circuit prover.

Before a Mainnet release, the work would be:

1. Validate the selected Mainnet network, compiler, SDK, wallet, and proof-server versions together, then deploy and verify a separate Mainnet contract.
2. Test the complete wallet flow, including DUST fee preparation, approval, submission, and confirmation. A successful hosted circuit proof alone does not establish that wallet balancing works without local services.
3. Establish reliable proving capacity, measure latency and concurrent usage, and document the prover's privacy boundary. The current free demo hosting should not be treated as a production availability guarantee.
4. Review the circuit and client integration, test invalid inputs and repeated calls, and confirm that failures leave public state unchanged and do not leak witness data through logs or error messages.
5. Run usability checks with new users, publish clear setup and fee guidance, and record a complete Mainnet acceptance test before advertising Mainnet support.

The release decision should depend on those checks passing. Broader applications such as credential-based eligibility or unique-participant counting would require additional contract design, trusted input provenance, and replay protection; they are future extensions rather than capabilities claimed by this proposal.
