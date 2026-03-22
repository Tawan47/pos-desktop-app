"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/providers/StoreProvider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip, Cell } from 'recharts';

// ฟังก์ชันสำหรับสร้างสีแบบสุ่มสำหรับกราฟ
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#14b8a6'];

// ไอคอนสำหรับการ์ด
const CubeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const CollectionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const CashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;


export default function InventoryReport() {
  const { products } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const summaryData = useMemo(() => {
    const totalSKU = products.length;
    const totalItems = products.reduce((sum, p) => sum + Number(p.quantity), 0);
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    
    const valueByBrand = products.reduce<Record<string, number>>((acc, p) => {
      const brand = p.brand || 'Unbranded';
      const value = p.price * p.quantity;
      if (!acc[brand]) {
        acc[brand] = 0;
      }
      acc[brand] += value;
      return acc;
    }, {});

    let allBrands = Object.keys(valueByBrand).map(brand => ({
      name: brand,
      value: valueByBrand[brand]
    })).sort((a, b) => b.value - a.value);

    // จัดกลุ่มแบรนด์ลำดับ 11 เป็นต้นไปให้เป็น "อื่นๆ"
    const topN = 10;
    let finalChartData = allBrands.slice(0, topN);
    
    if (allBrands.length > topN) {
      const othersValue = allBrands.slice(topN).reduce((sum, b) => sum + b.value, 0);
      finalChartData.push({
        name: 'อื่นๆ (แบรนด์รายย่อย)',
        value: othersValue
      });
    }

    return { totalSKU, totalItems, totalValue, chartData: finalChartData };
  }, [products]);
  
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.toString().toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);


  return (
    <div className="p-4 sm:p-6 lg:p-8 font-sans space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">รายงานคลังสินค้า</h1>
            <p className="text-slate-500 font-medium mt-1">สรุปมูลค่าและปริมาณสินค้าในระบบ</p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-3xl shadow-xl shadow-blue-500/20 text-white relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center gap-4 relative z-10">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm"><CubeIcon /></div>
                <div>
                    <h3 className="text-blue-100 font-semibold mb-1">สินค้ารวม (SKU)</h3>
                    <p className="text-4xl font-extrabold tracking-tight">{summaryData.totalSKU}</p>
                </div>
            </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl shadow-xl shadow-emerald-500/20 text-white relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center gap-4 relative z-10">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm"><CollectionIcon /></div>
                <div>
                    <h3 className="text-emerald-100 font-semibold mb-1">จำนวนชิ้นทั้งหมด</h3>
                    <p className="text-4xl font-extrabold tracking-tight">{summaryData.totalItems.toLocaleString()}</p>
                </div>
            </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-3xl shadow-xl shadow-amber-500/20 text-white relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center gap-4 relative z-10">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm"><CashIcon /></div>
                <div>
                    <h3 className="text-amber-100 font-semibold mb-1">มูลค่ารวมทั้งหมด</h3>
                    <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">฿{summaryData.totalValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 border-none">
        <div className="lg:col-span-1 bg-white p-6 border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 flex flex-col">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><i className="fa-solid fa-chart-column text-indigo-500"></i> มูลค่าแยกตามแบรนด์ (Top 10)</h2>
          <div className="w-full flex-grow min-h-[400px]">
            <ResponsiveContainer>
              <BarChart
                data={summaryData.chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={100}
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`฿${(Number(value) || 0).toLocaleString()}`, 'มูลค่า']}
                />
                <Bar
                    dataKey="value"
                    radius={[0, 8, 8, 0]}
                    barSize={20}
                >
                  {summaryData.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><i className="fa-solid fa-table-list text-blue-500"></i> รายละเอียดสินค้าทั้งหมด</h2>
              <div className="w-full sm:w-72 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><i className="fa-solid fa-magnifying-glass"></i></div>
                  <input type="text" placeholder="ค้นหารายการ..." className="block w-full pl-10 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl shadow-inner text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
          </div>
          
          <div className="min-h-[400px]">
            {filteredProducts.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-64 text-slate-400">
                    <i className="fa-solid fa-box-open text-6xl mb-4 opacity-20"></i>
                    <p className="font-semibold text-lg">{searchTerm ? `ไม่พบสินค้า "${searchTerm}"` : 'ไม่มีสินค้าในคลัง'}</p>
                </div>
            ) : (
                <>
                {/* DESKTOP TABLE VIEW */}
                <div className="hidden md:block overflow-x-auto custom-scrollbar border border-slate-100 rounded-xl">
                    <table className="min-w-full divide-y divide-slate-200 text-sm xl:text-base">
                        <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider rounded-tl-xl text-xs xl:text-sm">ชื่อสินค้า</th>
                            <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-xs xl:text-sm">แบรนด์/สี/ขนาด</th>
                            <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase tracking-wider text-xs xl:text-sm">ราคา</th>
                            <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase tracking-wider rounded-tr-xl text-xs xl:text-sm">จำนวน</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                        {currentItems.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">{p.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-slate-500 flex items-center gap-2">
                                    {p.brand ? <span className="bg-slate-100 px-2 py-0.5 rounded-md text-xs">{p.brand}</span> : null}
                                    {p.color ? <span className="bg-slate-100 px-2 py-0.5 rounded-md text-xs">สี{p.color}</span> : null}
                                    {p.size ? <span className="bg-slate-100 px-2 py-0.5 rounded-md text-xs">ขนาด {p.size}</span> : null}
                                    {!p.brand && !p.color && !p.size && '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-semibold text-blue-600 text-right">฿{p.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700 text-right">{p.quantity}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE CARD VIEW */}
                <div className="md:hidden flex flex-col gap-3">
                    {currentItems.map(p => (
                        <div key={p.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col gap-2 relative overflow-hidden">
                            <h3 className="font-bold text-slate-800 text-lg leading-tight">{p.name}</h3>
                            <div className="flex flex-wrap gap-2 text-xs text-slate-500 my-1">
                                {p.brand && <span className="bg-slate-100 px-2 py-1 rounded-md"><i className="fa-solid fa-tag w-3 text-slate-400"></i> {p.brand}</span>}
                                {p.color && <span className="bg-slate-100 px-2 py-1 rounded-md"><i className="fa-solid fa-palette w-3 text-slate-400"></i> {p.color}</span>}
                                {p.size && <span className="bg-slate-100 px-2 py-1 rounded-md"><i className="fa-solid fa-ruler w-3 text-slate-400"></i> {p.size}</span>}
                            </div>
                            <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-3">
                                <span className="font-extrabold text-blue-600">฿{p.price.toLocaleString(undefined, {minimumFractionDigits: 0})}</span>
                                <span className="font-bold text-slate-700 bg-slate-50 px-3 py-1 rounded-xl">เหลือ {p.quantity} ชิ้น</span>
                            </div>
                        </div>
                    ))}
                </div>
                </>
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
                 <span className="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">หน้า <span className="font-bold text-slate-800">{currentPage}</span> จาก <span className="font-bold text-slate-800">{totalPages}</span></span>
                <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shadow-sm"><i className="fa-solid fa-chevron-left"></i></button>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shadow-sm"><i className="fa-solid fa-chevron-right"></i></button>
                </div>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};