'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Download, CheckCircle2, Clock, Receipt, TrendingUp, Calendar } from 'lucide-react';
import { useUser } from '../UserContext';

interface Stats {
  totalTransactions: number;
  totalOmzet: number;
  totalLunas: number;
  totalBelumBayar: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const { user, loading: checkingRole } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!checkingRole) {
      if (!user || user.role !== 'OWNER') {
        router.replace('/');
      }
    }
  }, [checkingRole, user, router]);

  useEffect(() => {
    let ignore = false;
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports?period=${period}`);
        if (res.ok && !ignore) {
          const data = await res.json();
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchStats();
    return () => {
      ignore = true;
    };
  }, [period]);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/reports/export?period=${period}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan_merta_${period}.csv`;
        a.click();
      }
    } catch (error) {
      console.error('Failed to export:', error);
    } finally {
      setExporting(false);
    }
  }

  if (checkingRole) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        Memeriksa hak akses laporan...
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Laporan Keuangan</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Ringkasan omzet, uang masuk, dan piutang laundry</p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto"
        >
          <Download size={18} />
          <span>{exporting ? 'Mengekspor Data...' : 'Download File Excel / CSV'}</span>
        </button>
      </div>

      {/* Period Selection Tabs */}
      <div className="bg-white rounded-3xl p-3 shadow-sm border border-slate-200/80 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 hidden sm:inline flex items-center gap-1.5">
          <Calendar size={14} />
          <span>Periode:</span>
        </span>
        {(['today', 'week', 'month', 'all'] as const).map((p) => {
          const label =
            p === 'today'
              ? 'Hari Ini'
              : p === 'week'
              ? '7 Hari Terakhir'
              : p === 'month'
              ? 'Bulan Ini'
              : 'Semua Riwayat';
          const isSelected = period === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 h-36 animate-pulse border border-slate-200/80"></div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Omzet */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-indigo-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Total Omzet</span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Rp {stats.totalOmzet.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-slate-500 mt-1">Nilai keseluruhan transaksi</p>
          </div>

          {/* Sudah Lunas */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-emerald-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Kas Masuk (Lunas)</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Rp {stats.totalLunas.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-slate-500 mt-1">Uang yang sudah dibayar</p>
          </div>

          {/* Belum Bayar */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-amber-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Piutang (Belum Bayar)</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={20} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Rp {stats.totalBelumBayar.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-slate-500 mt-1">Pelanggan belum melunasi</p>
          </div>

          {/* Total Transaksi */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Nota Transaksi</span>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <Receipt size={20} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.totalTransactions.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-slate-500 mt-1">Jumlah nota terbit</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
