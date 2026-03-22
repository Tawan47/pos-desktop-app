import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'react-toastify/dist/ReactToastify.css';

import { StoreProvider } from '@/providers/StoreProvider';
import Sidebar from '@/components/Sidebar';
import { ToastContainer } from 'react-toastify';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'POS Application',
  description: 'Point of Sale Next.js Application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-sans antialiased bg-slate-50 md:flex h-screen overflow-hidden text-slate-900 selection:bg-blue-100`}>
        <StoreProvider>
          <Sidebar />
          {/* On mobile, pad the bottom so content isn't hidden behind the fixed bottom nav */}
          <main className="flex-1 h-screen overflow-y-auto pb-[80px] md:pb-0 px-4 sm:px-6 md:px-10 pt-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </StoreProvider>
        <ToastContainer position="top-right" autoClose={2500} theme="colored" hideProgressBar className="!mt-12 md:!mt-0" />
      </body>
    </html>
  );
}
