'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  AlertCircle,
  CheckCircle2,
  Users,
  User,
  Phone,
  Sparkles,
  ShoppingBag,
  Search,
  X,
} from 'lucide-react';

interface CustomItem {
  name: string;
  price: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  custom_items: CustomItem[];
  total_transactions: number;
  total_spent: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: '',
    name: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  }

  function startAdd() {
    setEditingId(null);
    setName('');
    setPhone('');
    setCustomItems([]);
    setItemName('');
    setItemPrice('');
    setError('');
    setSuccess('');
    setShowForm(true);
  }

  function startEdit(customer: Customer) {
    setEditingId(customer.id);
    setName(customer.name);
    setPhone(customer.phone || '');
    setCustomItems(customer.custom_items || []);
    setItemName('');
    setItemPrice('');
    setError('');
    setSuccess('');
    setShowForm(true);
  }

  function addCustomItem() {
    if (!itemName.trim() || !itemPrice.trim()) return;
    const price = parseInt(itemPrice);
    if (isNaN(price) || price <= 0) return;

    setCustomItems([...customItems, { name: itemName.trim(), price }]);
    setItemName('');
    setItemPrice('');
  }

  function removeCustomItem(index: number) {
    setCustomItems(customItems.filter((_, i) => i !== index));
  }

  async function handleSaveCustomer(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Nama pelanggan wajib diisi');
      return;
    }

    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/customers/${editingId}` : '/api/customers';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          customItems: customItems.length > 0 ? customItems : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Gagal menyimpan pelanggan');
        return;
      }

      setSuccess(editingId ? 'Pelanggan berhasil diperbarui' : 'Pelanggan berhasil ditambahkan');
      setTimeout(() => {
        setShowForm(false);
        setEditingId(null);
        fetchCustomers();
      }, 1000);
    } catch {
      setError('Terjadi kesalahan koneksi');
    }
  }

  async function confirmDelete() {
    try {
      await fetch(`/api/customers/${showDeleteConfirm.id}`, { method: 'DELETE' });
      setShowDeleteConfirm({ open: false, id: '', name: '' });
      fetchCustomers();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(debouncedSearch))
  );

  return (
    <div className="space-y-6 select-none max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Data Pelanggan</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Daftar pelanggan & riwayat cucian mereka</p>
        </div>
        <button
          type="button"
          onClick={startAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>Tambah Pelanggan</span>
        </button>
      </div>

      {/* Form Tambah / Edit Modal or Card */}
      {showForm && (
        <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-indigo-200 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                {editingId ? <Pencil size={20} /> : <Plus size={20} />}
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {editingId ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSaveCustomer} className="space-y-5">
            {success && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
                <p className="text-emerald-800 text-sm font-bold">{success}</p>
              </div>
            )}

            {error && !success && (
              <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-center gap-3">
                <AlertCircle className="text-rose-600 shrink-0" size={20} />
                <p className="text-rose-800 text-sm font-bold">{error}</p>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User size={15} className="text-slate-500" />
                  <span>Nama Lengkap *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Phone size={15} className="text-slate-500" />
                  <span>Nomor WhatsApp / HP</span>
                </label>
                <input
                  type="tel"
                  placeholder="08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Optional Custom Items */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles size={15} className="text-indigo-600" />
                <span>Item Favorit Pelanggan (Opsional)</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Item khusus langganan yang sering dicuci oleh pelanggan ini.
              </p>

              {customItems.length > 0 && (
                <div className="space-y-1.5">
                  {customItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
                      <span className="font-bold text-slate-900">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-slate-700">Rp {item.price.toLocaleString('id-ID')}</span>
                        <button
                          type="button"
                          onClick={() => removeCustomItem(idx)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Nama item (misal: Seragam Batik)"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-indigo-600 bg-white"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="Harga (Rp)"
                    value={itemPrice}
                    onKeyDown={(e) => {
                      if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => setItemPrice(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 sm:w-28 sm:flex-initial px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-indigo-600 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={addCustomItem}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 shrink-0"
                  >
                    Tambah
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
              >
                {editingId ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200/80">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau nomor telepon pelanggan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 outline-none focus:border-indigo-600"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setDebouncedSearch('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Memuat data pelanggan...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <Users size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-800 text-base">Tidak ada pelanggan ditemukan</p>
            <p className="text-slate-400 text-xs mt-1">
              {debouncedSearch ? 'Coba cari dengan nama atau nomor lain.' : 'Belum ada pelanggan terdaftar.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-slate-900 text-base">{c.name}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Phone size={13} className="text-slate-400" />
                      <span>{c.phone || 'Tanpa no telepon'}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <ShoppingBag size={13} className="text-slate-400" />
                      <span>{c.total_transactions || 0}x transaksi</span>
                    </span>
                    <span>•</span>
                    <span className="font-bold text-slate-700">
                      Total: Rp {(c.total_spent || 0).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {c.custom_items && c.custom_items.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Sparkles size={13} className="text-indigo-600" />
                      <span className="text-[11px] text-indigo-700 font-semibold">
                        {c.custom_items.map((it) => it.name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(c)}
                    className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    aria-label="Edit pelanggan"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm({ open: true, id: c.id, name: c.name })}
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    aria-label="Hapus pelanggan"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm.open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-extrabold text-slate-900">Hapus Pelanggan?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Data pelanggan <span className="font-bold text-slate-800">{showDeleteConfirm.name}</span> akan dihapus.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm({ open: false, id: '', name: '' })}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
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
