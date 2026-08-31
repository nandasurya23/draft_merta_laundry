'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Login gagal');
        setPin('');
        setLoading(false);
        return;
      }

      // Success - redirect to dashboard
      router.push('/');
    } catch (err) {
      setError('Terjadi kesalahan');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Merta Laundry</h1>
            <p className="text-gray-600">Sistem Manajemen Laundry</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* PIN Input */}
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                PIN
              </label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                placeholder="Masukkan PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !pin}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Test PINs:
            </p>
            <div className="text-center text-xs text-gray-500 mt-2 space-y-1">
              <p>Owner: 1111</p>
              <p>Pegawai A: 2222</p>
              <p>Pegawai B: 3333</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
