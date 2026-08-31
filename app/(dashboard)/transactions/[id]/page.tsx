'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Transaction {
  id: string;
  invoice_number: string;
  date: string;
  customer_name: string;
  grand_total: number;
  payment_status: string;
  laundry_status: string;
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [txn, setTxn] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [laundryStatus, setLaundryStatus] = useState('');

  useEffect(() => {
    fetchTransaction();
  }, [params.id]);

  async function fetchTransaction() {
    try {
      const res = await fetch(`/api/transactions/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setTxn(data.data);
        setPaymentStatus(data.data.payment_status);
        setLaundryStatus(data.data.laundry_status);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    setUpdating(true);
    try {
      const res = await fetch(`/api/transactions/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: paymentStatus !== txn?.payment_status ? paymentStatus : undefined,
          laundryStatus: laundryStatus !== txn?.laundry_status ? laundryStatus : undefined,
        }),
      });

      if (res.ok) {
        await fetchTransaction();
      }
    } catch (error) {
      console.error('Failed to update:', error);
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Hapus transaksi ini?')) return;
    try {
      const res = await fetch(`/api/transactions/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/transactions');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  }

  if (loading) return <div className="p-6 text-center text-gray-600">Loading...</div>;
  if (!txn) return <div className="p-6 text-center text-gray-600">Not found</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Detail Transaksi</h1>
        <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
          Hapus
        </button>
      </div>

      <div className="max-w-2xl bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">No Nota</p>
            <p className="text-lg font-semibold text-gray-900">{txn.invoice_number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tanggal</p>
            <p className="text-lg font-semibold text-gray-900">{new Date(txn.date).toLocaleDateString('id-ID')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pelanggan</p>
            <p className="text-lg font-semibold text-gray-900">{txn.customer_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-lg font-semibold text-gray-900">Rp {txn.grand_total.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pembayaran</label>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="BELUM_BAYAR">Belum Bayar</option>
                <option value="LUNAS">Lunas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Laundry</label>
              <select value={laundryStatus} onChange={(e) => setLaundryStatus(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="DITERIMA">Diterima</option>
                <option value="DIPROSES">Diproses</option>
                <option value="SELESAI">Selesai</option>
                <option value="DIAMBIL">Diambil</option>
              </select>
            </div>

            <button onClick={handleUpdate} disabled={updating} className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold rounded-lg">
              {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
