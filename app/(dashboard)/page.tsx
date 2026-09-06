'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Receipt, CheckCircle2, Clock, ArrowRight, Wallet } from 'lucide-react';

interface Stats {
  totalTransactions: number;
  totalOmzet: number;
  totalLunas: number;
  totalBelumBayar: number;
}

interface Transaction {
  id: string;
  invoice_number: string;
  customer_name: string;
  grand_total: number;
  payment_status: string;
  date: string;
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<'today' | 'all'>('today');
  const [stats, setStats] = useState<Stats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; name: string; role: 'OWNER' | 'KARYAWAN' } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      setLoading(true);
      try {
        const activePeriod = (user && user.role !== 'OWNER') ? 'today' : period;
        const [statsRes, txnRes] = await Promise.all([
          fetch(`/api/reports?period=${activePeriod}`),
          fetch('/api/transactions?limit=5'),
        ]);

        if (statsRes.ok && !ignore) {
          const data = await statsRes.json();
          setStats(data.data);
        }
        if (txnRes.ok && !ignore) {
          const data = await txnRes.json();
          setTransactions(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchData();
    return () => {
      ignore = true;
    };
  }, [period, user]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Call to Action */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-sm mb-2">
            <Wallet size={14} />
            <span>Kasir Laundry Aktif</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Kasir Merta Laundry</h1>
          <p className="text-indigo-100 text-sm mt-1">Siap melayani pelanggan cuci kiloan & satuan</p>
        </div>

        <Link
          href="/transactions/new"
          className="inline-flex items-center gap-2.5 bg-white hover:bg-slate-50 active:scale-95 text-indigo-700 px-6 py-3.5 rounded-2xl font-bold text-base transition-all shadow-lg shadow-black/10 shrink-0"
        >
          <Plus size={22} className="text-indigo-600" />
          <span>Terima Cucian Baru</span>
        </Link>
      </div>

      {/* Period Filter Toggle */}
      <div className="flex items-center justify-between">
        {user?.role === 'OWNER' ? (
          <>
            <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPeriod('today')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  period === 'today'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setPeriod('all')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  period === 'all'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Riwayat
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              {period === 'today' ? 'Menampilkan data hari ini' : 'Menampilkan akumulasi seluruh data'}
            </p>
          </>
        ) : (
          <>
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs font-bold">
              <Clock size={14} className="text-indigo-600" />
              <span>Omzet Kasir Hari Ini</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Rekapitulasi transaksi hari ini
            </p>
          </>
        )}
      </div>

      {/* Stats Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 h-36 animate-pulse border border-slate-200/80"></div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Sudah Lunas (Uang Masuk) */}
          <div className="bg-white rounded-2xl p-6 border-2 border-emerald-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Uang Kas Masuk (Lunas)
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={22} />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Rp {stats.totalLunas.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-slate-500 mt-1">Pembayaran sudah diterima kasir</p>
          </div>

          {/* Card 2: Belum Bayar */}
          <div className="bg-white rounded-2xl p-6 border-2 border-amber-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Belum Bayar (Piutang)
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={22} />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Rp {stats.totalBelumBayar.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-slate-500 mt-1">Pelanggan bayar saat ambil cucian</p>
          </div>

          {/* Card 3: Total Transaksi */}
          <div className="bg-white rounded-2xl p-6 border-2 border-indigo-100 shadow-sm sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                Total Nota Transaksi
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Receipt size={22} />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              {stats.totalTransactions.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Total Omzet: Rp {stats.totalOmzet.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      ) : null}

      {/* Recent Transactions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-5 sm:px-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Transaksi Terbaru</h2>
            <p className="text-xs text-slate-500">Klik nota untuk melihat rincian atau melunasi</p>
          </div>
          <Link
            href="/transactions"
            className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
          >
            <span>Semua Transaksi</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="py-12 text-center">
            <Receipt className="mx-auto text-slate-300 mb-2" size={40} />
            <p className="text-slate-600 font-bold text-sm">Belum ada transaksi</p>
            <p className="text-slate-400 text-xs mt-1">Mulai dengan mencatat cucian baru</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((txn) => {
              const isLunas = txn.payment_status === 'LUNAS';
              return (
                <Link
                  key={txn.id}
                  href={`/transactions/${txn.id}`}
                  className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 group"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 group-hover:text-indigo-600 text-sm sm:text-base">
                      {txn.customer_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-mono">{txn.invoice_number}</span>
                      <span>•</span>
                      <span>{new Date(txn.date).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-sm sm:text-base">
                        Rp {txn.grand_total.toLocaleString('id-ID')}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-0.5 ${
                          isLunas
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isLunas ? (
                          <>
                            <CheckCircle2 size={12} />
                            <span>Lunas</span>
                          </>
                        ) : (
                          <>
                            <Clock size={12} />
                            <span>Belum Bayar</span>
                          </>
                        )}
                      </span>
                    </div>
                    <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
