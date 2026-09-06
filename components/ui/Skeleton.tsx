/**
 * Reusable skeleton loading components.
 *
 * Usage:
 *   import { Skeleton, SkeletonCard, SkeletonTableRow, SkeletonDetailPage, SkeletonSettingsPage } from '@/components/ui/Skeleton';
 */

import React from 'react';

// ---------------------------------------------------------------------------
// Base Skeleton block — thin shimmer bar
// ---------------------------------------------------------------------------
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-slate-200 rounded-lg animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// SkeletonCard — mirrors the stats card on Dashboard & Reports
// ---------------------------------------------------------------------------
export function SkeletonCard() {
  return (
    <div
      className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4"
      aria-hidden="true"
    >
      {/* Header row: label + icon */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      {/* Big number */}
      <Skeleton className="h-9 w-40" />
      {/* Sub-text */}
      <Skeleton className="h-3 w-48" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonTableRow — mirrors a single row in the transactions list
// ---------------------------------------------------------------------------
export function SkeletonTableRow() {
  return (
    <div
      className="p-4 sm:px-6 flex items-center justify-between gap-4 border-b border-slate-100 last:border-0"
      aria-hidden="true"
    >
      <div className="space-y-2 flex-1 min-w-0">
        <Skeleton className="h-4 w-36 sm:w-48" />
        <Skeleton className="h-3 w-48 sm:w-64" />
      </div>
      <div className="shrink-0 flex items-center gap-4">
        <div className="space-y-2 text-right">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-5 rounded" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonCustomerCard — mirrors a customer card in the grid
// ---------------------------------------------------------------------------
export function SkeletonCustomerCard() {
  return (
    <div
      className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3"
      aria-hidden="true"
    >
      {/* Avatar + name row */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      {/* Stats row */}
      <div className="flex gap-3 pt-1">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonDetailPage — mirrors the transaction detail page
// ---------------------------------------------------------------------------
export function SkeletonDetailPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto" aria-hidden="true">
      {/* Back button + header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-56" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Skeleton className="h-10 w-32 rounded-2xl" />
          <Skeleton className="h-10 w-32 rounded-2xl" />
        </div>
      </div>

      {/* Main detail card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        {/* Section title */}
        <Skeleton className="h-5 w-36" />
        {/* Info rows */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>

      {/* Items card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <Skeleton className="h-5 w-48" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
        {/* Total row */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonSettingsPage — mirrors the settings form layout
// ---------------------------------------------------------------------------
export function SkeletonSettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto" aria-hidden="true">
      {/* Page title */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Card 1: Outlet Info */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-5 w-48" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-12 w-36 rounded-2xl" />
      </div>

      {/* Card 2: Kiloan prices */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-5 w-40" />
        </div>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 w-11 rounded-xl" />
        </div>
      </div>

      {/* Card 3: Satuan prices */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-5 w-40" />
        </div>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 w-11 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonDashboardStats — mirrors the 3 stats card row on Dashboard
// ---------------------------------------------------------------------------
export function SkeletonDashboardStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-hidden="true">
      {[...Array(3)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonRecentTransactions — mirrors recent transactions list on Dashboard
// ---------------------------------------------------------------------------
export function SkeletonRecentTransactions() {
  return (
    <div className="divide-y divide-slate-100" aria-hidden="true">
      {[...Array(5)].map((_, i) => (
        <SkeletonTableRow key={i} />
      ))}
    </div>
  );
}
