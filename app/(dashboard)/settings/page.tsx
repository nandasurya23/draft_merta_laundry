'use client';

import { useState, useEffect } from 'react';

interface Settings {
  id: number;
  laundry_name: string;
  address: string;
  phone: string;
  kiloan_prices: Array<{ id: string; name: string; price: number }>;
  satuan_prices: Array<{ id: string; name: string; price: number }>;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    laundryName: '',
    address: '',
    phone: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.data);
        setFormData({
          laundryName: data.data.laundry_name,
          address: data.data.address || '',
          phone: data.data.phone || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          laundryName: formData.laundryName,
          address: formData.address,
          phone: formData.phone,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Gagal menyimpan');
        setSaving(false);
        return;
      }

      fetchSettings();
    } catch (error) {
      setError('Terjadi kesalahan');
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-600">Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Pengaturan</h1>

      <div className="max-w-2xl bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Profil Laundry</h2>

        <form onSubmit={handleSave} className="space-y-6">
          {error && <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Laundry</label>
            <input
              type="text"
              required
              value={formData.laundryName}
              onChange={(e) => setFormData({ ...formData, laundryName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
            <textarea
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telepon</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button type="submit" disabled={saving} className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold rounded-lg">
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>

        {settings && (
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Harga Kiloan</h3>
            <div className="space-y-2">
              {settings.kiloan_prices.map((price) => (
                <div key={price.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-900 font-medium">{price.name}</span>
                  <span className="text-gray-600">Rp {price.price.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-8">Harga Satuan</h3>
            <div className="space-y-2">
              {settings.satuan_prices.map((price) => (
                <div key={price.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-900 font-medium">{price.name}</span>
                  <span className="text-gray-600">Rp {price.price.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
