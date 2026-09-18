# Midnight Private Counter
> A Midnight contract that advances a public counter after proving a private value is within an allowed range.

## Contract Address

| Network | Address |
|---|---|
| Preview | `a63f722b44482e8d825e4fde801b6c39392019a7c3f2138d5d0e3fb2902665fd` |
| Preprod | `[PASTE ADDRESS AFTER DEPLOY]` |

## What This Does

Midnight Private Counter maintains a public on-chain count. To increment it, a user supplies a private number through a Compact witness. The circuit proves that the number is between 1 and 10, increments the public count by one, and records that the range proof succeeded.

The private number does not determine the public increment amount and is never written to the ledger. Observers can verify that a valid private input authorized each state transition without learning the input itself.

## Privacy Model

- What is **PUBLIC** (on-chain, visible to anyone): the `count` value and the `lastProofAccepted` Boolean.
- What is **PRIVATE** (private witness, never on-chain): the `privateIncrement` value supplied locally to the proof-generating circuit.
- What the user **PROVES without revealing**: that the private value is within the inclusive range 1 through 10.

The contract deliberately calls `disclose(accepted)` only for the Boolean range-check result. It does not disclose or return the private witness value.

## Tech Stack

- Midnight network Preview
- Compact language and Compact compiler `0.31.1`
- Compact devtools `0.5.2`
- Node.js v22
- Docker and the Midnight proof server
- TypeScript test suite using Node's test runner

## Prerequisites

- Node.js v22 and npm
- Docker Desktop with the Docker daemon running
- Compact devtools and compiler toolchain `0.31.1`
- Midnight proof-server image available on port `6300`
- A funded Midnight Preview wallet with tNIGHT and generated DUST for deployment

Verify the main tools:

```bash
node --version
docker info
compact --version
compact compile --version
```

## Setup

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd Moonnight
npm install
npm --prefix mn-demo install
```

Install or select the compatible Compact compiler and start the proof server:

```bash
compact update 0.31.1
docker pull midnightnetwork/proof-server
docker run -d -p 6300:6300 midnightnetwork/proof-server
```

Compile the private counter:

```bash
npm run compile
```

Deploy to Preview:

```bash
NODE_OPTIONS="--max-old-space-size=12288" npm run deploy:preview
```

On the first Preview run, fund the printed wallet address through the Preview faucet when prompted. The deploy process resumes after the wallet receives tNIGHT and generates DUST.

## Run Tests

Run all three contract simulator tests:

```bash
npm test
```

The suite verifies private range logic, public state transitions, and that the witness value is absent from public outputs and ledger state.

## Initial Idea

The initial idea was to build a small contract that demonstrates Midnight's privacy model without hiding the state transition itself. A normal public counter reveals every update, while this version requires the caller to prove knowledge of a private number in an allowed range before the count can advance.

This keeps the example easy to understand while still exercising the core Level 1 concepts: public ledger state, a private witness, zero-knowledge circuit logic, and deliberate selective disclosure. The public sees that an accepted proof advanced the counter, but never sees the private value used to authorize it.

## Screenshots

### Successful Compact compilation

![Successful Compact compilation](screenshots/compile-output.png)

### Preview contract deployment

![Preview contract address verified by the indexer](screenshots/contract-address.png)
