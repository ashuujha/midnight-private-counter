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
import type { MidnightProviders, UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import * as Counter from '../../managed/counter/contract/index.js';
import { inMemoryPrivateStateProvider } from '../in-memory-private-state-provider';

export const COUNTER_PRIVATE_STATE_ID = 'counterPrivateState';
export type CounterPrivateStateId = typeof COUNTER_PRIVATE_STATE_ID;
export type CounterCircuitKeys = 'increment';

type CounterPrivateState = {
  readonly privateIncrement: bigint;
};

type CounterProviders = MidnightProviders<CounterCircuitKeys, CounterPrivateStateId, CounterPrivateState>;

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

  const configuration = await connectedAPI.getConfiguration();
  if (configuration.networkId !== networkId) {
    throw new Error(`Network mismatch: Lace is on ${configuration.networkId}, but this dApp requires ${networkId}.`);
  }
  if (!configuration.proverServerUri) {
    throw new Error('Lace has no proof server configured. Add a Preprod proof server in Lace settings.');
  }

  const proofServerUrl = new URL(configuration.proverServerUri);
  const isLoopbackProofServer =
    proofServerUrl.hostname === 'localhost' ||
    proofServerUrl.hostname === '127.0.0.1' ||
    proofServerUrl.hostname === '[::1]';
  if (window.location.protocol === 'https:' && proofServerUrl.protocol === 'http:' && isLoopbackProofServer) {
    throw new Error(
      'Chrome blocks this hosted HTTPS page from reaching the local proof server. Configure an HTTPS proof-server URL in Lace or run the dApp locally.',
    );
  }

  const shieldedAddresses = await connectedAPI.getShieldedAddresses();
  const zkConfigProvider = new FetchZkConfigProvider<CounterCircuitKeys>(window.location.origin, fetch.bind(window));

  return {
    privateStateProvider: inMemoryPrivateStateProvider<CounterPrivateStateId, CounterPrivateState>(),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(proofServerUrl.href, zkConfigProvider),
    publicDataProvider: indexerPublicDataProvider(configuration.indexerUri, configuration.indexerWsUri),
    walletProvider: {
      getCoinPublicKey: () => shieldedAddresses.shieldedCoinPublicKey,
      getEncryptionPublicKey: () => shieldedAddresses.shieldedEncryptionPublicKey,
      balanceTx: async (transaction: UnboundTransaction): Promise<FinalizedTransaction> => {
        const balanced = await connectedAPI.balanceUnsealedTransaction(toHex(transaction.serialize()));
        return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
          'signature',
          'proof',
          'binding',
          fromHex(balanced.tx),
        );
      },
    },
    midnightProvider: {
      submitTx: async (transaction: FinalizedTransaction): Promise<TransactionId> => {
        await connectedAPI.submitTransaction(toHex(transaction.serialize()));
        return transaction.identifiers()[0];
      },
    },
  };
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

  const providers = await createProviders(connectedAPI, networkId);
  const address = contractAddress as ContractAddress;
  providers.privateStateProvider.setContractAddress(address);

  // The private value is created here, kept only in memory, and never returned
  // to React. Only the deliberately disclosed Boolean result reaches the ledger.
  const privateState: CounterPrivateState = { privateIncrement: randomAllowedIncrement() };
  const deployed = await findDeployedContract(providers, {
    contractAddress: address,
    compiledContract: compiledCounterContract,
    privateStateId: COUNTER_PRIVATE_STATE_ID,
    initialPrivateState: privateState,
  });

  onProofStart?.();
  const transaction = await deployed.callTx.increment();

  return {
    txId: transaction.public.txId,
    blockHeight: transaction.public.blockHeight.toString(),
  };
};
