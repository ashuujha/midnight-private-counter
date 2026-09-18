import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

export function CopyButton({
  value,
  label,
}: {
  value: string | null;
  label: string;
}) {
  const [feedback, setFeedback] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setFeedback('copied');
    } catch {
      setFeedback('failed');
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setFeedback('idle'), 2500);
  };

  return (
    <button
      className="copy-button"
      type="button"
      onClick={() => void copy()}
      disabled={!value}
      aria-label={feedback === 'copied' ? `${label} copied` : label}
      title={
        feedback === 'failed'
          ? 'Select the address and copy it manually.'
          : label
      }
    >
      <Icon name={feedback === 'copied' ? 'check' : 'copy'} />
      <span aria-live="polite">
        {feedback === 'copied'
          ? 'Copied'
          : feedback === 'failed'
            ? 'Copy unavailable'
            : 'Copy'}
      </span>
    </button>
  );
}
