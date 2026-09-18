import { useState } from 'react';
import { useMidnight } from '../hooks/useMidnight';

const DUST_SCALE = 1_000_000_000_000_000n;

const formatDust = (value: bigint): string => {
  const whole = value / DUST_SCALE;
  const fraction = (value % DUST_SCALE).toString().padStart(15, '0').replace(/0+$/, '');
  return `${whole}${fraction ? `.${fraction}` : ''} tDUST`;
};

export function WalletConnect() {
  const { status, address, dustAddress, dustBalance, error, networkId, connect, disconnect, refreshDustBalance } = useMidnight();
  const connected = status === 'connected' && address !== null;
  const [copied, setCopied] = useState<'night' | 'dust' | null>(null);

  const copyAddress = async (value: string | null, kind: 'night' | 'dust') => {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section className="panel wallet-panel" aria-labelledby="wallet-heading">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Step 1</span>
          <h2 id="wallet-heading">Connect Lace</h2>
        </div>
        <span className={`status-pill ${connected ? 'success' : ''}`}>
          <span className="status-dot" aria-hidden="true" />
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {connected ? (
        <div className="wallet-details">
          <div className="wallet-address-row">
            <span className="detail-label">tNIGHT / faucet address</span>
            <div className="wallet-address-controls">
              <strong className="wallet-address">{address}</strong>
              <button className="copy-address-button" type="button" onClick={() => void copyAddress(address, 'night')}>
                {copied === 'night' ? 'Copied' : 'Copy faucet address'}
              </button>
            </div>
          </div>
          <div className="wallet-address-row">
            <span className="detail-label">DUST generation address</span>
            <div className="wallet-address-controls">
              <strong className="wallet-address">{dustAddress ?? 'Unavailable'}</strong>
              <button className="copy-address-button" type="button" onClick={() => void copyAddress(dustAddress, 'dust')} disabled={!dustAddress}>
                {copied === 'dust' ? 'Copied' : 'Copy DUST address'}
              </button>
            </div>
          </div>
          <div>
            <span className="detail-label">Network</span>
            <strong className="network-value">{networkId}</strong>
          </div>
          <div>
            <span className="detail-label">DUST available</span>
            <div className="wallet-address-controls">
              <strong className={`network-value ${dustBalance?.balance === 0n ? 'zero-balance' : ''}`}>
                {dustBalance ? formatDust(dustBalance.balance) : 'Checking…'}
              </strong>
              <button className="copy-address-button" type="button" onClick={() => void refreshDustBalance()}>
                Refresh DUST
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="panel-copy">
          Authorize this dApp in Lace to balance and submit your private proof transaction.
        </p>
      )}

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {status === 'not-installed' && (
        <p className="help-message" role="status">
          Lace was not detected. Install or enable the Lace browser extension, select Midnight {networkId}, and reload.
        </p>
      )}

      <button
        className={connected ? 'button button-secondary' : 'button button-primary'}
        type="button"
        onClick={connected ? disconnect : () => void connect()}
        disabled={status === 'detecting' || status === 'connecting'}
      >
        {status === 'detecting' && 'Detecting Lace…'}
        {status === 'connecting' && 'Waiting for Lace…'}
        {!connected && status !== 'detecting' && status !== 'connecting' && 'Connect Lace wallet'}
        {connected && 'Disconnect wallet'}
      </button>
    </section>
  );
}
