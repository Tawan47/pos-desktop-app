"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const NAV_LINKS = [
    { path: '/', label: 'หน้าหลัก', icon: 'fa-solid fa-home' },
    { path: '/pos', label: 'จุดขาย', icon: 'fa-solid fa-cash-register' },
    { path: '/stock', label: 'คลังสินค้า', icon: 'fa-solid fa-box-open' },
    { path: '/dashboard', label: 'แดชบอร์ด', icon: 'fa-solid fa-chart-pie' },
    { path: '/report', label: 'รายงาน', icon: 'fa-solid fa-file-invoice' },
    { path: '/history', label: 'ประวัติ', icon: 'fa-solid fa-clock-rotate-left' },
    { path: '/barcode', label: 'บาร์โค้ด', icon: 'fa-solid fa-barcode' },
    { path: '/shipping-label', label: 'ใบปะหน้า', icon: 'fa-solid fa-truck-fast' },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-[260px] bg-slate-900 text-white shrink-0 shadow-2xl z-40 border-r border-slate-800 h-screen overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-center py-8 px-4 border-b border-slate-800">
          <img src="/logo.png" alt="Logo" className="h-[90px] w-auto drop-shadow-xl" />
        </div>

        <nav className="flex-grow px-4 py-6 space-y-1.5">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`flex items-center gap-4 py-3 px-4 rounded-xl transition-all duration-300 text-sm font-medium
                  ${isActive 
                    ? 'bg-blue-600/10 text-blue-400 font-bold shadow-inner border border-blue-500/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}
                `}
              >
                <i className={`${link.icon} text-lg ${isActive ? 'text-blue-400' : 'text-slate-500'}`}></i>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_25px_-5px_rgba(0,0,0,0.1)] z-50 pb-safe">
        <div className="flex items-center overflow-x-auto hide-scrollbar px-2 py-2 gap-1 touch-pan-x">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`flex flex-col items-center justify-center min-w-[72px] p-2 rounded-2xl transition-all duration-200
                  ${isActive 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}
                `}
              >
                <div className={`flex items-center justify-center h-8 w-8 mb-1 rounded-full ${isActive ? 'bg-blue-100 text-blue-600' : ''}`}>
                  <i className={`${link.icon} text-xl transition-transform ${isActive ? 'scale-110' : ''}`}></i>
                </div>
                <span className={`text-[10px] whitespace-nowrap ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* GLOBAL STYLES FOR SCROLLBAR HIDING */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 10px; }
      `}} />
    </>
  );
}
