'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle, CheckCircle2, Delete, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function triggerLogin(pinToSubmit: string) {
    if (loading || pinToSubmit.length !== 4) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinToSubmit }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'PIN tidak valid');
        setPin('');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/'), 800);
    } catch {
      setError('Gagal terhubung ke server');
      setLoading(false);
    }
  }

  function handleKeypadPress(num: string) {
    if (loading || success) return;
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        triggerLogin(nextPin);
      }
    }
  }

  function handleBackspace() {
    if (loading || success) return;
    setPin((prev) => prev.slice(0, -1));
  }

  function handleClear() {
    if (loading || success) return;
    setPin('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length === 4) {
      triggerLogin(pin);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 select-none">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
              <Lock size={28} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Merta Laundry</h1>
            <p className="text-slate-500 text-sm mt-0.5">Masukkan 4 Digit PIN Kasir</p>
          </div>

          {/* Feedback Messages */}
          {success && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3">
              <CheckCircle2 className="text-emerald-600 shrink-0" size={22} />
              <div>
                <p className="text-emerald-800 text-sm font-bold">PIN Benar</p>
                <p className="text-emerald-600 text-xs">Membuka kasir...</p>
              </div>
            </div>
          )}

          {error && !success && (
            <div className="mb-4 bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-center gap-3">
              <AlertCircle className="text-rose-600 shrink-0" size={22} />
              <div>
                <p className="text-rose-800 text-sm font-bold">PIN Salah</p>
                <p className="text-rose-600 text-xs">{error}</p>
              </div>
            </div>
          )}

          {/* PIN Indicators */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center items-center gap-3 py-2">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = pin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                      isFilled
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 scale-105'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {isFilled ? '•' : ''}
                  </div>
                );
              })}
            </div>

            {/* Virtual Numpad */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  disabled={loading || success}
                  className="h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-indigo-100 active:scale-95 text-slate-800 text-2xl font-bold transition-all disabled:opacity-50 flex items-center justify-center border border-slate-200/60 shadow-sm"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClear}
                disabled={loading || success || pin.length === 0}
                className="h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-500 text-xs font-bold transition-all disabled:opacity-30 flex items-center justify-center border border-slate-200/60 uppercase tracking-wider"
              >
                Hapus
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                disabled={loading || success}
                className="h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-indigo-100 active:scale-95 text-slate-800 text-2xl font-bold transition-all disabled:opacity-50 flex items-center justify-center border border-slate-200/60 shadow-sm"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                disabled={loading || success || pin.length === 0}
                className="h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-all disabled:opacity-30 flex items-center justify-center border border-slate-200/60"
                aria-label="Hapus satu angka"
              >
                <Delete size={22} />
              </button>
            </div>

            {/* Submit CTA button */}
            <button
              type="submit"
              disabled={loading || success || pin.length !== 4}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                pin.length === 4 && !loading && !success
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                'Memeriksa PIN...'
              ) : success ? (
                <>
                  <CheckCircle2 size={20} />
                  <span>Berhasil Masuk</span>
                </>
              ) : (
                <>
                  <span>Masuk Kasir</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          Sistem Kasir Merta Laundry
        </p>
      </div>
    </div>
  );
}
