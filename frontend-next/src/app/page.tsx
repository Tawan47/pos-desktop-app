"use client";
import Link from 'next/link';
import { useStore } from '@/providers/StoreProvider';

export default function Home() {
  const { products, sales } = useStore();
  
  const totalSalesThisMonth = sales.filter((s: any) => {
    const saleDate = new Date(s.date);
    const now = new Date();
    return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
  }).reduce((acc: number, curr: any) => acc + curr.total, 0);

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-8">
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-[2.5rem] shadow-2xl p-8 md:p-16 w-full max-w-5xl text-center text-white relative overflow-hidden">
        {/* Decorative Blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-black/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-400/10 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-3xl mb-8 shadow-inner ring-1 ring-white/20">
            <i className="fa-solid fa-shop text-5xl text-blue-100"></i>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight drop-shadow-md">
            Welcome to POS Pro
          </h1>
          <p className="text-lg md:text-xl text-blue-100 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
            ระบบบริหารจัดการหน้าร้านล้ำสมัย ตอบสนองไว ใช้งานได้ทุกอุปกรณ์ พร้อมระบบจัดการสต็อกและรายงานแบบเรียลไทม์
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Link href="/pos" className="group flex items-center justify-center gap-3 w-full px-8 py-5 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 transition-all duration-300 rounded-2xl font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <i className="fa-solid fa-cash-register text-xl group-hover:scale-110 transition-transform"></i> เริ่มขายสินค้า
            </Link>
            <Link href="/dashboard" className="group flex items-center justify-center gap-3 w-full px-8 py-5 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 active:scale-95 transition-all duration-300 rounded-2xl font-bold text-lg text-white shadow-lg">
              <i className="fa-solid fa-chart-line text-xl group-hover:scale-110 transition-transform"></i> ดูแดชบอร์ด
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-8">
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-6 transform hover:-translate-y-1 transition-transform duration-300">
          <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600">
            <i className="fa-solid fa-box-open text-2xl"></i>
          </div>
          <div>
            <p className="text-slate-500 font-medium text-sm">สินค้าในระบบทั้งหมด</p>
            <p className="text-3xl font-extrabold text-slate-800">{products.length} <span className="text-sm font-semibold text-slate-400">รายการ</span></p>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-6 transform hover:-translate-y-1 transition-transform duration-300">
          <div className="bg-blue-100 p-4 rounded-2xl text-blue-600">
            <i className="fa-solid fa-money-bill-wave text-2xl"></i>
          </div>
          <div>
            <p className="text-slate-500 font-medium text-sm">ยอดขายเดือนนี้</p>
            <p className="text-3xl font-extrabold text-slate-800">฿{totalSalesThisMonth.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
          </div>
        </div>

        <Link href="/stock" className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-6 shadow-2xl flex items-center justify-between text-white transform hover:-translate-y-1 hover:shadow-blue-900/20 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-slate-300 font-medium text-sm mb-1">ต้องการเพิ่มสินค้า?</p>
            <p className="text-xl font-bold">จัดการคลังสินค้า</p>
          </div>
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
            <i className="fa-solid fa-arrow-right text-xl group-hover:translate-x-1 transition-transform"></i>
          </div>
        </Link>
      </div>
    </div>
  );
}
