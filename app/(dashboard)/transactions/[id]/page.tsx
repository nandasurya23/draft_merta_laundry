'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Printer,
  ArrowLeft,
  Scale,
  Shirt,
  CheckCircle2,
  Clock,
  Trash2,
  Phone,
  User,
  Calendar,
  Receipt,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

interface Transaction {
  id: string;
  invoice_number: string;
  date: string;
  customer_name: string;
  customer_phone?: string | null;
  type: string;
  grand_total: number;
  payment_status: string;
  created_by_name?: string | null;
  kilo_detail?: {
    weight: number;
    pricePerKg: number;
    totalItemCount?: number;
  };
  unit_detail?: {
    items: Array<{ name: string; qty: number; unitPrice: number }>;
  };
}

interface OutletSettings {
  laundry_name: string;
  address?: string;
  phone?: string;
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [txn, setTxn] = useState<Transaction | null>(null);
  const [outlet, setOutlet] = useState<OutletSettings>({
    laundry_name: 'Merta Laundry',
    address: 'Jl. Utama Laundry No. 1',
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  async function refetch() {
    try {
      const res = await fetch(`/api/transactions/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setTxn(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
    }
  }

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [txnRes, settingsRes] = await Promise.all([
          fetch(`/api/transactions/${params.id}`),
          fetch('/api/settings'),
        ]);

        if (txnRes.ok && !ignore) {
          const data = await txnRes.json();
          setTxn(data.data);
        }
        if (settingsRes.ok && !ignore) {
          const sData = await settingsRes.json();
          if (sData.data) {
            setOutlet({
              laundry_name: sData.data.laundry_name || 'Merta Laundry',
              address: sData.data.address || '',
              phone: sData.data.phone || '',
            });
          }
        }
      } catch (error) {
        console.error('Failed to load transaction data:', error);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [params.id]);

  async function updatePaymentStatus(newStatus: 'LUNAS' | 'BELUM_BAYAR') {
    setUpdating(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/transactions/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });

      if (res.ok) {
        await refetch();
        setMessage({
          type: 'success',
          text: newStatus === 'LUNAS' ? 'Pembayaran berhasil ditandai LUNAS!' : 'Status diubah ke BELUM BAYAR.',
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Gagal mengubah status.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan koneksi.' });
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    setShowDeleteModal(false);
    try {
      const res = await fetch(`/api/transactions/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/transactions');
      }
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  }

  function handlePrint() {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=650,height=850');
    if (!printWindow) {
      // Fallback if popup blocked
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nota Rangkap 3 - ${txn?.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #fff; }
            .receipt-page {
              width: 6.8cm;
              margin: 0 auto 10mm auto;
              padding: 10px 8px;
              border: 1px dashed #bbb;
              background: #fff;
              page-break-after: always;
              break-after: page;
            }
            .header { text-align: center; margin-bottom: 6px; padding-bottom: 5px; border-bottom: 1.5px solid #000; }
            .brand-name { font-size: 14px; font-weight: 900; letter-spacing: 0.5px; }
            .brand-sub { font-size: 9px; color: #333; margin-top: 1px; }
            .ply-badge {
              display: inline-block;
              font-size: 8px;
              font-weight: 800;
              border: 1px solid #000;
              padding: 1px 6px;
              border-radius: 3px;
              margin-top: 3px;
              text-transform: uppercase;
            }
            .meta-table { width: 100%; font-size: 9px; margin: 5px 0; border-collapse: collapse; }
            .meta-table td { padding: 1.5px 0; vertical-align: top; }
            .meta-label { width: 38%; color: #444; }
            .meta-val { width: 62%; font-weight: 600; text-align: right; word-break: break-word; }
            .items-box { border-top: 1px dashed #000; border-bottom: 1px dashed #000; margin: 6px 0; padding: 4px 0; font-size: 9px; }
            .item-row { display: flex; justify-content: space-between; margin: 2px 0; }
            .total-box { margin: 6px 0 4px 0; padding-top: 2px; }
            .total-row { display: flex; justify-content: space-between; font-size: 11px; font-weight: 900; }
            .status-banner {
              text-align: center;
              font-size: 10px;
              font-weight: 800;
              padding: 3px;
              margin: 4px 0;
              border: 1px solid #000;
              text-transform: uppercase;
            }
            .terms { font-size: 7.5px; color: #333; margin-top: 6px; line-height: 1.2; border-top: 0.5px dotted #666; padding-top: 4px; }
            .signature-row { display: flex; justify-content: space-between; margin-top: 14px; font-size: 8px; text-align: center; }
            .sig-col { width: 45%; }
            .sig-space { height: 28px; }
            @media print {
              body { margin: 0; padding: 0; }
              .receipt-page { border: none; margin: 0; width: 100%; page-break-after: always; break-after: page; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  function getWhatsAppUrl() {
    if (!txn?.customer_phone) return '';
    let phoneNum = txn.customer_phone.replace(/\D/g, '');
    if (phoneNum.startsWith('0')) {
      phoneNum = '62' + phoneNum.slice(1);
    }
    const isLunas = txn.payment_status === 'LUNAS';
    const text = encodeURIComponent(
      `Halo Kak ${txn.customer_name},\n` +
      `Terima kasih telah mencuci di ${outlet.laundry_name}.\n\n` +
      `Nomor Nota: ${txn.invoice_number}\n` +
      `Kasir yang Melayani: ${txn.created_by_name || 'Kasir'}\n` +
      `Total Biaya: Rp ${txn.grand_total.toLocaleString('id-ID')}\n` +
      `Status Pembayaran: ${isLunas ? 'LUNAS' : 'BELUM BAYAR'}\n\n` +
      `Cucian Anda siap diambil. Harap menunjukkan pesan ini saat pengambilan. Terima kasih!`
    );
    return `https://wa.me/${phoneNum}?text=${text}`;
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        Memuat detail transaksi...
      </div>
    );
  }

  if (!txn) {
    return (
      <div className="py-20 text-center space-y-3">
        <Receipt size={40} className="mx-auto text-slate-300" />
        <p className="font-bold text-slate-800 text-base">Transaksi tidak ditemukan</p>
        <button
          type="button"
          onClick={() => router.push('/transactions')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Kembali ke Daftar Transaksi
        </button>
      </div>
    );
  }

  const isLunas = txn.payment_status === 'LUNAS';
  const cashierName = txn.created_by_name || 'Kasir';

  return (
    <div className="space-y-6 select-none max-w-4xl mx-auto">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => router.push('/transactions')}
            className="p-2 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors shrink-0 mt-0.5 sm:mt-0"
            aria-label="Kembali"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                {txn.invoice_number}
              </h1>
              <span
                className={`inline-flex items-center gap-1 text-xs font-extrabold px-3 py-0.5 rounded-full ${
                  isLunas
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : 'bg-amber-50 text-amber-700 border border-amber-300'
                }`}
              >
                {isLunas ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                <span>{isLunas ? 'Lunas' : 'Belum Bayar'}</span>
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              Kasir: <span className="font-bold text-slate-700">{cashierName}</span> • {new Date(txn.date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
            </p>
          </div>
        </div>

        {/* Quick Actions (Full width on mobile) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          {txn.customer_phone && (
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Phone size={16} />
              <span>Kirim Nota WhatsApp</span>
            </a>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Printer size={16} />
            <span>Cetak Nota Rangkap 3</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* PRIMARY ACTION CARD: PELUNASAN 1-KLIK */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Status Pembayaran Kasir
        </p>

        {!isLunas ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border-2 border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-800 font-extrabold text-base">
                <Clock size={20} />
                <span>Pelanggan Belum Membayar</span>
              </div>
              <p className="text-xs text-amber-700 mt-1">
                Tagihan sebesar <span className="font-extrabold text-sm text-slate-900">Rp {txn.grand_total.toLocaleString('id-ID')}</span>. Klik tombol di kanan begitu menerima uang dari pelanggan.
              </p>
            </div>

            <button
              type="button"
              disabled={updating}
              onClick={() => updatePaymentStatus('LUNAS')}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2.5 shrink-0"
            >
              <CheckCircle2 size={22} />
              <span>{updating ? 'Menyimpan...' : 'Terima Uang & Tandai Lunas'}</span>
            </button>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border-2 border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-emerald-900 font-extrabold text-base">Pembayaran Sudah Lunas</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Uang kas telah diterima sebesar Rp {txn.grand_total.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={updating}
              onClick={() => updatePaymentStatus('BELUM_BAYAR')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-bold transition-colors"
            >
              <RotateCcw size={14} />
              <span>Ubah ke Belum Bayar</span>
            </button>
          </div>
        )}
      </div>

      {/* Transaction Details Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-6">
        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <User size={14} />
              <span>Pelanggan</span>
            </p>
            <p className="font-extrabold text-slate-900 text-base mt-1">{txn.customer_name}</p>
          </div>

          <div>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Phone size={14} />
              <span>No Telepon</span>
            </p>
            <p className="font-bold text-slate-900 text-base mt-1">{txn.customer_phone || '-'}</p>
          </div>

          <div>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <User size={14} />
              <span>Pegawai Kasir</span>
            </p>
            <p className="font-bold text-slate-900 text-base mt-1">{cashierName}</p>
          </div>

          <div>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar size={14} />
              <span>Tanggal</span>
            </p>
            <p className="font-bold text-slate-900 text-base mt-1">
              {new Date(txn.date).toLocaleDateString('id-ID')}
            </p>
          </div>
        </div>

        {/* Kiloan Details */}
        {txn.kilo_detail && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <Scale size={18} className="text-indigo-600" />
                <span>Cuci Kiloan</span>
              </div>
              <span className="font-extrabold text-sm text-slate-900">
                Rp {(txn.kilo_detail.weight * txn.kilo_detail.pricePerKg).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Berat: {txn.kilo_detail.weight} kg @ Rp {txn.kilo_detail.pricePerKg.toLocaleString('id-ID')}/kg</span>
              {(txn.kilo_detail.totalItemCount ?? 0) > 0 && (
                <span>Jumlah Baju: {txn.kilo_detail.totalItemCount} pcs</span>
              )}
            </div>
          </div>
        )}

        {/* Satuan Details */}
        {txn.unit_detail && txn.unit_detail.items.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <Shirt size={18} className="text-indigo-600" />
                <span>Cuci Satuan ({txn.unit_detail.items.reduce((s, i) => s + i.qty, 0)} Pcs)</span>
              </div>
              <span className="font-extrabold text-sm text-slate-900">
                Rp {txn.unit_detail.items.reduce((s, i) => s + i.qty * i.unitPrice, 0).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="divide-y divide-slate-200 text-xs">
              {txn.unit_detail.items.map((item, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{item.name}</span>
                    <span className="text-slate-500 ml-2">({item.qty} pcs @ Rp {item.unitPrice.toLocaleString('id-ID')})</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    Rp {(item.qty * item.unitPrice).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grand Total */}
        <div className="p-5 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-md">
          <span className="text-sm font-bold uppercase tracking-wider text-slate-300">Total Biaya</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white">
            Rp {txn.grand_total.toLocaleString('id-ID')}
          </span>
        </div>

        {/* Delete button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors"
          >
            <Trash2 size={16} />
            <span>Hapus Transaksi</span>
          </button>
        </div>
      </div>

      {/* Hidden 3-Ply Print Nota Template */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          {/* ================= LEMBAR 1: KOPI PELANGGAN ================= */}
          <div className="receipt-page">
            <div className="header">
              <div className="brand-name">{outlet.laundry_name}</div>
              {outlet.address && <div className="brand-sub">{outlet.address}</div>}
              {outlet.phone && <div className="brand-sub">Telp/WA: {outlet.phone}</div>}
              <div className="ply-badge">LEMBAR 1: KOPI PELANGGAN (BUKTI AMBIL)</div>
            </div>

            <table className="meta-table">
              <tbody>
                <tr>
                  <td className="meta-label">No. Nota:</td>
                  <td className="meta-val">{txn.invoice_number}</td>
                </tr>
                <tr>
                  <td className="meta-label">Tanggal:</td>
                  <td className="meta-val">{new Date(txn.date).toLocaleDateString('id-ID')}</td>
                </tr>
                <tr>
                  <td className="meta-label">Kasir:</td>
                  <td className="meta-val">{cashierName}</td>
                </tr>
                <tr>
                  <td className="meta-label">Pelanggan:</td>
                  <td className="meta-val">{txn.customer_name}</td>
                </tr>
                {txn.customer_phone && (
                  <tr>
                    <td className="meta-label">No. HP:</td>
                    <td className="meta-val">{txn.customer_phone}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="items-box">
              {txn.kilo_detail && (
                <div className="item-row">
                  <span>Kiloan ({txn.kilo_detail.weight} kg)</span>
                  <span>Rp {(txn.kilo_detail.weight * txn.kilo_detail.pricePerKg).toLocaleString('id-ID')}</span>
                </div>
              )}
              {txn.unit_detail?.items.map((it, idx) => (
                <div key={idx} className="item-row">
                  <span>{it.name} ({it.qty}x)</span>
                  <span>Rp {(it.qty * it.unitPrice).toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>

            <div className="total-box">
              <div className="total-row">
                <span>TOTAL:</span>
                <span>Rp {txn.grand_total.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="status-banner">
              STATUS: {isLunas ? 'LUNAS (TERBAYAR)' : 'BELUM BAYAR (BAYAR SAAT AMBIL)'}
            </div>

            <div className="terms">
              <div>* Bawa nota ini saat pengambilan cucian.</div>
              <div>* Cucian tidak diambil &gt; 30 hari di luar tanggung jawab laundry.</div>
              <div>* Komplain maksimal 1x24 jam setelah cucian diambil dengan nota.</div>
            </div>
          </div>

          {/* ================= LEMBAR 2: KOPI PRODUKSI (TEMPEL CUCIAN) ================= */}
          <div className="receipt-page">
            <div className="header">
              <div className="brand-name">{outlet.laundry_name}</div>
              <div className="ply-badge">LEMBAR 2: TAG PRODUKSI (TEMPEL DI CUCIAN)</div>
            </div>

            <table className="meta-table">
              <tbody>
                <tr>
                  <td className="meta-label">No. Nota:</td>
                  <td className="meta-val" style={{ fontSize: '11px', fontWeight: '900' }}>{txn.invoice_number}</td>
                </tr>
                <tr>
                  <td className="meta-label">Pelanggan:</td>
                  <td className="meta-val" style={{ fontSize: '11px', fontWeight: '900' }}>{txn.customer_name}</td>
                </tr>
                <tr>
                  <td className="meta-label">Kasir:</td>
                  <td className="meta-val">{cashierName}</td>
                </tr>
                <tr>
                  <td className="meta-label">Tanggal Masuk:</td>
                  <td className="meta-val">{new Date(txn.date).toLocaleDateString('id-ID')}</td>
                </tr>
              </tbody>
            </table>

            <div className="items-box" style={{ padding: '6px 0' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>RINCIAN CUCIAN:</div>
              {txn.kilo_detail && (
                <div className="item-row" style={{ fontWeight: 'bold' }}>
                  <span>KILOAN:</span>
                  <span>{txn.kilo_detail.weight} KG {(txn.kilo_detail.totalItemCount ?? 0) > 0 ? `(${txn.kilo_detail.totalItemCount} Pcs)` : ''}</span>
                </div>
              )}
              {txn.unit_detail?.items.map((it, idx) => (
                <div key={idx} className="item-row">
                  <span>- {it.name}</span>
                  <span style={{ fontWeight: 'bold' }}>{it.qty} pcs</span>
                </div>
              ))}
            </div>

            <div className="status-banner">
              STATUS BAYAR: {isLunas ? 'LUNAS' : 'BELUM BAYAR'}
            </div>

            <div style={{ fontSize: '8px', textAlign: 'center', marginTop: '6px', color: '#444' }}>
              Pastikan pakaian dihitung & diperiksa sebelum dicuci dan disetrika.
            </div>
          </div>

          {/* ================= LEMBAR 3: KOPI KASIR (ARSIP OUTLET) ================= */}
          <div className="receipt-page">
            <div className="header">
              <div className="brand-name">{outlet.laundry_name}</div>
              <div className="ply-badge">LEMBAR 3: ARSIP KASIR & KEUANGAN</div>
            </div>

            <table className="meta-table">
              <tbody>
                <tr>
                  <td className="meta-label">No. Nota:</td>
                  <td className="meta-val">{txn.invoice_number}</td>
                </tr>
                <tr>
                  <td className="meta-label">Tanggal:</td>
                  <td className="meta-val">{new Date(txn.date).toLocaleDateString('id-ID')}</td>
                </tr>
                <tr>
                  <td className="meta-label">Kasir Handel:</td>
                  <td className="meta-val" style={{ fontWeight: 'bold' }}>{cashierName}</td>
                </tr>
                <tr>
                  <td className="meta-label">Pelanggan:</td>
                  <td className="meta-val">{txn.customer_name}</td>
                </tr>
              </tbody>
            </table>

            <div className="items-box">
              {txn.kilo_detail && (
                <div className="item-row">
                  <span>Kiloan ({txn.kilo_detail.weight} kg)</span>
                  <span>Rp {(txn.kilo_detail.weight * txn.kilo_detail.pricePerKg).toLocaleString('id-ID')}</span>
                </div>
              )}
              {txn.unit_detail?.items.map((it, idx) => (
                <div key={idx} className="item-row">
                  <span>{it.name} ({it.qty}x)</span>
                  <span>Rp {(it.qty * it.unitPrice).toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>

            <div className="total-box">
              <div className="total-row">
                <span>GRAND TOTAL:</span>
                <span>Rp {txn.grand_total.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="status-banner">
              {isLunas ? 'SUDAH LUNAS' : 'BELUM LUNAS'}
            </div>

            <div className="signature-row">
              <div className="sig-col">
                <div>Kasir</div>
                <div className="sig-space"></div>
                <div style={{ borderTop: '1px solid #666', paddingTop: '2px' }}>({cashierName})</div>
              </div>
              <div className="sig-col">
                <div>Pelanggan</div>
                <div className="sig-space"></div>
                <div style={{ borderTop: '1px solid #666', paddingTop: '2px' }}>({txn.customer_name})</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-extrabold text-slate-900">Hapus Transaksi?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Transaksi <span className="font-mono font-bold text-slate-700">{txn.invoice_number}</span> akan dihapus permanen.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
