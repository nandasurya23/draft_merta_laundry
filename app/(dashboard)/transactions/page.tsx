'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, ChevronRight, ChevronLeft, Clock, CheckCircle2, Receipt, X } from 'lucide-react';

interface Transaction {
  id: string;
  invoice_number: string;
  date: string;
  customer_name: string;
  type: string;
  grand_total: number;
  payment_status: string;
}

const ITEMS_PER_PAGE = 10;

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'BELUM_BAYAR' | 'LUNAS'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.append('search', search.trim());
        if (paymentFilter !== 'ALL') params.append('paymentStatus', paymentFilter);
        params.append('limit', String(ITEMS_PER_PAGE));
        params.append('offset', String((currentPage - 1) * ITEMS_PER_PAGE));

        const res = await fetch(`/api/transactions?${params}`);
        if (res.ok && !ignore) {
          const data = await res.json();
          setTransactions(data.data || []);
          setTotal(data.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        if (!ignore) setLoading(false);
      }
    }, 250);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [currentPage, search, paymentFilter]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 select-none max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Daftar Transaksi</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Kelola nota cucian & pembayaran pelanggan</p>
        </div>
        <Link
          href="/transactions/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>Terima Cucian Baru</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 space-y-3">
        {/* 3 Simple Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => {
              setPaymentFilter('ALL');
              setCurrentPage(1);
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              paymentFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Semua Transaksi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPaymentFilter('BELUM_BAYAR');
              setCurrentPage(1);
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              paymentFilter === 'BELUM_BAYAR'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <Clock size={16} />
            <span>Belum Bayar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPaymentFilter('LUNAS');
              setCurrentPage(1);
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              paymentFilter === 'LUNAS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <CheckCircle2 size={16} />
            <span>Sudah Lunas</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan No Nota atau Nama Pelanggan..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
              aria-label="Hapus pencarian"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Memuat daftar transaksi...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <Receipt size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-800 text-base">Tidak ada transaksi ditemukan</p>
            <p className="text-slate-400 text-xs mt-1">
              {search || paymentFilter !== 'ALL'
                ? 'Coba sesuaikan kata kunci pencarian atau hapus filter.'
                : 'Belum ada transaksi di sistem.'}
            </p>
            {(search || paymentFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPaymentFilter('ALL');
                  setCurrentPage(1);
                }}
                className="mt-3 text-xs font-bold text-indigo-600 hover:underline"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((t) => {
              const isLunas = t.payment_status === 'LUNAS';
              return (
                <div
                  key={t.id}
                  onClick={() => router.push(`/transactions/${t.id}`)}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-slate-900 group-hover:text-indigo-600 text-base">
                        {t.customer_name}
                      </p>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                        {t.type === 'KILOAN' ? 'Kiloan' : t.type === 'SATUAN' ? 'Satuan' : 'Campuran'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="font-mono font-bold text-slate-600">{t.invoice_number}</span>
                      <span>•</span>
                      <span>{new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="font-extrabold text-slate-900 text-base sm:text-lg">
                        Rp {t.grand_total.toLocaleString('id-ID')}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full mt-0.5 ${
                          isLunas
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isLunas ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>Lunas</span>
                          </>
                        ) : (
                          <>
                            <Clock size={13} />
                            <span>Belum Bayar</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 flex items-center justify-center text-slate-400 transition-colors">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && total > 0 && (
          <div className="p-4 sm:px-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 text-center sm:text-left">
            <p>
              Menampilkan <span className="font-bold text-slate-800">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-bold text-slate-800">{Math.min(currentPage * ITEMS_PER_PAGE, total)}</span> dari <span className="font-bold text-slate-800">{total}</span> transaksi
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="font-bold text-slate-800 px-2">
                {currentPage} / {totalPages || 1}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
