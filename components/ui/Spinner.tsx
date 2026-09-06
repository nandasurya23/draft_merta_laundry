/**
 * Reusable spinner / loading indicator components.
 *
 * Usage:
 *   import { Spinner, SpinnerOverlay } from '@/components/ui/Spinner';
 *
 *   // Inline inside a button:
 *   <button disabled={loading}>
 *     {loading ? <Spinner size="sm" /> : 'Simpan'}
 *   </button>
 *
 *   // Full-page overlay:
 *   {loading && <SpinnerOverlay />}
 */

import React from 'react';

// ---------------------------------------------------------------------------
// Size tokens
// ---------------------------------------------------------------------------
const sizeMap = {
  xs: 'h-3 w-3 border-[1.5px]',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
  xl: 'h-12 w-12 border-4',
} as const;

type SpinnerSize = keyof typeof sizeMap;

// ---------------------------------------------------------------------------
// Spinner — inline circular indicator
// ---------------------------------------------------------------------------
interface SpinnerProps {
  size?: SpinnerSize;
  /** Tailwind colour token for the spinning arc — default indigo */
  color?: string;
  className?: string;
  label?: string;
}

export function Spinner({
  size = 'md',
  color = 'border-indigo-600',
  className = '',
  label = 'Memuat...',
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block shrink-0 rounded-full border-slate-200 animate-spin ${sizeMap[size]} ${color} border-t-transparent ${className}`}
    />
  );
}

// ---------------------------------------------------------------------------
// SpinnerOverlay — centred spinner within its nearest `relative` parent
// ---------------------------------------------------------------------------
interface SpinnerOverlayProps {
  /** Label shown below the spinner */
  label?: string;
  size?: SpinnerSize;
}

export function SpinnerOverlay({ label, size = 'xl' }: SpinnerOverlayProps) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-sm z-10 rounded-inherit"
      aria-busy="true"
      aria-live="polite"
    >
      <Spinner size={size} />
      {label && (
        <p className="text-xs font-medium text-slate-500 animate-pulse">{label}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ButtonSpinner — spinner sized to fit inside a button with label swap
// Renders `<Spinner size="sm" />` + optional text
// ---------------------------------------------------------------------------
interface ButtonSpinnerProps {
  label?: string;
}

export function ButtonSpinner({ label }: ButtonSpinnerProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <Spinner size="sm" color="border-white" />
      {label && <span>{label}</span>}
    </span>
  );
}
