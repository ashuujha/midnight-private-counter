import { useState } from 'react';
import { useMidnight } from '../hooks/useMidnight';
import { CopyButton } from './CopyButton';
import { Icon } from './Icon';

const DUST_SCALE = 1_000_000_000_000_000n;
const formatDust = (value: bigint): string => {
  if (value > 0n && value < DUST_SCALE / 10_000n) return '< 0.0001';
  const whole = (value / DUST_SCALE).toLocaleString('en-US');
  const fraction = (value % DUST_SCALE)
    .toString()
    .padStart(15, '0')
    .slice(0, 4)
    .replace(/0+$/, '');
  return `${whole}${fraction ? `.${fraction}` : ''}`;
};

export function WalletConnect() {
  const {
    status,
    address,
    dustAddress,
    dustBalance,
    error,
    networkId,
    connect,
    disconnect,
    refreshDustBalance,
  } = useMidnight();
  const connected = status === 'connected' && address !== null;
  const [refreshing, setRefreshing] = useState(false);
  const progress =
    dustBalance && dustBalance.cap > 0n
      ? Math.max(
          0,
          Math.min(100, Number((dustBalance.balance * 100n) / dustBalance.cap)),
        )
      : 0;

  const refresh = async () => {
    setRefreshing(true);
    try {
      await refreshDustBalance();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section
      className={`panel wallet-panel ${connected ? 'is-connected' : ''}`}
      aria-labelledby="wallet-heading"
    >
      <div className="panel-topline">
        <span className="step-label">
          01 <span>/ YOUR CONNECTION</span>
        </span>
        <span className={`status-pill ${connected ? 'success' : ''}`}>
          <span className="status-dot" />
          {connected
            ? 'Connected'
            : status === 'connecting'
              ? 'Connecting'
              : 'Disconnected'}
        </span>
      </div>
      <h3 id="wallet-heading">Make yourself at home.</h3>
      <p className="panel-copy">
        Your Lace wallet is your key to the experiment.
      </p>

      {connected ? (
        <div className="wallet-details">
          <div className="address-block">
            <div className="address-label">
              <span>tNIGHT / FAUCET ADDRESS</span>
              <CopyButton value={address} label="Copy faucet address" />
            </div>
            <code className="wallet-address">{address}</code>
          </div>
          <details className="dust-address-details">
            <summary>
              DUST generation address <span>+</span>
            </summary>
            <div className="address-block">
              <code className="wallet-address">
                {dustAddress ?? 'Unavailable'}
              </code>
              <CopyButton value={dustAddress} label="Copy DUST address" />
            </div>
          </details>
          <div className="dust-balance">
            <div className="balance-heading">
              <span className="detail-label">YOUR DUST TANK</span>
              <button
                type="button"
                className="refresh-button"
                onClick={() => void refresh()}
                disabled={refreshing}
                aria-label="Refresh DUST balance"
              >
                <Icon
                  name="refresh"
                  className={refreshing ? 'is-spinning' : ''}
                />
                {refreshing ? 'Refreshing' : 'Refresh'}
              </button>
            </div>
            <div className="balance-value" aria-live="polite">
              {dustBalance ? formatDust(dustBalance.balance) : 'Checking…'}
              <span>tDUST</span>
            </div>
            <meter
              min="0"
              max="100"
              value={progress}
              aria-label="DUST tank capacity"
            />
            <p>
              {!dustBalance
                ? 'Reading your DUST balance…'
                : dustBalance.cap === 0n
                  ? 'Register tNIGHT using Generate tDUST in Lace.'
                  : dustBalance?.balance === 0n
                    ? 'Waiting for DUST to accrue. Keep Lace fully synced.'
                    : 'Ready for a little zero-knowledge magic.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="wallet-empty">
          <div className="wallet-orbit" aria-hidden="true">
            <span className="wallet-orbit-ring" />
            <span className="wallet-orbit-ring inner" />
            <div className="wallet-symbol">
              <Icon name="wallet" />
            </div>
            <i className="orbit-dot dot-one" />
            <i className="orbit-dot dot-two" />
          </div>
          <strong>A connection, on your terms.</strong>
          <p>
            Connect Lace to prove and transact.
            <br />
            Your private input is never displayed.
          </p>
        </div>
      )}

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {status === 'not-installed' && (
        <p className="help-message">
          Lace isn’t detected. Enable the extension, select Midnight {networkId}
          , and reload.{' '}
          <a
            href="https://docs.midnight.network/guides/acquire-tokens"
            target="_blank"
            rel="noreferrer"
          >
            Wallet setup guide <Icon name="external" />
          </a>
        </p>
      )}

      <div className="panel-action">
        <button
          className={
            connected ? 'button button-secondary' : 'button button-primary'
          }
          type="button"
          onClick={connected ? disconnect : () => void connect()}
          disabled={status === 'detecting' || status === 'connecting'}
        >
          <Icon name={connected ? 'disconnect' : 'wallet'} />
          {status === 'detecting'
            ? 'Detecting Lace…'
            : status === 'connecting'
              ? 'Waiting for Lace…'
              : connected
                ? 'Disconnect wallet'
                : 'Connect Lace wallet'}
          {!connected && <Icon name="arrow" />}
        </button>
        <span className="button-hint">
          <span className="tiny-indicator" /> Midnight {networkId}{' '}
          <span className="hint-divider">·</span> You’re always in control
        </span>
      </div>
    </section>
  );
}
