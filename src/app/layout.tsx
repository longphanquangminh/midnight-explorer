import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import SearchBar from '@/components/SearchBar';

export const metadata: Metadata = {
  title: 'Nocturne — Midnight Explorer',
  description: 'Privacy-first block explorer for Midnight Testnet',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" data-theme="dark">
      <body className="min-h-full bg-gray-900 text-gray-100 antialiased">
        <header className="w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-semibold text-purple-400 hover:text-purple-300">
              Nocturne
            </Link>
            <SearchBar />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
