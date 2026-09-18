import type { ReactNode, SVGProps } from 'react';

type IconName =
  | 'arrow'
  | 'external'
  | 'wallet'
  | 'lock'
  | 'check'
  | 'copy'
  | 'refresh'
  | 'pause'
  | 'play'
  | 'cube'
  | 'code'
  | 'eye'
  | 'spark'
  | 'disconnect';

const paths: Record<IconName, ReactNode> = {
  arrow: <path d="M4 12h15M13 5l7 7-7 7" />,
  external: <path d="M6 18 18 6M6 6h12v12" />,
  wallet: (
    <>
      <path d="M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v11H5a3 3 0 0 1-3-3V6" />
      <path d="M20 12h-5v5h5M16 14.5h.1" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  copy: (
    <>
      <rect x="8" y="8" width="12" height="13" rx="2" />
      <path d="M15 8V3H3v13h5" />
    </>
  ),
  refresh: (
    <path d="M20 7a9 9 0 0 0-15-1L2 9m0-6v6h6M4 17a9 9 0 0 0 15 1l3-3m0 6v-6h-6" />
  ),
  pause: <path d="M8 5v14M16 5v14" />,
  play: <path d="m8 4 12 8-12 8V4Z" />,
  cube: (
    <>
      <path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z" />
      <path d="m3 7 9 5 9-5M12 12v10M7.5 4.5l9 5" />
    </>
  ),
  code: <path d="m7 7-5 5 5 5M17 7l5 5-5 5M14 4l-4 16" />,
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  spark: (
    <path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z" />
  ),
  disconnect: <path d="M9 5H4v14h5M9 12h12m-4-4 4 4-4 4" />,
};

export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

export function BrandMark() {
  return (
    <svg
      className="brand-mark"
      width="38"
      height="38"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      {[0, 45, 90, 135].map((angle) => (
        <ellipse
          key={angle}
          cx="20"
          cy="20"
          rx="8"
          ry="17"
          transform={`rotate(${angle} 20 20)`}
          stroke="currentColor"
          strokeWidth="1.25"
        />
      ))}
      <circle cx="20" cy="20" r="3" fill="currentColor" />
    </svg>
  );
}
