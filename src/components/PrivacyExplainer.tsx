import { useState, type KeyboardEvent } from 'react';

export function PrivacyExplainer() {
  const [view, setView] = useState<'public' | 'private'>('public');
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 'public'
        : event.key === 'End'
          ? 'private'
          : view === 'public'
            ? 'private'
            : 'public';
    setView(next);
    document.getElementById(`${next}-tab`)?.focus();
  };

  return (
    <section
      className="privacy-section reveal"
      id="privacy"
      aria-labelledby="privacy-heading"
    >
      <div className="privacy-intro">
        <span className="eyebrow">
          <span className="section-index">02 /</span> THE BEAUTY OF ZERO
          KNOWLEDGE
        </span>
        <h2 id="privacy-heading">
          Leave a proof.
          <br />
          <span>Keep your secret.</span>
        </h2>
        <p>
          A little like a fractal: there’s more beneath the surface. The network
          verifies that your value is valid, without ever seeing the value
          itself.
        </p>
        <a
          className="text-link"
          href="https://docs.midnight.network/"
          target="_blank"
          rel="noreferrer"
        >
          Explore Midnight
        </a>
      </div>
      <div className="privacy-browser">
        <div
          className="privacy-tabs"
          role="tablist"
          aria-label="Explore public and private data"
        >
          {(['public', 'private'] as const).map((tab) => (
            <button
              key={tab}
              id={`${tab}-tab`}
              role="tab"
              type="button"
              aria-selected={view === tab}
              aria-controls="privacy-panel"
              tabIndex={view === tab ? 0 : -1}
              onClick={() => setView(tab)}
              onKeyDown={onTabKey}
            >
              {tab === 'public' ? 'What the world sees' : 'What stays private'}
            </button>
          ))}
        </div>
        <div
          key={view}
          className={`privacy-inspector ${view}`}
          id="privacy-panel"
          role="tabpanel"
          aria-labelledby={`${view}-tab`}
          tabIndex={0}
        >
          <div className="inspector-title">
            <span className="tiny-indicator" />
            <span>
              {view === 'public'
                ? 'PUBLIC LEDGER / VISIBLE ON-CHAIN'
                : 'PRIVATE WITNESS / NEVER RENDERED'}
            </span>
          </div>
          {view === 'public' ? (
            <>
              <div className="inspector-line">
                <span>Counter transition</span>
                <strong>count → count + 1</strong>
              </div>
              <div className="inspector-line">
                <span>Proof accepted</span>
                <strong className="accepted">true</strong>
              </div>
              <div className="inspector-line">
                <span>Transaction &amp; block</span>
                <strong>Publicly verifiable</strong>
              </div>
              <p>The outcome is public. The reason stays yours.</p>
            </>
          ) : (
            <>
              <div className="inspector-line">
                <span>Witness value</span>
                <strong className="hidden-witness" aria-label="Not displayed">
                  ••••••••
                </strong>
              </div>
              <div className="inspector-line">
                <span>Proven condition</span>
                <strong>Within the allowed range</strong>
              </div>
              <div className="inspector-line">
                <span>On-chain disclosure</span>
                <strong>Validity only</strong>
              </div>
              <p>This illustration never reads your private input.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
