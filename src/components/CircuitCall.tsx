import { useEffect, useRef, useState } from 'react';
import { CONTRACT_ADDRESS, useMidnight } from '../hooks/useMidnight';
import type { CounterTransactionResult } from '../midnight/counter';
import { BrandMark, Icon } from './Icon';
import { CopyButton } from './CopyButton';

type CallPhase = 'idle' | 'joining' | 'proving' | 'submitted';

const compactHash = (value: string): string =>
  `${value.slice(0, 12)}…${value.slice(-10)}`;

const friendlyCircuitError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes('user rejected') || normalized.includes('cancel')) {
    return 'The transaction was cancelled in Lace.';
  }
  if (normalized.includes('proof server')) {
    return 'The proof server is unavailable. Check the proof-server URL in Lace and try again.';
  }
  if (normalized.includes('failed to fetch')) {
    return `${message}. Make sure Lace is fully synced, its proof server is reachable, and then reconnect.`;
  }
  if (
    normalized.includes('no dust generation registration') ||
    normalized.includes('zero dust balance')
  ) {
    return message;
  }
  if (normalized.includes('insufficient') || normalized.includes('dust')) {
    return 'Lace could not pay the transaction fee with the available DUST. Confirm Generate tDUST in Lace, wait for a positive DUST balance and full wallet sync, then reconnect.';
  }
  if (
    normalized.includes('network mismatch') ||
    normalized.includes('network id')
  ) {
    return 'Network mismatch. Switch Lace to Preprod, reconnect, and try again.';
  }
  return message || 'The circuit call failed. Check Lace and try again.';
};

export function CircuitCall() {
  const { connectedAPI, status, networkId, refreshDustBalance } = useMidnight();
  const [phase, setPhase] = useState<CallPhase>('idle');
  const [result, setResult] = useState<CounterTransactionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const callVersion = useRef(0);

  useEffect(() => {
    callVersion.current += 1;
    setPhase('idle');
    setResult(null);
    setError(null);
  }, [connectedAPI]);

  const busy = phase === 'joining' || phase === 'proving';
  const addressReady = /^[0-9a-fA-F]{64}$/.test(CONTRACT_ADDRESS);

  const callCircuit = async (): Promise<void> => {
    if (!connectedAPI) return;

    const version = ++callVersion.current;

    setPhase('joining');
    setResult(null);
    setError(null);

    try {
      const { callIncrementCircuit } = await import('../midnight/counter');
      if (callVersion.current !== version) return;
      const submitted = await callIncrementCircuit(
        connectedAPI,
        networkId,
        CONTRACT_ADDRESS,
        () => {
          if (callVersion.current === version) setPhase('proving');
        },
      );
      if (callVersion.current !== version) return;
      setResult(submitted);
      setPhase('submitted');
      void refreshDustBalance();
    } catch (callError) {
      if (callVersion.current !== version) return;
      setError(friendlyCircuitError(callError));
      setPhase('idle');
    }
  };

  return (
    <section
      className={`panel circuit-panel ${busy ? 'is-proving' : ''} ${result ? 'has-result' : ''}`}
      aria-labelledby="circuit-heading"
      aria-busy={busy}
    >
      <div className="panel-topline">
        <span className="step-label">
          02 <span>/ YOUR MOMENT OF PROOF</span>
        </span>
        <span className="privacy-chip">
          <Icon name="lock" /> ZERO KNOWLEDGE
        </span>
      </div>
      <h3 id="circuit-heading">A secret. A proof. A +1.</h3>
      <p className="panel-copy">
        Prove a hidden value is valid. Move the public counter forward.
      </p>

      <div
        className="proof-journey"
        aria-label="Private input becomes a verified proof and a public increment"
      >
        <div className="journey-node">
          <div className="journey-symbol private-symbol">
            <Icon name="lock" />
          </div>
          <strong>Private input</strong>
          <span>Stays hidden</span>
        </div>
        <div className="journey-connector" aria-hidden="true">
          <span />
        </div>
        <div className="journey-node">
          <div className="journey-symbol proof-symbol">
            <BrandMark />
          </div>
          <strong>Zero-knowledge proof</strong>
          <span>Verified mathematically</span>
        </div>
        <div className="journey-connector" aria-hidden="true">
          <span />
        </div>
        <div className="journey-node">
          <div className="journey-symbol public-symbol">+1</div>
          <strong>Public counter</strong>
          <span>One step forward</span>
        </div>
      </div>

      <div className="privacy-callout">
        <Icon name="lock" />
        <div>
          <strong>Proved without revealing your input</strong>
          <span>
            Your private value is never displayed or written on-chain.
          </span>
        </div>
      </div>
      <div className="contract-row">
        <span className="detail-label">{networkId} CONTRACT</span>
        <code title={CONTRACT_ADDRESS}>
          {addressReady ? compactHash(CONTRACT_ADDRESS) : 'Not configured'}
        </code>
        {addressReady && (
          <CopyButton value={CONTRACT_ADDRESS} label="Copy contract address" />
        )}
      </div>

      {busy && (
        <div className="proof-progress" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <div>
            <strong>
              {phase === 'joining'
                ? 'Preparing your experiment…'
                : 'Generating your zero-knowledge proof…'}
            </strong>
            <span>
              {phase === 'proving'
                ? 'Keep this tab open. Review the transaction in Lace when prompted.'
                : 'Checking your wallet, contract, and proving assets.'}
            </span>
            <div className="progress-track" aria-hidden="true">
              <span />
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="transaction-result" role="status" aria-live="polite">
          <span className="result-check">
            <Icon name="check" />
          </span>
          <div>
            <strong>One more step. Zero secrets revealed.</strong>
            <span className="confirmed-label">
              Transaction confirmed on-chain
            </span>
            <dl>
              <div>
                <dt>Transaction</dt>
                <dd title={result.txId}>
                  {compactHash(result.txId)}
                  <CopyButton value={result.txId} label="Copy transaction ID" />
                </dd>
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
      <div className="panel-action">
        <button
          className="button button-lavender proof-button"
          type="button"
          onClick={() => void callCircuit()}
          disabled={status !== 'connected' || busy || !addressReady}
        >
          <Icon name={result ? 'refresh' : 'spark'} />
          {busy
            ? 'Proof in progress…'
            : result
              ? 'Prove another increment'
              : 'Generate proof & increment'}
          <Icon name="arrow" />
        </button>
        <span className="button-hint">
          {status !== 'connected'
            ? 'Connect your wallet to begin the experiment.'
            : 'A small step for the counter. A big idea for privacy.'}
        </span>
      </div>
    </section>
  );
}
