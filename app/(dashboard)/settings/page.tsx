'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Scale,
  Shirt,
  Building2,
  Phone,
  MapPin,
  Save,
  Users,
  UserPlus,
  Pencil,
  X,
  KeyRound,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '../UserContext';
import { SkeletonSettingsPage } from '@/components/ui/Skeleton';
import { ButtonSpinner } from '@/components/ui/Spinner';

interface PriceItem {
  id?: string;
  name: string;
  price: number;
}

interface EmployeeUser {
  id: string;
  name: string;
  created_at: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user: currentUser, refreshUser } = useUser();
  const currentUserId = currentUser?.id || null;
  const currentUserRole = currentUser?.role || null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    laundryName: '',
    address: '',
    phone: '',
  });

  // Layanan Kiloan
  const [kiloanServices, setKiloanServices] = useState<PriceItem[]>([]);
  const [kiloanName, setKiloanName] = useState('');
  const [kiloanPrice, setKiloanPrice] = useState('');

  // Layanan Satuan
  const [satuanServices, setSatuanServices] = useState<PriceItem[]>([]);
  const [satuanName, setSatuanName] = useState('');
  const [satuanPrice, setSatuanPrice] = useState('');

  // Karyawan & Kasir State
  const [users, setUsers] = useState<EmployeeUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Add User State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState('');

  // Edit User State
  const [editUser, setEditUser] = useState<EmployeeUser | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserPin, setEditUserPin] = useState('');
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [editUserError, setEditUserError] = useState('');

  // Delete User State
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: '',
    name: '',
  });
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      try {
        const settingsPromise = fetch('/api/settings');
        const usersPromise = currentUserRole === 'OWNER' ? fetch('/api/users') : Promise.resolve(null);

        const [settingsRes, usersRes] = await Promise.all([settingsPromise, usersPromise]);

        if (settingsRes.ok && !ignore) {
          const data = await settingsRes.json();
          setFormData({
            laundryName: data.data?.laundry_name || '',
            address: data.data?.address || '',
            phone: data.data?.phone || '',
          });
          setKiloanServices(data.data?.kiloan_prices || []);
          setSatuanServices(data.data?.satuan_prices || []);
        }

        if (usersRes && usersRes.ok && !ignore) {
          const uData = await usersRes.json();
          setUsers(uData.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch settings initial data:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
          setLoadingUsers(false);
        }
      }
    }

    if (currentUserRole !== null) {
      loadInitialData();
    }

    return () => {
      ignore = true;
    };
  }, [currentUserRole]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          laundryName: formData.laundryName,
          address: formData.address,
          phone: formData.phone,
          kiloanPrices: kiloanServices,
          satuanPrices: satuanServices,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Gagal menyimpan pengaturan');
        setSaving(false);
        return;
      }

      setSuccess('Pengaturan berhasil disimpan');
      setSaving(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Terjadi kesalahan koneksi');
      setSaving(false);
    }
  }

  function addKiloanService() {
    if (!kiloanName.trim() || !kiloanPrice.trim()) return;
    const price = parseInt(kiloanPrice);
    if (isNaN(price) || price <= 0) return;

    setKiloanServices([...kiloanServices, { name: kiloanName.trim(), price }]);
    setKiloanName('');
    setKiloanPrice('');
  }

  function removeKiloanService(index: number) {
    setKiloanServices(kiloanServices.filter((_, i) => i !== index));
  }

  function addSatuanService() {
    if (!satuanName.trim() || !satuanPrice.trim()) return;
    const price = parseInt(satuanPrice);
    if (isNaN(price) || price <= 0) return;

    setSatuanServices([...satuanServices, { name: satuanName.trim(), price }]);
    setSatuanName('');
    setSatuanPrice('');
  }

  function removeSatuanService(index: number) {
    setSatuanServices(satuanServices.filter((_, i) => i !== index));
  }

  // Employee Actions
  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddUserError('');
    if (!newUserName.trim()) {
      setAddUserError('Nama karyawan wajib diisi');
      return;
    }
    if (newUserPin.length !== 4) {
      setAddUserError('PIN kasir wajib 4 digit angka');
      return;
    }
    setAddUserLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          pin: newUserPin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddUserError(data.error || 'Gagal menambahkan karyawan');
        setAddUserLoading(false);
        return;
      }
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserPin('');
      setSuccess('Karyawan baru berhasil ditambahkan');
      setTimeout(() => setSuccess(''), 3000);
      fetchUsers();
    } catch {
      setAddUserError('Terjadi kesalahan koneksi');
    } finally {
      setAddUserLoading(false);
    }
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setEditUserError('');
    if (!editUserName.trim()) {
      setEditUserError('Nama karyawan tidak boleh kosong');
      return;
    }
    if (editUserPin && editUserPin.length !== 4) {
      setEditUserError('PIN baru harus 4 digit angka (atau kosongkan jika tidak ingin ganti PIN)');
      return;
    }
    setEditUserLoading(true);
    try {
      const payload: { name: string; pin?: string } = { name: editUserName.trim() };
      if (editUserPin) {
        payload.pin = editUserPin;
      }
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditUserError(data.error || 'Gagal memperbarui karyawan');
        setEditUserLoading(false);
        return;
      }
      setEditUser(null);
      setEditUserName('');
      setEditUserPin('');
      setSuccess('Data karyawan berhasil diperbarui');
      setTimeout(() => setSuccess(''), 3000);
      fetchUsers();
      if (editUser?.id === currentUserId) {
        refreshUser();
      }
    } catch {
      setEditUserError('Terjadi kesalahan koneksi');
    } finally {
      setEditUserLoading(false);
    }
  }

  async function handleDeleteUser() {
    if (!deleteUserConfirm.id) return;
    setDeleteUserLoading(true);
    try {
      const res = await fetch(`/api/users/${deleteUserConfirm.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal menghapus karyawan');
        setTimeout(() => setError(''), 4000);
      } else {
        setSuccess(data.message || 'Karyawan berhasil dihapus');
        setTimeout(() => setSuccess(''), 3000);
        fetchUsers();
      }
    } catch {
      setError('Terjadi kesalahan koneksi');
      setTimeout(() => setError(''), 4000);
    } finally {
      setDeleteUserLoading(false);
      setDeleteUserConfirm({ open: false, id: '', name: '' });
    }
  }

  if (loading) {
    return <SkeletonSettingsPage />;
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Pengaturan Laundry</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Kelola profil usaha, daftar tarif, & akun karyawan kasir</p>
        </div>
      </div>

      {/* Global Notifications */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
          <p className="text-emerald-800 text-sm font-bold">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-center gap-3 shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="text-rose-600 shrink-0" size={20} />
          <p className="text-rose-800 text-sm font-bold">{error}</p>
        </div>
      )}

      {/* SECTION: KELOLA AKUN KARYAWAN & KASIR (KHUSUS OWNER) */}
      {currentUserRole === 'OWNER' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Users size={16} className="text-indigo-600" />
                <span>Kelola Akun Pegawai & Kasir</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Atur nama dan PIN staf kasir yang bertugas mencatat dan mencetak nota transaksi.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewUserName('');
                setNewUserPin('');
                setAddUserError('');
                setShowAddUserModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
            >
              <UserPlus size={16} />
              <span>Tambah Karyawan</span>
            </button>
          </div>

        {/* User List */}
        {loadingUsers ? (
          <div className="py-8 text-center text-slate-400 text-xs">Memuat daftar akun kasir...</div>
        ) : users.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">Belum ada akun pegawai terdaftar.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {users.map((u) => {
              const isCurrentUser = currentUserId === u.id;
              return (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm truncate">{u.name}</span>
                      {isCurrentUser && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold shrink-0">
                          Anda
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Kasir Aktif • Terdaftar {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditUser(u);
                        setEditUserName(u.name);
                        setEditUserPin('');
                        setEditUserError('');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-sm"
                      title="Ubah Nama Karyawan"
                    >
                      <Pencil size={13} />
                      <span>Ubah Nama</span>
                    </button>
                    <button
                      type="button"
                      disabled={isCurrentUser || users.length <= 1}
                      onClick={() => setDeleteUserConfirm({ open: true, id: u.id, name: u.name })}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title={isCurrentUser ? 'Tidak dapat menghapus akun yang sedang aktif' : 'Hapus Akun'}
                      aria-label="Hapus Akun"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* FORM: PROFIL & TARIF */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Profil Usaha */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Building2 size={16} className="text-indigo-600" />
            <span>Profil Laundry (Dicetak di Nota)</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Usaha Laundry
              </label>
              <input
                type="text"
                value={formData.laundryName}
                onChange={(e) => setFormData({ ...formData, laundryName: e.target.value })}
                placeholder="Merta Laundry"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium outline-none focus:border-indigo-600 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin size={14} className="text-slate-500" />
                <span>Alamat Lengkap</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Jl. Raya No. 123, Denpasar"
                rows={2}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium outline-none focus:border-indigo-600 bg-white resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone size={14} className="text-slate-500" />
                <span>Nomor WhatsApp / Telepon</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                placeholder="08123456789"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium outline-none focus:border-indigo-600 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Tarif Kiloan */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Scale size={16} className="text-indigo-600" />
              <span>Daftar Paket Cuci Kiloan</span>
            </h2>
            <span className="text-xs text-slate-500 font-bold">{kiloanServices.length} Paket</span>
          </div>

          {/* List of Kiloan Packages */}
          {kiloanServices.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {kiloanServices.map((service, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-sm"
                >
                  <span className="font-bold text-slate-900">{service.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-extrabold text-indigo-700">
                      Rp {service.price.toLocaleString('id-ID')} / kg
                    </span>
                    <button
                      type="button"
                      onClick={() => removeKiloanService(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      aria-label="Hapus paket kiloan"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Kiloan Row */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={kiloanName}
              onChange={(e) => setKiloanName(e.target.value)}
              placeholder="Nama paket (misal: Cuci Kering)"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium outline-none focus:border-indigo-600 bg-white"
            />
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={kiloanPrice}
              onKeyDown={(e) => {
                if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => setKiloanPrice(e.target.value.replace(/\D/g, ''))}
              placeholder="Tarif per kg (Rp)"
              className="w-full sm:w-36 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium outline-none focus:border-indigo-600 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={addKiloanService}
              disabled={!kiloanName.trim() || !kiloanPrice.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5"
            >
              <Plus size={16} />
              <span>Tambah Paket</span>
            </button>
          </div>
        </div>

        {/* Section 3: Tarif Satuan */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Shirt size={16} className="text-indigo-600" />
              <span>Daftar Layanan Cuci Satuan (Pakaian / Item)</span>
            </h2>
            <span className="text-xs text-slate-500 font-bold">{satuanServices.length} Item</span>
          </div>

          {/* List of Satuan Packages */}
          {satuanServices.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {satuanServices.map((service, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-sm"
                >
                  <span className="font-bold text-slate-900 truncate mr-2">{service.name}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-extrabold text-indigo-700">
                      Rp {service.price.toLocaleString('id-ID')}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSatuanService(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      aria-label="Hapus item satuan"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Satuan Row */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={satuanName}
              onChange={(e) => setSatuanName(e.target.value)}
              placeholder="Nama item pakaian (misal: Bedcover)"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium outline-none focus:border-indigo-600 bg-white"
            />
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={satuanPrice}
              onKeyDown={(e) => {
                if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => setSatuanPrice(e.target.value.replace(/\D/g, ''))}
              placeholder="Tarif satuan (Rp)"
              className="w-full sm:w-36 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium outline-none focus:border-indigo-600 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={addSatuanService}
              disabled={!satuanName.trim() || !satuanPrice.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5"
            >
              <Plus size={16} />
              <span>Tambah Item</span>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 px-6 rounded-2xl font-extrabold text-base bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-60 text-white shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {saving ? (
              <ButtonSpinner label="Menyimpan..." />
            ) : (
              <span>Simpan Semua Pengaturan</span>
            )}
          </button>
        </div>
      </form>

      {/* MODAL: TAMBAH KARYAWAN */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Tambah Karyawan Baru</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Daftarkan nama kasir dan 4 digit PIN</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            {addUserError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-xs font-bold text-rose-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{addUserError}</span>
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Karyawan / Kasir *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti, Budi, Kasir Pagi"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <KeyRound size={14} className="text-slate-500" />
                  <span>4 Digit PIN Masuk Kasir *</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  placeholder="4 Angka PIN (Contoh: 5555)"
                  value={newUserPin}
                  onKeyDown={(e) => {
                    if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => setNewUserPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg font-mono tracking-widest outline-none focus:border-indigo-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  PIN wajib 4 digit angka unik untuk login kasir.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {addUserLoading ? 'Menyimpan...' : 'Simpan Karyawan'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UBAH NAMA KARYAWAN */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                  <Pencil size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Ubah Data Karyawan</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Edit nama kasir atau atur ulang PIN</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            {editUserError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-xs font-bold text-rose-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{editUserError}</span>
              </div>
            )}

            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Karyawan / Kasir *
                </label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <KeyRound size={14} className="text-slate-500" />
                  <span>Ganti 4 Digit PIN (Opsional)</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Kosongkan jika tidak ingin ganti PIN"
                  value={editUserPin}
                  onKeyDown={(e) => {
                    if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => setEditUserPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg font-mono tracking-widest outline-none focus:border-indigo-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Biarkan kosong jika karyawan tetap menggunakan PIN lama.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={editUserLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {editUserLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS KARYAWAN */}
      {deleteUserConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl w-fit">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Hapus Akun Karyawan?</h3>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Yakin ingin menghapus akun <span className="font-bold text-slate-800">{deleteUserConfirm.name}</span>? Riwayat nota dan transaksi yang pernah dibuat oleh karyawan ini akan tetap tersimpan aman.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={deleteUserLoading}
                onClick={handleDeleteUser}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {deleteUserLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
              <button
                type="button"
                onClick={() => setDeleteUserConfirm({ open: false, id: '', name: '' })}
                className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
