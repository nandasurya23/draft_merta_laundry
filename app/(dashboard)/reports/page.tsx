'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

interface Stats {
  totalTransactions: number;
  totalOmzet: number;
  totalLunas: number;
  totalBelumBayar: number;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [period]);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/reports/export?period=${period}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${period}.csv`;
        a.click();
      }
    } catch (error) {
      console.error('Failed to export:', error);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Laporan</h1>
        <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium">
          <Download size={20} />
          {exporting ? 'Mengekspor...' : 'Export CSV'}
        </button>
      </div>

      <div className="mb-6 flex gap-2">
        {(['today', 'week', 'month', 'all'] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-lg font-medium ${period === p ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900 border border-gray-300'}`}>
            {p === 'today' ? 'Hari Ini' : p === 'week' ? 'Minggu Ini' : p === 'month' ? 'Bulan Ini' : 'Semua'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-600">Loading...</div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
            <p className="text-gray-600 text-sm font-medium">Total Transaksi</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTransactions}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-medium">Total Omzet</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">Rp {stats.totalOmzet.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-medium">Sudah Lunas</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">Rp {stats.totalLunas.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <p className="text-gray-600 text-sm font-medium">Belum Bayar</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">Rp {stats.totalBelumBayar.toLocaleString('id-ID')}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
