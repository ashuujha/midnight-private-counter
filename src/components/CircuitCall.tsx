import { useState } from 'react';
import { CONTRACT_ADDRESS, useMidnight } from '../hooks/useMidnight';
import { callIncrementCircuit, type CounterTransactionResult } from '../midnight/counter';

type CallPhase = 'idle' | 'joining' | 'proving' | 'submitted';

const compactHash = (value: string): string => `${value.slice(0, 12)}…${value.slice(-10)}`;

const friendlyCircuitError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes('user rejected') || normalized.includes('cancel')) {
    return 'The transaction was cancelled in Lace.';
  }
  if (normalized.includes('hosted https page') && normalized.includes('local proof server')) {
    return 'Chrome blocks the hosted dApp from using a localhost proof server. Set an HTTPS proof-server URL in Lace, reconnect, and try again.';
  }
  if (normalized.includes('proof server')) {
    return 'The proof server is unavailable. Check the proof-server URL in Lace and try again.';
  }
  if (normalized.includes('failed to fetch')) {
    return 'A network request failed. Check the Preprod indexer, proving assets, and proof-server URL, then try again.';
  }
  if (normalized.includes('insufficient') || normalized.includes('dust')) {
    return 'The wallet needs enough tNIGHT and DUST to submit this transaction.';
  }
  if (normalized.includes('network mismatch') || normalized.includes('network id')) {
    return 'Network mismatch. Switch Lace to Preprod, reconnect, and try again.';
  }
  return message || 'The circuit call failed. Check Lace and try again.';
};

export function CircuitCall() {
  const { connectedAPI, status, networkId } = useMidnight();
  const [phase, setPhase] = useState<CallPhase>('idle');
  const [result, setResult] = useState<CounterTransactionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = phase === 'joining' || phase === 'proving';
  const addressReady = /^[0-9a-fA-F]{64}$/.test(CONTRACT_ADDRESS);

  const callCircuit = async (): Promise<void> => {
    if (!connectedAPI) return;

    setPhase('joining');
    setResult(null);
    setError(null);

    try {
      const submitted = await callIncrementCircuit(
        connectedAPI,
        networkId,
        CONTRACT_ADDRESS,
        () => setPhase('proving'),
      );
      setResult(submitted);
      setPhase('submitted');
    } catch (callError) {
      setError(friendlyCircuitError(callError));
      setPhase('idle');
    }
  };

  return (
    <section className="panel circuit-panel" aria-labelledby="circuit-heading">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Step 2</span>
          <h2 id="circuit-heading">Prove &amp; increment</h2>
        </div>
        <span className="privacy-chip">Private by design</span>
      </div>

      <p className="panel-copy">
        A valid private witness advances the public counter by one. The witness is generated in memory and is never rendered.
      </p>

      <div className="privacy-callout">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2 4.5 5.2v5.7c0 5.1 3.2 9.5 7.5 11.1 4.3-1.6 7.5-6 7.5-11.1V5.2L12 2Zm0 4.1a3 3 0 0 1 3 3v1h.6a1 1 0 0 1 1 1v5.1a1 1 0 0 1-1 1H8.4a1 1 0 0 1-1-1v-5.1a1 1 0 0 1 1-1H9v-1a3 3 0 0 1 3-3Zm0 1.7a1.3 1.3 0 0 0-1.3 1.3v1h2.6v-1A1.3 1.3 0 0 0 12 7.8Z" />
        </svg>
        <div>
          <strong>Proved without revealing your input</strong>
          <span>No private value is displayed, logged, or written on-chain.</span>
        </div>
      </div>

      <div className="contract-row">
        <span className="detail-label">Preprod contract</span>
        <code title={CONTRACT_ADDRESS}>
          {addressReady ? compactHash(CONTRACT_ADDRESS) : 'Address required before deployment'}
        </code>
      </div>

      {busy && (
        <div className="proof-progress" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <div>
            <strong>{phase === 'joining' ? 'Loading the Preprod contract…' : 'Generating your zero-knowledge proof…'}</strong>
            <span>{phase === 'proving' ? 'Keep this tab open while Lace prepares and submits the transaction.' : 'Checking the contract state and proving assets.'}</span>
          </div>
        </div>
      )}

      {result && (
        <div className="transaction-result" role="status" aria-live="polite">
          <span className="result-check" aria-hidden="true">✓</span>
          <div>
            <strong>Transaction confirmed on-chain</strong>
            <dl>
              <div>
                <dt>Transaction</dt>
                <dd title={result.txId}>{compactHash(result.txId)}</dd>
              </div>
              <div>
                <dt>Block</dt>
                <dd>{result.blockHeight}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      <button
        className="button button-primary proof-button"
        type="button"
        onClick={() => void callCircuit()}
        disabled={status !== 'connected' || busy || !addressReady}
      >
        {busy ? 'Proof in progress…' : result ? 'Prove another increment' : 'Generate proof & increment'}
      </button>

      {status !== 'connected' && <span className="button-hint">Connect Lace before calling the circuit.</span>}
    </section>
  );
}
