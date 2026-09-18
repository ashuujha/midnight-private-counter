import { useRef, type PointerEvent } from 'react';
import { Icon } from './Icon';

export function FractalScene({ motion }: { motion: boolean }) {
  const stage = useRef<HTMLDivElement>(null);

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (
      !motion ||
      event.pointerType === 'touch' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    stage.current?.style.setProperty('--tilt-x', `${x * 13}deg`);
    stage.current?.style.setProperty('--tilt-y', `${y * -10}deg`);
    stage.current?.style.setProperty('--shift-x', `${x * 14}px`);
    stage.current?.style.setProperty('--shift-y', `${y * 14}px`);
  };

  const reset = () => {
    ['--tilt-x', '--tilt-y', '--shift-x', '--shift-y'].forEach((key) =>
      stage.current?.style.removeProperty(key),
    );
  };

  return (
    <div className="fractal-scene" onPointerMove={move} onPointerLeave={reset}>
      <div className="scene-grid" aria-hidden="true" />
      <div className="scene-coordinate coordinate-top">
        <span className="crosshair">+</span> FRACTAL STUDY / 001
      </div>
      <div ref={stage} className="fractal-stage">
        <div className="fractal-float">
          <img
            className="fractal-art"
            src="/images/fractal-hero.webp"
            alt="An iridescent mint and lavender fractal sculpture, formed from intricate repeating crystalline blocks."
            width="1536"
            height="1024"
            fetchPriority="high"
          />
        </div>
        <svg
          className="orbital-network"
          viewBox="0 0 640 560"
          fill="none"
          aria-hidden="true"
        >
          <ellipse
            className="orbit-line"
            cx="320"
            cy="280"
            rx="281"
            ry="205"
            transform="rotate(-27 320 280)"
          />
          <ellipse
            className="orbit-line secondary-orbit"
            cx="320"
            cy="280"
            rx="244"
            ry="238"
            transform="rotate(20 320 280)"
          />
          <path
            className="network-path"
            d="M84 346 139 416 294 468 472 428 570 269 474 114 290 67 104 180"
          />
          <g className="network-points">
            {[
              [84, 346],
              [139, 416],
              [294, 468],
              [472, 428],
              [570, 269],
              [474, 114],
              [290, 67],
              [104, 180],
            ].map(([x, y], index) => (
              <g key={index}>
                <rect
                  x={x - 4}
                  y={y - 4}
                  width="8"
                  height="8"
                  transform={`rotate(45 ${x} ${y})`}
                />
                <circle
                  className="node-halo"
                  style={{ animationDelay: `${index * -1.1}s` }}
                  cx={x}
                  cy={y}
                  r="11"
                />
              </g>
            ))}
          </g>
          <circle className="orbit-particle" r="3" />
          <circle className="orbit-particle particle-two" r="2" />
        </svg>
      </div>
      <div className="floating-label label-private">
        <span className="label-symbol">
          <Icon name="lock" />
        </span>
        <div>
          <span>PRIVATE WITNESS</span>
          <strong>Hidden from the chain.</strong>
        </div>
        <span className="tiny-indicator" />
      </div>
      <div className="floating-label label-public">
        <span className="increment-symbol">+1</span>
        <div>
          <span>PUBLIC OUTCOME</span>
          <strong>One verifiable step.</strong>
        </div>
        <Icon name="check" />
      </div>
      <div className="scene-coordinate coordinate-bottom">
        <span>z ↦ z² + c</span>
        <span>INFINITELY COMPLEX. QUIETLY CONNECTED.</span>
      </div>
    </div>
  );
}
