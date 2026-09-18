import { CircuitCall } from './components/CircuitCall';
import { WalletConnect } from './components/WalletConnect';
import { CONTRACT_ADDRESS, MIDNIGHT_NETWORK } from './hooks/useMidnight';

export default function App() {
  const contractConfigured = /^[0-9a-fA-F]{64}$/.test(CONTRACT_ADDRESS);

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Midnight Private Counter home">
          <span className="brand-mark" aria-hidden="true">M</span>
          <span>Private Counter</span>
        </a>
        <div className="network-badge">
          <span aria-hidden="true" />
          Midnight {MIDNIGHT_NETWORK}
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-kicker">Zero knowledge, clear outcome</div>
        <h1>Advance the counter.<br /><em>Keep the reason private.</em></h1>
        <p>
          Prove your hidden value is allowed, increment public state, and reveal nothing about the value itself.
        </p>
        <div className="hero-proof">
          <div>
            <span>Public</span>
            <strong>Counter + proof accepted</strong>
          </div>
          <span className="proof-arrow" aria-hidden="true">→</span>
          <div>
            <span>Private</span>
            <strong>Witness value</strong>
          </div>
        </div>
      </section>

      {!contractConfigured && (
        <div className="configuration-banner" role="alert">
          Add the deployed Preprod contract address to <code>VITE_CONTRACT_ADDRESS</code> before publishing.
        </div>
      )}

      <div className="action-grid">
        <WalletConnect />
        <CircuitCall />
      </div>

      <footer>
        <span>Built on Midnight</span>
        <span>Private witness · Public verification</span>
      </footer>
    </main>
  );
}
