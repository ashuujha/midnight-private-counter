import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import type { ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { fromHex, toHex } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import {
  Binding,
  type FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
  type TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import {
  createProofProvider,
  type MidnightProviders,
  type ProofProvider,
  type UnboundTransaction,
} from '@midnight-ntwrk/midnight-js-types';
import * as Counter from '../../managed/counter/contract/index.js';
import { inMemoryPrivateStateProvider } from '../in-memory-private-state-provider';
import { getErrorMessage } from '../utils/errors';

export const COUNTER_PRIVATE_STATE_ID = 'counterPrivateState';
export type CounterPrivateStateId = typeof COUNTER_PRIVATE_STATE_ID;
export type CounterCircuitKeys = 'increment';

type CounterPrivateState = {
  readonly privateIncrement: bigint;
};

type CounterProviders = MidnightProviders<CounterCircuitKeys, CounterPrivateStateId, CounterPrivateState>;

const runStage = async <T>(label: string, operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    const detail = getErrorMessage(error) || 'The service returned an unknown error';
    throw new Error(`${label}: ${detail}`, { cause: error });
  }
};

const witnesses = {
  privateIncrement(context: { privateState: CounterPrivateState }): [CounterPrivateState, bigint] {
    return [context.privateState, context.privateState.privateIncrement];
  },
};

export const compiledCounterContract = CompiledContract.make('private-counter', Counter.Contract).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets('./managed/counter'),
);

const randomAllowedIncrement = (): bigint => {
  const randomByte = crypto.getRandomValues(new Uint8Array(1))[0];
  return BigInt((randomByte % 10) + 1);
};

const createProviders = async (
  connectedAPI: ConnectedAPI,
  networkId: string,
): Promise<CounterProviders> => {
  setNetworkId(networkId);

  const configuration = await runStage('Reading Lace network configuration failed', () =>
    connectedAPI.getConfiguration(),
  );
  if (configuration.networkId !== networkId) {
    throw new Error(`Network mismatch: Lace is on ${configuration.networkId}, but this dApp requires ${networkId}.`);
  }

  const shieldedAddresses = await runStage('Reading Lace shielded addresses failed', () =>
    connectedAPI.getShieldedAddresses(),
  );
  const zkConfigProvider = new FetchZkConfigProvider<CounterCircuitKeys>(window.location.origin, fetch.bind(window));
  const proofServerUrl = import.meta.env.VITE_PROOF_SERVER_URL?.trim();
  let proofProvider: ProofProvider;
  if (proofServerUrl) {
    proofProvider = httpClientProofProvider(proofServerUrl, zkConfigProvider);
  } else {
    const provingProvider = await runStage('Initializing Lace proving failed', () =>
      connectedAPI.getProvingProvider(zkConfigProvider.asKeyMaterialProvider()),
    );
    proofProvider = createProofProvider(provingProvider);
  }

  return {
    privateStateProvider: inMemoryPrivateStateProvider<CounterPrivateStateId, CounterPrivateState>(),
    zkConfigProvider,
    proofProvider: {
      proveTx: (transaction, config) => runStage('Proof service request failed', () =>
        proofProvider.proveTx(transaction, config),
      ),
    },
    publicDataProvider: indexerPublicDataProvider(configuration.indexerUri, configuration.indexerWsUri),
    walletProvider: {
      getCoinPublicKey: () => shieldedAddresses.shieldedCoinPublicKey,
      getEncryptionPublicKey: () => shieldedAddresses.shieldedEncryptionPublicKey,
      balanceTx: async (transaction: UnboundTransaction): Promise<FinalizedTransaction> => {
        return runStage('Lace transaction balancing failed', async () => {
          const balanced = await connectedAPI.balanceUnsealedTransaction(toHex(transaction.serialize()));
          return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
            'signature',
            'proof',
            'binding',
            fromHex(balanced.tx),
          );
        });
      },
    },
    midnightProvider: {
      submitTx: async (transaction: FinalizedTransaction): Promise<TransactionId> => {
        return runStage('Lace transaction submission failed', async () => {
          await connectedAPI.submitTransaction(toHex(transaction.serialize()));
          return transaction.identifiers()[0];
        });
      },
    },
  };
};

const assertWalletReady = async (connectedAPI: ConnectedAPI, networkId: string): Promise<void> => {
  const connection = await runStage('Reading Lace connection status failed', () =>
    connectedAPI.getConnectionStatus(),
  );
  if (connection.status !== 'connected' || connection.networkId !== networkId) {
    throw new Error(`Network mismatch. Reconnect Lace to ${networkId}.`);
  }

  const dust = await runStage('Reading Lace DUST balance failed', () =>
    connectedAPI.getDustBalance(),
  );
  if (dust.cap <= 0n) {
    throw new Error(
      'Lace reports no DUST generation registration. Open Lace → Midnight → Generate tDUST, review and confirm the registration, wait for wallet sync, then reconnect.',
    );
  }
  if (dust.balance <= 0n) {
    throw new Error(
      'Lace reports a zero DUST balance. tNIGHT cannot pay transaction fees directly. Wait for the tDUST tank in Lace to become positive, then reconnect.',
    );
  }
};

export type CounterTransactionResult = {
  readonly txId: string;
  readonly blockHeight: string;
};

export const callIncrementCircuit = async (
  connectedAPI: ConnectedAPI,
  networkId: string,
  contractAddress: string,
  onProofStart?: () => void,
): Promise<CounterTransactionResult> => {
  if (!/^[0-9a-fA-F]{64}$/.test(contractAddress)) {
    throw new Error('The Preprod contract address is missing or invalid.');
  }

  await assertWalletReady(connectedAPI, networkId);

  const providers = await createProviders(connectedAPI, networkId);
  const address = contractAddress as ContractAddress;
  providers.privateStateProvider.setContractAddress(address);

  // The private value is created here, kept only in memory, and never returned
  // to React. Only the deliberately disclosed Boolean result reaches the ledger.
  const privateState: CounterPrivateState = { privateIncrement: randomAllowedIncrement() };
  const deployed = await runStage('Loading the Preprod contract failed', () =>
    findDeployedContract(providers, {
      contractAddress: address,
      compiledContract: compiledCounterContract,
      privateStateId: COUNTER_PRIVATE_STATE_ID,
      initialPrivateState: privateState,
    }),
  );

  onProofStart?.();
  const transaction = await runStage('Proving or submitting the transaction failed', () =>
    deployed.callTx.increment(),
  );

  return {
    txId: transaction.public.txId,
    blockHeight: transaction.public.blockHeight.toString(),
  };
};
