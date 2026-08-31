import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Merta Laundry - Sistem Manajemen',
  description: 'Sistem manajemen laundry modern dengan Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
