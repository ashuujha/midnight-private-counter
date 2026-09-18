import { useMidnight } from '../hooks/useMidnight';

const compactAddress = (address: string): string =>
  address.length > 30 ? `${address.slice(0, 16)}…${address.slice(-10)}` : address;

export function WalletConnect() {
  const { status, address, error, networkId, connect, disconnect } = useMidnight();
  const connected = status === 'connected' && address !== null;

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
          <div>
            <span className="detail-label">Wallet address</span>
            <strong className="wallet-address" title={address}>
              {compactAddress(address)}
            </strong>
          </div>
          <div>
            <span className="detail-label">Network</span>
            <strong className="network-value">{networkId}</strong>
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
