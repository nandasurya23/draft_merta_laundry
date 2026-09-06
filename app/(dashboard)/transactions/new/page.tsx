'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  User,
  Phone,
  Shirt,
  Scale,
  Layers,
  Sparkles,
  Clock,
  Check,
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  custom_kiloan_price?: number | null;
  custom_items?: Array<{ name: string; price: number }>;
}

interface PriceItem {
  id?: string;
  name: string;
  price: number;
}

export default function NewTransactionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'KILOAN' | 'SATUAN' | 'KILOAN_SATUAN'>('KILOAN');
  const [paymentStatus, setPaymentStatus] = useState<'BELUM_BAYAR' | 'LUNAS'>('BELUM_BAYAR');

  // Customer
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCustomerSearch(customerSearch);
    }, 250);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Kiloan
  const [weight, setWeight] = useState(0);
  const [pricePerKg, setPricePerKg] = useState(6000);
  const [kiloanPackages, setKiloanPackages] = useState<PriceItem[]>([]);
  const [selectedPackageName, setSelectedPackageName] = useState('Cuci Kering');
  const [totalPcs, setTotalPcs] = useState(0);

  // Satuan
  const [satuanPresets, setSatuanPresets] = useState<PriceItem[]>([]);
  const [satuanItems, setSatuanItems] = useState<Array<{ name: string; qty: number; unitPrice: number }>>([]);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');

  // Status & Feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [settingsRes, customersRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/customers?limit=100'),
        ]);

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          const kPrices: PriceItem[] = settingsData.data?.kiloan_prices || [];
          const sPrices: PriceItem[] = settingsData.data?.satuan_prices || [];

          if (kPrices.length > 0) {
            setKiloanPackages(kPrices);
            setPricePerKg(kPrices[0].price);
            setSelectedPackageName(kPrices[0].name);
          }
          if (sPrices.length > 0) {
            setSatuanPresets(sPrices);
          }
        }

        if (customersRes.ok) {
          const customersData = await customersRes.json();
          setCustomers(customersData.data || []);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    }

    loadInitialData();
  }, []);

  function selectCustomer(customer: Customer) {
    setCustomerId(customer.id);
    setCustomerName(customer.name);
    setPhone(customer.phone || '');
    if (customer.custom_kiloan_price && customer.custom_kiloan_price > 0) {
      setPricePerKg(customer.custom_kiloan_price);
      setSelectedPackageName('Khusus Pelanggan');
    }
    setCustomerSearch('');
    setShowCustomerSuggestions(false);
  }

  function addPresetSatuan(name: string, price: number) {
    const existingIndex = satuanItems.findIndex((item) => item.name.toLowerCase() === name.toLowerCase());
    if (existingIndex > -1) {
      const updated = [...satuanItems];
      updated[existingIndex].qty += 1;
      setSatuanItems(updated);
    } else {
      setSatuanItems([...satuanItems, { name, qty: 1, unitPrice: price }]);
    }
  }

  function addManualCustomItem() {
    if (!customItemName.trim()) return;
    const price = Math.max(0, parseInt(customItemPrice) || 0);
    addPresetSatuan(customItemName.trim(), price);
    setCustomItemName('');
    setCustomItemPrice('');
  }

  function updateSatuanQty(index: number, delta: number) {
    const updated = [...satuanItems];
    const newQty = Math.max(1, updated[index].qty + delta);
    updated[index].qty = newQty;
    setSatuanItems(updated);
  }

  function removeSatuanItem(index: number) {
    setSatuanItems(satuanItems.filter((_, i) => i !== index));
  }

  function addWeight(extraKg: number) {
    const current = Number(weight) || 0;
    setWeight(Math.max(0, Number((current + extraKg).toFixed(2))));
  }

  const filteredCustomers = debouncedCustomerSearch.trim()
    ? customers.filter((c) => c.name.toLowerCase().includes(debouncedCustomerSearch.toLowerCase()))
    : [];

  const selectedCustomer = customerName ? customers.find((c) => c.name.toLowerCase() === customerName.toLowerCase()) : null;

  const kiloSubtotal = (type === 'KILOAN' || type === 'KILOAN_SATUAN') ? (weight * pricePerKg) : 0;
  const satuanSubtotal = (type === 'SATUAN' || type === 'KILOAN_SATUAN') ? satuanItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0) : 0;
  const grandTotal = kiloSubtotal + satuanSubtotal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validations with friendly messages
    if (!customerName.trim()) {
      setError('Mohon masukkan nama pelanggan.');
      return;
    }

    if ((type === 'KILOAN' || type === 'KILOAN_SATUAN') && weight <= 0) {
      setError('Mohon masukkan berat cucian kiloan (kg).');
      return;
    }

    if ((type === 'SATUAN' || type === 'KILOAN_SATUAN') && satuanItems.length === 0) {
      setError('Mohon pilih minimal satu item pakaian satuan.');
      return;
    }

    setLoading(true);

    try {
      const payload: {
        customerId: string | null;
        customerName: string;
        customerPhone: string | null;
        type: 'KILOAN' | 'SATUAN' | 'KILOAN_SATUAN';
        paymentStatus: 'BELUM_BAYAR' | 'LUNAS';
        kiloDetail?: {
          weight: number;
          pricePerKg: number;
          totalItemCount: number;
          items: never[];
        };
        unitDetail?: {
          items: Array<{ name: string; qty: number; unitPrice: number }>;
        };
      } = {
        customerId: customerId || (selectedCustomer ? selectedCustomer.id : null),
        customerName: customerName.trim(),
        customerPhone: phone.trim() || null,
        type,
        paymentStatus,
      };

      if (type === 'KILOAN' || type === 'KILOAN_SATUAN') {
        payload.kiloDetail = {
          weight,
          pricePerKg,
          totalItemCount: totalPcs || 0,
          items: [],
        };
      }

      if (type === 'SATUAN' || type === 'KILOAN_SATUAN') {
        payload.unitDetail = {
          items: satuanItems,
        };
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Gagal membuat transaksi.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setSuccess(true);
      setTimeout(() => router.push(`/transactions/${data.data.id}`), 1000);
    } catch {
      setError('Gagal terhubung ke server. Periksa koneksi dan coba lagi.');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 select-none max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Terima Cucian Baru</h1>
          <p className="text-slate-500 text-xs sm:text-sm">Catat cucian pelanggan & cetak nota kasir</p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success Alert */}
        {success && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 className="text-emerald-600 shrink-0" size={24} />
            <div>
              <p className="text-emerald-800 font-bold text-sm sm:text-base">Transaksi Berhasil Disimpan</p>
              <p className="text-emerald-600 text-xs">Membuka detail nota transaksi...</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && !success && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="text-rose-600 shrink-0" size={24} />
            <div>
              <p className="text-rose-800 font-bold text-sm">Ada data yang belum lengkap</p>
              <p className="text-rose-600 text-xs">{error}</p>
            </div>
          </div>
        )}

        {/* SECTION 1: PILIH JENIS LAYANAN */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Langkah 1: Pilih Layanan Cucian
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setType('KILOAN')}
              className={`p-4 rounded-2xl border-2 font-bold text-left transition-all flex items-center gap-3.5 ${
                type === 'KILOAN'
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              <div className={`p-3 rounded-xl ${type === 'KILOAN' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Scale size={24} />
              </div>
              <div>
                <p className="text-base font-extrabold">Cuci Kiloan</p>
                <p className="text-xs text-slate-500 font-normal">Timbang berat (kg)</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType('SATUAN')}
              className={`p-4 rounded-2xl border-2 font-bold text-left transition-all flex items-center gap-3.5 ${
                type === 'SATUAN'
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              <div className={`p-3 rounded-xl ${type === 'SATUAN' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Shirt size={24} />
              </div>
              <div>
                <p className="text-base font-extrabold">Cuci Satuan</p>
                <p className="text-xs text-slate-500 font-normal">Per potong baju</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType('KILOAN_SATUAN')}
              className={`p-4 rounded-2xl border-2 font-bold text-left transition-all flex items-center gap-3.5 ${
                type === 'KILOAN_SATUAN'
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              <div className={`p-3 rounded-xl ${type === 'KILOAN_SATUAN' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Layers size={24} />
              </div>
              <div>
                <p className="text-base font-extrabold">Campuran</p>
                <p className="text-xs text-slate-500 font-normal">Kiloan + Satuan</p>
              </div>
            </button>
          </div>
        </div>

        {/* SECTION 2: DATA PELANGGAN */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Langkah 2: Data Pelanggan
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama Pelanggan */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User size={15} className="text-slate-500" />
                <span>Nama Pelanggan *</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ketik nama pelanggan..."
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setCustomerSearch(e.target.value);
                  setShowCustomerSuggestions(true);
                }}
                onFocus={() => setShowCustomerSuggestions(true)}
                className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:bg-indigo-50/20 outline-none text-base font-medium text-slate-900 transition-colors"
              />

              {/* Suggestions */}
              {showCustomerSuggestions && filteredCustomers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-indigo-200 z-30 max-h-56 overflow-y-auto">
                  <div className="p-2 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Pelanggan Terdaftar
                  </div>
                  {filteredCustomers.slice(0, 6).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCustomer(c)}
                      className="w-full px-4 py-3 text-left hover:bg-indigo-50 border-b border-slate-100 last:border-b-0 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.phone || 'Tanpa no HP'}</p>
                      </div>
                      {c.custom_items && c.custom_items.length > 0 && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                          {c.custom_items.length} item favorit
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* No Telepon / WA */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone size={15} className="text-slate-500" />
                <span>Nomor WhatsApp / HP (Opsional)</span>
              </label>
              <input
                type="tel"
                placeholder="081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:bg-indigo-50/20 outline-none text-base font-medium text-slate-900 transition-colors"
              />
            </div>
          </div>

          {/* Quick Favorite Items from Customer */}
          {selectedCustomer && selectedCustomer.custom_items && selectedCustomer.custom_items.length > 0 && (
            <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100 space-y-2">
              <p className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-600" />
                <span>Item Favorit Pelanggan Ini (Klik untuk langsung tambah):</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedCustomer.custom_items.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (type === 'KILOAN') setType('KILOAN_SATUAN');
                      addPresetSatuan(item.name, item.price);
                    }}
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    <Plus size={14} />
                    <span>{item.name}</span>
                    <span className="font-normal opacity-80">(Rp {item.price.toLocaleString('id-ID')})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: RINCIAN KILOAN (JIKA KILOAN / CAMPURAN) */}
        {(type === 'KILOAN' || type === 'KILOAN_SATUAN') && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Scale size={16} className="text-indigo-600" />
                <span>Rincian Cuci Kiloan</span>
              </label>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                Rp {pricePerKg.toLocaleString('id-ID')} / kg
              </span>
            </div>

            {/* Pilihan Paket Kiloan */}
            {kiloanPackages.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Pilih Paket Kiloan:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {kiloanPackages.map((pkg, idx) => {
                    const isSelected = selectedPackageName === pkg.name;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPricePerKg(pkg.price);
                          setSelectedPackageName(pkg.name);
                        }}
                        className={`p-3 rounded-2xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <p className="font-bold text-xs truncate">{pkg.name}</p>
                        <p className="text-xs text-indigo-600 font-extrabold mt-0.5">
                          Rp {pkg.price.toLocaleString('id-ID')}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input Berat & Stepper Cepat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Berat Cucian (Kg) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required={type === 'KILOAN' || type === 'KILOAN_SATUAN'}
                    placeholder="0"
                    value={weight || ''}
                    onKeyDown={(e) => {
                      if (['-', '+', 'e', 'E'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setWeight(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-2xl focus:border-indigo-600 outline-none text-2xl font-extrabold text-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-slate-500 font-bold text-base px-2">Kg</span>
                </div>

                {/* Quick Add Weight Chips */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[0.5, 1, 2, 5].map((kg) => (
                    <button
                      key={kg}
                      type="button"
                      onClick={() => addWeight(kg)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 text-xs font-bold transition-all active:scale-95"
                    >
                      +{kg} kg
                    </button>
                  ))}
                  {weight > 0 && (
                    <button
                      type="button"
                      onClick={() => setWeight(0)}
                      className="px-2 py-1.5 rounded-xl text-slate-400 hover:text-rose-600 text-xs font-bold transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Jumlah Potong Baju (Opsional)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0 (boleh kosong)"
                  value={totalPcs || ''}
                  onKeyDown={(e) => {
                    if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setTotalPcs(isNaN(val) ? 0 : Math.max(0, val));
                  }}
                  className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-2xl focus:border-indigo-600 outline-none text-lg font-bold text-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">Boleh dikosongkan jika tidak dihitung bijian</p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: RINCIAN SATUAN (JIKA SATUAN / CAMPURAN) */}
        {(type === 'SATUAN' || type === 'KILOAN_SATUAN') && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Shirt size={16} className="text-indigo-600" />
                <span>Pilihan Baju Satuan (Klik untuk menambah)</span>
              </label>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {satuanItems.reduce((sum, item) => sum + item.qty, 0)} Item Terpilih
              </span>
            </div>

            {/* Quick Preset Buttons (Touch-friendly 1-tap add) */}
            {satuanPresets.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {satuanPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => addPresetSatuan(preset.name, preset.price)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-800 text-xs font-bold transition-all shadow-sm active:scale-95 border border-slate-200/60"
                  >
                    <Plus size={15} />
                    <span>{preset.name}</span>
                    <span className="opacity-70 font-normal">Rp {preset.price.toLocaleString('id-ID')}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Manual input for custom items not in presets */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Item lainnya (misal: Boneka Besar)"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-600"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Harga (Rp)"
                  value={customItemPrice}
                  onKeyDown={(e) => {
                    if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => setCustomItemPrice(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 sm:w-28 sm:flex-initial px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={addManualCustomItem}
                  disabled={!customItemName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-bold transition-all shrink-0"
                >
                  Tambah
                </button>
              </div>
            </div>

            {/* Items List in Basket */}
            {satuanItems.length > 0 ? (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-slate-700">Daftar Pakaian Terpilih:</p>
                {satuanItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 text-sm truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        Rp {item.unitPrice.toLocaleString('id-ID')} / pcs
                      </p>
                    </div>

                    {/* Stepper buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateSatuanQty(idx, -1)}
                        disabled={item.qty <= 1}
                        className="w-8 h-8 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 flex items-center justify-center font-bold text-base transition-colors"
                        aria-label="Kurangi"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-extrabold text-sm text-slate-900">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateSatuanQty(idx, 1)}
                        className="w-8 h-8 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-base transition-colors"
                        aria-label="Tambah"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <p className="font-extrabold text-slate-900 text-sm">
                        Rp {(item.qty * item.unitPrice).toLocaleString('id-ID')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeSatuanItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      aria-label="Hapus item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <Shirt size={28} className="mx-auto text-slate-300 mb-1" />
                <p className="text-slate-500 text-xs font-semibold">Belum ada item dipilih</p>
                <p className="text-slate-400 text-[11px]">Klik salah satu tombol pakaian di atas</p>
              </div>
            )}
          </div>
        )}

        {/* SECTION 5: PILIHAN PEMBAYARAN & TOTAL */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Langkah 3: Status Pembayaran
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Opsi 1: Belum Bayar */}
            <button
              type="button"
              onClick={() => setPaymentStatus('BELUM_BAYAR')}
              className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                paymentStatus === 'BELUM_BAYAR'
                  ? 'border-amber-500 bg-amber-50/70 text-amber-900 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              <div className={`p-2.5 rounded-xl mt-0.5 ${paymentStatus === 'BELUM_BAYAR' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <Clock size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-base font-extrabold">Belum Bayar</p>
                  {paymentStatus === 'BELUM_BAYAR' && <Check size={18} className="text-amber-600" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Pelanggan bayar nanti saat ambil cucian</p>
              </div>
            </button>

            {/* Opsi 2: Lunas */}
            <button
              type="button"
              onClick={() => setPaymentStatus('LUNAS')}
              className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                paymentStatus === 'LUNAS'
                  ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              <div className={`p-2.5 rounded-xl mt-0.5 ${paymentStatus === 'LUNAS' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <CheckCircle2 size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-base font-extrabold">Sudah Lunas</p>
                  {paymentStatus === 'LUNAS' && <Check size={18} className="text-emerald-600" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Uang kas sudah diterima sekarang di kasir</p>
              </div>
            </button>
          </div>

          {/* Grand Total Bar */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Pembayaran</p>
              <p className="text-xs text-slate-300 mt-0.5">
                {type === 'KILOAN' && `${weight} kg @ Rp ${pricePerKg.toLocaleString('id-ID')}`}
                {type === 'SATUAN' && `${satuanItems.reduce((s, i) => s + i.qty, 0)} pcs item`}
                {type === 'KILOAN_SATUAN' && `${weight} kg + ${satuanItems.reduce((s, i) => s + i.qty, 0)} pcs`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Rp {grandTotal.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* Action Submit Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || success}
            className="flex-1 py-4 px-6 rounded-2xl font-extrabold text-base sm:text-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              'Menyimpan Transaksi...'
            ) : success ? (
              <>
                <CheckCircle2 size={22} />
                <span>Transaksi Disimpan!</span>
              </>
            ) : (
              <>
                <span>Simpan Transaksi & Cetak Nota</span>
                <Check size={20} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading || success}
            className="px-6 py-4 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm sm:text-base transition-colors"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
