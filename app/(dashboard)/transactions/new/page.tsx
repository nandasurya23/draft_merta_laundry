'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewTransactionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'KILOAN' | 'SATUAN'>('KILOAN');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [weight, setWeight] = useState(0);
  const [pricePerKg, setPricePerKg] = useState(6000);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const subtotal = weight * pricePerKg;
      const payload = {
        customerName,
        customerPhone: phone || null,
        type,
        paymentStatus: 'BELUM_BAYAR',
        ...(type === 'KILOAN' && {
          kiloDetail: {
            weight,
            pricePerKg,
            subtotal,
            totalItemCount: 0,
            items: [],
          },
        }),
      };

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Gagal membuat transaksi');
        setLoading(false);
        return;
      }

      const data = await res.json();
      router.push(`/transactions/${data.data.id}`);
    } catch (err) {
      setError('Terjadi kesalahan');
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Transaksi Baru</h1>

      <div className="max-w-2xl bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Layanan</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'KILOAN' | 'SATUAN')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="KILOAN">Kiloan</option>
              <option value="SATUAN">Satuan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Pelanggan</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telepon (Opsional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {type === 'KILOAN' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Berat (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Harga per Kg</label>
                <input
                  type="number"
                  required
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Subtotal:</p>
                <p className="text-2xl font-bold text-gray-900">Rp {(weight * pricePerKg).toLocaleString('id-ID')}</p>
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !customerName}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg"
            >
              {loading ? 'Memproses...' : 'Buat Transaksi'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
