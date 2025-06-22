import React, { useState, useMemo, useEffect } from 'react';

// --- ฟังก์ชันผู้ช่วยสำหรับจัดการวันที่ ---
const toLocalISOString = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// ไอคอนสำหรับสถานะการจ่ายเงิน (จากโค้ดเดิม)
const PaymentIcon = ({ method }) => {
    const isCash = method === 'เงินสด';
    const iconClass = isCash ? 'fa-solid fa-money-bill-wave' : 'fa-solid fa-qrcode';
    const colorClass = isCash ? 'text-emerald-600' : 'text-sky-600';
    return <i className={`${iconClass} ${colorClass}`}></i>;
};

// --- Component ใหม่สำหรับปุ่ม Filter ---
const FilterButton = ({ text, onClick, isActive }) => {
    const activeClass = 'bg-sky-500 text-white shadow';
    const inactiveClass = 'bg-white text-slate-700 hover:bg-slate-100';
    return (
        <button 
            onClick={onClick}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${isActive ? activeClass : inactiveClass}`}
        >
            {text}
        </button>
    );
};


const SalesHistory = ({ sales, loading }) => {
    const [expandedSaleId, setExpandedSaleId] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    // --- State ใหม่สำหรับติดตามว่าปุ่มไหนถูกกด ---
    const [activeFilter, setActiveFilter] = useState('all'); // 'today', 'yesterday', 'this_month', 'custom', 'all'


    const handleFilterChange = (filterType) => {
        setActiveFilter(filterType);
        const today = new Date();

        switch (filterType) {
            case 'today': {
                const todayStr = toLocalISOString(today);
                setStartDate(todayStr);
                setEndDate(todayStr);
                break;
            }
            case 'yesterday': {
                const yesterday = new Date();
                yesterday.setDate(today.getDate() - 1);
                const yesterdayStr = toLocalISOString(yesterday);
                setStartDate(yesterdayStr);
                setEndDate(yesterdayStr);
                break;
            }
            case 'this_month': {
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                setStartDate(toLocalISOString(firstDay));
                setEndDate(toLocalISOString(lastDay));
                break;
            }
            case 'all': {
                setStartDate('');
                setEndDate('');
                break;
            }
            case 'custom':
                // แค่เปิดโหมด custom, ไม่ต้องตั้งค่าวันที่
                break;
            default:
                setStartDate('');
                setEndDate('');
        }
    };

    // ตั้งค่าเริ่มต้นให้เป็น "วันนี้"
    useEffect(() => {
        handleFilterChange('today');
    }, []);

    const toggleExpand = (saleId) => {
        setExpandedSaleId(expandedSaleId === saleId ? null : saleId);
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return 'ไม่มีข้อมูลวันที่';
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: '2-digit', month: 'short', day: 'numeric',
        });
    };

    const filteredSales = useMemo(() => {
        if (!startDate && !endDate) return sales;
        return sales.filter(sale => {
            if (!sale.date) return false;
            const saleDate = sale.date.substring(0, 10);
            return saleDate >= startDate && saleDate <= endDate;
        });
    }, [sales, startDate, endDate]);

    const totalFilteredAmount = useMemo(() => {
        return filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    }, [filteredSales]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full text-center">
                <i className="fas fa-spinner fa-spin fa-3x text-teal-500"></i>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 h-full overflow-y-auto bg-slate-100">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6">ประวัติการขาย</h1>

            {/* --- Filter UI ที่ออกแบบใหม่ --- */}
            <div className="p-4 bg-white rounded-xl shadow-sm mb-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                    <FilterButton text="วันนี้" onClick={() => handleFilterChange('today')} isActive={activeFilter === 'today'} />
                    <FilterButton text="เมื่อวาน" onClick={() => handleFilterChange('yesterday')} isActive={activeFilter === 'yesterday'} />
                    <FilterButton text="เดือนนี้" onClick={() => handleFilterChange('this_month')} isActive={activeFilter === 'this_month'} />
                    <FilterButton text="เลือกช่วงเอง" onClick={() => handleFilterChange('custom')} isActive={activeFilter === 'custom'} />
                    <FilterButton text="ดูทั้งหมด" onClick={() => handleFilterChange('all')} isActive={activeFilter === 'all'} />
                </div>
                
                {activeFilter === 'custom' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                         <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-slate-600 mb-1">วันที่เริ่มต้น</label>
                            <input type="date" id="startDate" value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500" />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-slate-600 mb-1">วันที่สิ้นสุด</label>
                            <input type="date" id="endDate" value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500" />
                        </div>
                    </div>
                )}
            </div>
            
            <div className="mb-4 text-slate-600 font-semibold">
                ผลลัพธ์: <span className="text-sky-600">{filteredSales.length}</span> รายการ
                <span className="mx-2">|</span>
                ยอดขายรวม: <span className="text-sky-600">฿{totalFilteredAmount.toFixed(2)}</span>
            </div>

            <div className="space-y-4">
                {sales.length === 0 && !loading ? (
                    <div className="text-center text-slate-400 pt-20">
                         <i className="fas fa-receipt fa-4x mb-4 text-slate-300"></i>
                         <p className="font-semibold text-xl">ยังไม่มีข้อมูลการขาย</p>
                    </div>
                ) : filteredSales.length === 0 && !loading ? (
                    <div className="text-center text-slate-400 pt-20">
                        <i className="fa-solid fa-calendar-xmark fa-4x mb-4 text-slate-300"></i>
                        <p className="font-semibold text-xl">ไม่พบข้อมูลในช่วงวันที่ที่เลือก</p>
                    </div>
                ) : (
                    filteredSales.map(sale => {
                        const { id, invoiceNumber, subtotal = 0, total = 0, discount = 0, extraCost = 0 } = sale;
                        const isExpanded = expandedSaleId === id;

                        return (
                            <div key={id} className="bg-white rounded-xl shadow-md transition-all duration-300 hover:shadow-lg">
                                <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => toggleExpand(id)}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-lg text-slate-500"><i className="fa-solid fa-receipt text-xl"></i></div>
                                        <div>
                                            <p className="font-bold text-slate-800">{invoiceNumber || 'N/A'}</p>
                                            <p className="text-sm text-slate-500">{formatDate(sale.date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="font-extrabold text-xl md:text-2xl text-sky-500">฿{total.toFixed(2)}</p>
                                            <div className="flex items-center justify-end gap-2 text-xs text-slate-500"><PaymentIcon method={sale.paymentMethod} /><span>{sale.paymentMethod || 'N/A'}</span></div>
                                        </div>
                                        <div className="text-slate-400"><i className={`fas fa-chevron-down transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i></div>
                                    </div>
                                </div>
                                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}>
                                    <div className="bg-slate-50/70 p-4 border-t border-slate-200">
                                        <table className="w-full text-sm">
                                            <thead><tr className="border-b border-slate-200"><th className="p-2 text-left font-semibold text-slate-500">สินค้า</th><th className="p-2 w-24 text-right font-semibold text-slate-500">ราคา</th><th className="p-2 w-16 text-center font-semibold text-slate-500">จำนวน</th><th className="p-2 w-24 text-right font-semibold text-slate-500">รวม</th></tr></thead>
                                            <tbody>
                                                {(sale.items || []).map((item, index) => (
                                                    <tr key={index} className="odd:bg-white even:bg-transparent"><td className="p-2 text-slate-700 font-medium">{item.name || 'ไม่มีชื่อสินค้า'}</td><td className="p-2 text-slate-600 text-right">฿{(item.price || 0).toFixed(2)}</td><td className="p-2 text-slate-600 text-center">x{item.qty || 0}</td><td className="p-2 font-semibold text-slate-800 text-right">฿{((item.price || 0) * (item.qty || 0)).toFixed(2)}</td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div className="mt-4 max-w-sm ml-auto space-y-2 text-sm">
                                            <div className="flex justify-between"><span className="text-slate-500">ยอดรวมย่อย:</span><span className="font-semibold text-slate-700">฿{subtotal.toFixed(2)}</span></div>
                                            {discount > 0 && (<div className="flex justify-between text-rose-600"><span>ส่วนลด:</span><span className="font-semibold">- ฿{discount.toFixed(2)}</span></div>)}
                                            {extraCost > 0 && (<div className="flex justify-between text-sky-600"><span>ค่าแรง/อื่นๆ:</span><span className="font-semibold">+ ฿{extraCost.toFixed(2)}</span></div>)}
                                            <hr className="my-2 !mt-3 !mb-3 border-slate-200"/>
                                            <div className="flex justify-between bg-sky-50 p-3 rounded-lg"><span className="font-bold text-base text-slate-800">ยอดสุทธิ:</span><span className="font-extrabold text-base text-sky-600">฿{total.toFixed(2)}</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};

export default SalesHistory;