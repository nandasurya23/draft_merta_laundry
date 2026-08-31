'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, ChevronRight } from 'lucide-react';

interface Transaction {
  id: string;
  invoice_number: string;
  date: string;
  customer_name: string;
  type: string;
  grand_total: number;
  payment_status: string;
  laundry_status: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [search, paymentFilter]);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (paymentFilter) params.append('paymentStatus', paymentFilter);
      const res = await fetch(`/api/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Transaksi</h1>
        <Link href="/transactions/new" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium">
          <Plus size={20} />
          Baru
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cari</label>
            <input type="text" placeholder="No nota / Pelanggan" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pembayaran</label>
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="">Semua</option>
              <option value="LUNAS">Lunas</option>
              <option value="BELUM_BAYAR">Belum Bayar</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-6 text-center text-gray-600">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-600">No transactions</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">No Nota</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Tanggal</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Pelanggan</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Total</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Pembayaran</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{t.invoice_number}</td>
                  <td className="px-6 py-4 text-sm">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                  <td className="px-6 py-4 text-sm">{t.customer_name}</td>
                  <td className="px-6 py-4 text-sm font-medium">Rp {t.grand_total.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4"><span className={`text-xs font-semibold px-3 py-1 rounded-full ${t.payment_status === 'LUNAS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{t.payment_status === 'LUNAS' ? 'Lunas' : 'Belum'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
