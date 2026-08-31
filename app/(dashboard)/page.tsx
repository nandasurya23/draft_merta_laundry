'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface Stats {
  totalTransactions: number;
  totalOmzet: number;
  totalLunas: number;
  totalBelumBayar: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/reports?period=all');
      if (res.ok) {
        const data = await res.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const StatCard = ({ label, value }: { label: string; value: string | number }) => (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
      <p className="text-gray-600 text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">
        {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
      </p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/transactions/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          Transaksi Baru
        </Link>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Memuat data...</p>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard label="Total Transaksi" value={stats.totalTransactions} />
          <StatCard label="Total Omzet" value={`Rp ${stats.totalOmzet.toLocaleString('id-ID')}`} />
          <StatCard label="Sudah Lunas" value={`Rp ${stats.totalLunas.toLocaleString('id-ID')}`} />
          <StatCard label="Belum Bayar" value={`Rp ${stats.totalBelumBayar.toLocaleString('id-ID')}`} />
        </div>
      ) : null}

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Transaksi Terbaru</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-600 text-center">Fitur ini akan ditampilkan di Fase 4</p>
        </div>
      </div>
    </div>
  );
}
