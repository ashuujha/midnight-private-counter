import { useEffect, useState } from 'react';
import { CircuitCall } from './components/CircuitCall';
import { WalletConnect } from './components/WalletConnect';
import { BrandMark, Icon } from './components/Icon';
import { FractalScene } from './components/FractalScene';
import { PrivacyExplainer } from './components/PrivacyExplainer';
import {
  CONTRACT_ADDRESS,
  MIDNIGHT_NETWORK,
  useMidnight,
} from './hooks/useMidnight';

export default function App() {
  const { status } = useMidnight();
  const [motion, setMotion] = useState(true);
  const contractConfigured = /^[0-9a-fA-F]{64}$/.test(CONTRACT_ADDRESS);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMotion(!query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    document.querySelectorAll('.reveal').forEach((element) => {
      if (element.getBoundingClientRect().top > window.innerHeight)
        element.classList.add('will-reveal');
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="app-shell" data-motion={motion ? 'on' : 'off'}>
      <a className="skip-link" href="#proof-lab">
        Skip to the proof lab
      </a>
      <header className="site-header">
        <a
          className="brand"
          href="#top"
          aria-label="Midnight Private Counter home"
        >
          <BrandMark />
          <span>
            midnight<span className="brand-caption">PRIVATE COUNTER</span>
          </span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#proof-lab">The experiment</a>
          <a href="#privacy">How it works</a>
          <a
            href="https://github.com/ashuujha/midnight-private-counter"
            target="_blank"
            rel="noreferrer"
          >
            Source <Icon name="external" />
          </a>
        </nav>
        <a className="header-cta" href="#proof-lab">
          <span
            className={`tiny-indicator ${status === 'connected' ? '' : 'muted-dot'}`}
          />
          {status === 'connected' ? 'Wallet connected' : 'Launch app'}
          <Icon name="external" />
        </a>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-copy">
            <div className="hero-kicker">
              <span className="tiny-indicator" /> A SMALL EXPERIMENT IN INFINITE
              POSSIBILITY
            </div>
            <h1 id="hero-heading">
              Less revealed.
              <br />
              <span>More possible.</span>
            </h1>
            <p>
              A public step forward. A secret kept.
              <br />
              Experience the quiet power of zero knowledge
              <br className="desktop-break" /> on the Midnight blockchain.
            </p>
            <div className="hero-actions">
              <a className="button button-primary hero-cta" href="#proof-lab">
                Enter the proof lab <Icon name="arrow" />
              </a>
              <a className="hero-secondary" href="#privacy">
                A closer look <span>↓</span>
              </a>
            </div>
            <div className="hero-note">
              <Icon name="lock" />
              <span>Private inputs. Public verification.</span>
            </div>
          </div>
          <FractalScene motion={motion} />
          <div className="hero-bottom">
            <span>
              <span className="tiny-indicator" /> BUILT ON MIDNIGHT{' '}
              <span className="bottom-divider">/</span>{' '}
              {MIDNIGHT_NETWORK.toUpperCase()} TEST NETWORK
            </span>
            <button
              className="motion-toggle"
              type="button"
              onClick={() => setMotion((value) => !value)}
              aria-pressed={motion}
              aria-label={
                motion
                  ? 'Pause ambient animations'
                  : 'Enable ambient animations'
              }
            >
              <Icon name={motion ? 'pause' : 'play'} /> MOTION{' '}
              {motion ? 'ON' : 'OFF'}
            </button>
          </div>
        </section>

        <div
          className="principles-strip reveal"
          aria-label="The experiment at a glance"
        >
          <div>
            <Icon name="lock" />
            <span>Private by nature</span>
            <span className="principle-detail">Your witness stays hidden</span>
          </div>
          <div>
            <Icon name="cube" />
            <span>Verified on-chain</span>
            <span className="principle-detail">
              Every increment leaves a proof
            </span>
          </div>
          <div>
            <Icon name="spark" />
            <span>One simple interaction</span>
            <span className="principle-detail">Connect. Prove. Discover.</span>
          </div>
        </div>

        <section
          className="lab-section reveal"
          id="proof-lab"
          aria-labelledby="lab-heading"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                <span className="section-index">01 /</span> THE INTERACTIVE
                EXPERIMENT
              </span>
              <h2 id="lab-heading">
                Small action.<span> Real proof.</span>
              </h2>
            </div>
            <p>
              Two steps to experience privacy in motion. <br />
              Your wallet. Your proof. Your moment.
            </p>
          </div>
          {!contractConfigured && (
            <div className="configuration-banner" role="alert">
              The contract is not configured. Circuit calls are currently
              unavailable.
            </div>
          )}
          <div className="action-grid">
            <WalletConnect />
            <CircuitCall />
          </div>
          <div className="lab-footnote">
            <span>
              <span className="tiny-indicator" />{' '}
              {MIDNIGHT_NETWORK.toUpperCase()} PLAYGROUND
            </span>
            <p>
              Test network, real cryptography. You’ll need tNIGHT registered for
              tDUST in Lace.
            </p>
            <a
              href="https://docs.midnight.network/guides/acquire-tokens"
              target="_blank"
              rel="noreferrer"
            >
              Get set up <Icon name="external" />
            </a>
          </div>
        </section>

        <PrivacyExplainer />
        <section className="closing-note reveal" aria-label="Our philosophy">
          <BrandMark />
          <p>
            Privacy isn’t an absence.
            <br />
            It’s a world of <em>possibility.</em>
          </p>
          <span>POWERED BY MATHEMATICS. BUILT ON MIDNIGHT.</span>
        </section>
      </main>

      <footer className="site-footer">
        <a className="footer-brand" href="#top">
          midnight <span>© {new Date().getFullYear()} · Private Counter</span>
        </a>
        <span className="footer-note">
          A little mystery. Mathematically protected.
        </span>
        <a
          href="https://docs.midnight.network/"
          target="_blank"
          rel="noreferrer"
        >
          Documentation <Icon name="external" />
        </a>
        <a
          href="https://github.com/ashuujha/midnight-private-counter"
          target="_blank"
          rel="noreferrer"
        >
          GitHub <Icon name="external" />
        </a>
      </footer>
    </div>
  );
}
