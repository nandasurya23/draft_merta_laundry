'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, LogOut, Home, Receipt, Users, BarChart3, Settings, Plus, Sparkles } from 'lucide-react';
import { UserProvider, useUser } from './UserContext';

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useUser();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    setShowLogoutModal(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  const navItems = [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/transactions', label: 'Transaksi', icon: Receipt },
    { href: '/customers', label: 'Pelanggan', icon: Users },
    ...(user?.role === 'OWNER' ? [{ href: '/reports', label: 'Laporan', icon: BarChart3 }] : []),
    { href: '/settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden select-none">
      {/* Desktop & Tablet Sidebar */}
      <aside
        className={`hidden md:flex flex-col ${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 text-white transition-all duration-300 z-30 shrink-0 shadow-xl`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-indigo-600/30">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-white leading-none">Merta</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Laundry System</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-md">
              <Sparkles size={18} />
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label={sidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Primary POS Action Button */}
        <div className="p-3">
          <Link
            href="/transactions/new"
            className={`flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold transition-all shadow-lg shadow-indigo-600/30 ${
              !sidebarOpen && 'px-0'
            }`}
            title="Terima Cucian Baru"
          >
            <Plus size={20} className="shrink-0" />
            {sidebarOpen && <span className="text-sm font-semibold tracking-wide">Terima Cucian</span>}
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } ${!sidebarOpen && 'justify-center px-0'}`}
                title={item.label}
              >
                <Icon size={20} className="shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {sidebarOpen && user && (
            <div className="px-3 py-2 bg-slate-800/60 rounded-xl border border-slate-700/50">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                {user.role === 'OWNER' ? 'Owner Outlet' : 'Kasir Aktif'}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ${
              !sidebarOpen && 'justify-center px-0'
            }`}
            title="Keluar"
          >
            <LogOut size={18} className="shrink-0" />
            {sidebarOpen && <span className="text-xs font-semibold">Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white md:hidden shadow-sm shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="truncate">
              <h1 className="text-base sm:text-xl font-bold text-slate-900 leading-tight truncate">Merta Laundry</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Kasir & Manajemen Laundry</p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* User display */}
            {user && (
              <div className="text-right pr-2 hidden sm:block">
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-500">Kasir</p>
              </div>
            )}

            {/* Mobile Settings Shortcut */}
            <Link
              href="/settings"
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors md:hidden"
              title="Pengaturan Laundry"
              aria-label="Pengaturan"
            >
              <Settings size={20} />
            </Link>

            {/* Mobile Logout Button */}
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors md:hidden"
              title="Keluar Akun"
              aria-label="Keluar"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 flex items-center justify-around py-2 px-2 shadow-lg">
          <Link
            href="/"
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
              pathname === '/' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Home size={20} className="mb-0.5" />
            <span>Beranda</span>
          </Link>

          <Link
            href="/transactions"
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
              pathname === '/transactions' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Receipt size={20} className="mb-0.5" />
            <span>Transaksi</span>
          </Link>

          <Link
            href="/transactions/new"
            className="flex flex-col items-center justify-center -mt-5"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 active:scale-95">
              <Plus size={24} />
            </div>
            <span className="text-[10px] font-bold text-indigo-600 mt-0.5">Cuci</span>
          </Link>

          <Link
            href="/customers"
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
              pathname === '/customers' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Users size={20} className="mb-0.5" />
            <span>Pelanggan</span>
          </Link>

          {user?.role === 'OWNER' ? (
            <Link
              href="/reports"
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                pathname === '/reports' ? 'text-indigo-600 font-bold' : 'text-slate-500'
              }`}
            >
              <BarChart3 size={20} className="mb-0.5" />
              <span>Laporan</span>
            </Link>
          ) : (
            <Link
              href="/settings"
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                pathname === '/settings' ? 'text-indigo-600 font-bold' : 'text-slate-500'
              }`}
            >
              <Settings size={20} className="mb-0.5" />
              <span>Pengaturan</span>
            </Link>
          )}
        </nav>
      </div>

      {/* Confirmation Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-extrabold text-slate-900">Keluar dari Akun?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Anda harus memasukkan 4 digit PIN kasir lagi untuk masuk kembali.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </UserProvider>
  );
}

