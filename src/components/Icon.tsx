import type { ReactNode, SVGProps } from 'react';

type IconName = 'check' | 'copy' | 'refresh' | 'pause' | 'play';

const paths: Record<IconName, ReactNode> = {
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
