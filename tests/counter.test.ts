import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createCircuitContext,
  createConstructorContext,
  sampleContractAddress,
  StateValue as CompactStateValue,
  type CircuitContext,
  type WitnessContext,
} from '@midnight-ntwrk/compact-runtime';
import { StateValue as ProtocolStateValue } from '@midnight-ntwrk/midnight-js-protocol/onchain-runtime';
import {
  Contract,
  ledger,
  pureCircuits,
  type Ledger,
  type Witnesses,
} from '../managed/counter/contract/index.js';

type CounterPrivateState = {
  privateIncrement: bigint;
};

const witnesses: Witnesses<CounterPrivateState> = {
  privateIncrement(
    context: WitnessContext<Ledger, CounterPrivateState>,
  ): [CounterPrivateState, bigint] {
    return [context.privateState, context.privateState.privateIncrement];
  },
};

function createSimulator(secret: bigint): {
  contract: Contract<CounterPrivateState>;
  context: CircuitContext<CounterPrivateState>;
} {
  const contract = new Contract<CounterPrivateState>(witnesses);
  const initial = contract.initialState(
    createConstructorContext({ privateIncrement: secret }, '0'.repeat(64)),
  );

  const context = createCircuitContext(
    sampleContractAddress(),
    initial.currentZswapLocalState,
    initial.currentContractState,
    initial.currentPrivateState,
  );

  return { contract, context };
}

describe('private counter contract', () => {
  it('uses the same StateValue runtime as Midnight.js', () => {
    assert.equal(CompactStateValue, ProtocolStateValue);
  });

  it('validates the private circuit input range', () => {
    assert.equal(pureCircuits.isAllowedIncrement(1n), true);
    assert.equal(pureCircuits.isAllowedIncrement(10n), true);
    assert.equal(pureCircuits.isAllowedIncrement(0n), false);
    assert.equal(pureCircuits.isAllowedIncrement(11n), false);
  });

  it('increments public state after a valid private proof', () => {
    const simulator = createSimulator(7n);

    simulator.context = simulator.contract.impureCircuits.increment(
      simulator.context,
    ).context;
    simulator.context = simulator.contract.impureCircuits.increment(
      simulator.context,
    ).context;

    assert.deepEqual(ledger(simulator.context.currentQueryContext.state), {
      count: 2n,
      lastProofAccepted: true,
    });
  });

  it('rejects invalid witnesses without changing the public ledger', () => {
    for (const secret of [0n, 11n]) {
      const simulator = createSimulator(secret);
      const before = ledger(simulator.context.currentQueryContext.state);
      assert.throws(
        () => simulator.contract.impureCircuits.increment(simulator.context),
        /Private increment must be between 1 and 10/,
      );
      assert.deepEqual(ledger(simulator.context.currentQueryContext.state), before);
    }
  });

  it('keeps the witness value out of public outputs and ledger state', () => {
    const secret = 9n;
    const simulator = createSimulator(secret);
    const execution = simulator.contract.impureCircuits.increment(
      simulator.context,
    );
    const publicLedger = ledger(execution.context.currentQueryContext.state);

    assert.deepEqual(execution.result, []);
    assert.deepEqual(publicLedger, {
      count: 1n,
      lastProofAccepted: true,
    });
    assert.equal('privateIncrement' in publicLedger, false);
    assert.equal(execution.context.currentPrivateState.privateIncrement, secret);
  });
});
