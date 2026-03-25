'use client';

import { useEffect, useRef, useState } from 'react';
import { Delete, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DeleteControlsProps {
  onDeleteLast: () => void;
  onClearAll: () => void;
  /** Disables both buttons when the sentence is already empty. */
  disabled?: boolean;
}

export default function DeleteControls({
  onDeleteLast,
  onClearAll,
  disabled = false,
}: DeleteControlsProps) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-revert the "Tap again to clear" state after 3 seconds
  useEffect(() => {
    if (!confirming) return;
    timerRef.current = setTimeout(() => setConfirming(false), 3000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [confirming]);

  // Reset confirming when disabled (sentence cleared externally)
  useEffect(() => {
    if (disabled) setConfirming(false);
  }, [disabled]);

  function handleClearClick() {
    if (disabled) return;
    if (confirming) {
      onClearAll();
      setConfirming(false);
    } else {
      setConfirming(true);
    }
  }

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Text editing controls">
      {/* Delete last character — §5.D "Delete Last Character Button" */}
      <button
        type="button"
        onClick={onDeleteLast}
        disabled={disabled}
        aria-label="Delete last character"
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-500/50 focus-visible:ring-offset-1',
          disabled
            ? 'cursor-not-allowed border-border bg-muted text-neutral-200 opacity-50'
            : [
                'border-border bg-muted text-neutral-600',
                'hover:border-warning-500/60 hover:bg-warning-100 hover:text-warning-700',
                'active:scale-[0.97] active:bg-warning-100/80',
              ].join(' '),
        )}
      >
        <Delete className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* Clear all — §5.D "Clear All Text Button", 2-step confirm */}
      <button
        type="button"
        onClick={handleClearClick}
        disabled={disabled}
        aria-label={confirming ? 'Tap again to confirm clear all' : 'Clear all text'}
        aria-pressed={confirming}
        className={cn(
          'flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-500/50 focus-visible:ring-offset-1',
          disabled && 'cursor-not-allowed text-neutral-200 opacity-50 pointer-events-none',
          !disabled && !confirming && [
            'text-neutral-600',
            'hover:bg-error-50 hover:text-error-500',
          ].join(' '),
          !disabled && confirming && [
            'border border-error-500/60 bg-error-100 font-medium text-error-700',
          ].join(' '),
        )}
      >
        <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{confirming ? 'Tap again to clear' : 'Clear all'}</span>
      </button>
    </div>
  );
}