"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { toLocalISOString, getApiUrl } from '@/lib/utils';
import { ChartDataItem, Product } from '@/types';

const API_URL = getApiUrl();

// --- ไอคอน ---
const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);
const ChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);
const LoadingSpinner = () => (
    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
const AlertIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const formatMonthYear = (monthString: string) => {
    const date = new Date(`${monthString}-01`);
    return date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
};

const Dashboard = () => {
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeFrame, setTimeFrame] = useState<'monthly' | 'daily'>('monthly');
  
  const [totalToday, setTotalToday] = useState(0);
  const [totalThisMonth, setTotalThisMonth] = useState(0);
  const [totalForSelectedDate, setTotalForSelectedDate] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  const [selectedDate, setSelectedDate] = useState(toLocalISOString(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(toLocalISOString(new Date()).slice(0, 7));
  const [lastFetchedDate, setLastFetchedDate] = useState<string | null>(null);

  const LOW_STOCK_THRESHOLD = 10;

  const fetchTotals = async () => {
    const todayStr = toLocalISOString(new Date());
    const thisMonthStr = todayStr.slice(0, 7);
    setLastFetchedDate(todayStr);
    try {
      const [todayRes, monthRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/api/summary?date=${todayStr}`),
        axios.get(`${API_URL}/api/summary?month=${thisMonthStr}`),
        axios.get(`${API_URL}/api/products`)
      ]);
      
      const dailySalesData: ChartDataItem[] = todayRes.data?.salesByDate || [];
      const monthlySalesData: ChartDataItem[] = monthRes.data?.salesByDate || [];
      const productsData: Product[] = productsRes.data || [];

      const dailyTotal = dailySalesData.reduce((acc, curr) => acc + curr.total, 0);
      setTotalToday(dailyTotal);
      const monthlyTotal = monthlySalesData.reduce((acc, curr) => acc + curr.total, 0);
      setTotalThisMonth(monthlyTotal);
      const lowStockProducts = productsData.filter(p => p.quantity <= LOW_STOCK_THRESHOLD);
      setLowStockCount(lowStockProducts.length);

    } catch (err) { console.error("Failed to fetch totals", err); }
  };
  
  useEffect(() => {
    const checkAndRefreshData = () => {
        const todayStr = toLocalISOString(new Date());
        if (todayStr !== lastFetchedDate) {
            fetchTotals();
        }
    };
    fetchTotals();
    window.addEventListener('focus', checkAndRefreshData);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') { checkAndRefreshData(); }
    });
    return () => {
        window.removeEventListener('focus', checkAndRefreshData);
        document.removeEventListener('visibilitychange', checkAndRefreshData);
    };
  }, [lastFetchedDate]);

  useEffect(() => {
    const fetchChartData = async () => {
        setLoading(true);
        let url = `${API_URL}/api/summary`;
        const params = new URLSearchParams();

        if (timeFrame === 'daily' && selectedDate) {
            params.append('date', selectedDate);
        } else if (timeFrame === 'monthly' && selectedMonth) {
            params.append('month', selectedMonth);
        }
        
        url = `${url}?${params.toString()}`;

        try {
            const res = await axios.get(url);
            const salesData: ChartDataItem[] = res.data?.salesByDate || [];
            
            if (timeFrame === 'daily' && salesData.length > 0) {
                setTotalForSelectedDate(salesData.reduce((acc, item) => acc + item.total, 0));
            } else {
                setTotalForSelectedDate(0);
            }

            const data = timeFrame === 'daily' && salesData.length > 0
              ? [{ ...salesData[0], name: salesData[0].date }]
              : salesData;
            setChartData(data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch chart data", err);
            setError('ไม่สามารถดึงข้อมูลกราฟได้');
        } finally {
            setLoading(false);
        }
    };
    fetchChartData();
  }, [timeFrame, selectedDate, selectedMonth]);

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">ภาพรวมธุรกิจ</h1>
              <p className="text-slate-500 font-medium mt-1">สรุปยอดขายและสถิติที่คุณควรรู้</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center shadow-inner">
                    <select value={timeFrame} onChange={(e) => setTimeFrame(e.target.value as 'monthly' | 'daily')} className="bg-transparent border-none text-sm font-semibold text-slate-700 outline-none focus:ring-0 cursor-pointer">
                        <option value="monthly">รายเดือน</option>
                        <option value="daily">รายวัน</option>
                    </select>
                </div>
                {timeFrame === 'daily' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-inner">
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border-none text-sm font-semibold text-slate-700 outline-none focus:ring-0"/>
                    </div>
                )}
                {timeFrame === 'monthly' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-inner">
                        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent border-none text-sm font-semibold text-slate-700 outline-none focus:ring-0"/>
                    </div>
                )}
                 <button onClick={() => { fetchTotals(); setTimeFrame(timeFrame); }} className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95">
                    <i className="fa-solid fa-arrows-rotate"></i>
                 </button>
            </div>
        </div>
        
        {/* Metric Cards - Sleek Gradients */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl shadow-xl shadow-indigo-500/20 text-white relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 bg-white/10 w-32 h-32 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md shadow-inner"><ChartIcon /></div>
                  <div>
                      <h3 className="text-indigo-100 font-medium text-sm">ยอดขายประจำเดือนนี้</h3>
                      <p className="text-3xl font-extrabold mt-1 tracking-tight">฿{totalThisMonth.toLocaleString(undefined, {minimumFractionDigits: 0})}</p>
                  </div>
                </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl shadow-xl shadow-emerald-500/20 text-white relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 bg-white/10 w-32 h-32 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md shadow-inner"><CalendarIcon /></div>
                  <div>
                      <h3 className="text-emerald-100 font-medium text-sm">ยอดขายวันนี้</h3>
                      <p className="text-3xl font-extrabold mt-1 tracking-tight">฿{totalToday.toLocaleString(undefined, {minimumFractionDigits: 0})}</p>
                  </div>
                </div>
            </div>
            
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 rounded-3xl shadow-xl shadow-rose-500/20 text-white relative overflow-hidden group sm:col-span-2 lg:col-span-1">
                <div className="absolute -right-6 -top-6 bg-white/10 w-32 h-32 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md shadow-inner"><AlertIcon /></div>
                  <div>
                      <h3 className="text-rose-100 font-medium text-sm">รายการสต็อกต่ำ</h3>
                      <p className="text-3xl font-extrabold mt-1 tracking-tight">{lowStockCount} <span className="text-base font-medium opacity-80">ซิ้น</span></p>
                  </div>
                </div>
            </div>
            
            {/* Conditional Selected Day Sales */}
            {timeFrame === 'daily' && totalForSelectedDate > 0 && (
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 rounded-3xl shadow-xl shadow-amber-500/20 text-white relative overflow-hidden group sm:col-span-2 lg:col-span-3">
                    <div className="absolute -right-6 -top-6 bg-white/10 w-32 h-32 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md shadow-inner"><SearchIcon /></div>
                      <div>
                          <h3 className="text-amber-100 font-medium text-sm">ยอดขายของวันที่เลือก ({new Date(selectedDate).toLocaleDateString('th-TH')})</h3>
                          <p className="text-3xl font-extrabold mt-1 tracking-tight">฿{totalForSelectedDate.toLocaleString(undefined, {minimumFractionDigits: 0})}</p>
                      </div>
                    </div>
                </div>
            )}
        </div>

        {/* Chart Container */}
        <div className="bg-white px-2 py-6 sm:p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6 px-4 sm:px-2">
              <i className="fa-solid fa-chart-column text-blue-500 mr-2"></i> แผนภูมิการขาย
              <span className="ml-2 text-sm font-medium text-slate-400">
                ({timeFrame === 'monthly' ? formatMonthYear(selectedMonth) : new Date(selectedDate).toLocaleDateString('th-TH', { dateStyle: 'long' })})
              </span>
            </h2>
            
            <div className="w-full h-[400px] overflow-hidden">
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-full">
                        <LoadingSpinner />
                        <p className="mt-4 text-slate-500 font-semibold animate-pulse">กำลังโหลดข้อมูลแผนภูมิ...</p>
                    </div>
                ) : error ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-3">
                           <i className="fa-solid fa-circle-exclamation text-xl"></i>
                           <p className="font-semibold">{error}</p>
                        </div>
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-full text-slate-400">
                        <i className="fa-solid fa-chart-line text-6xl mb-4 opacity-30"></i>
                        <p className="font-semibold text-lg">ยังไม่มีข้อมูลยอดขายในช่วงเวลานี้</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(tick) => new Date(tick).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} 
                              tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} 
                              axisLine={false}
                              tickLine={false}
                              dy={10}
                            />
                            <YAxis 
                              tickFormatter={(value) => `฿${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`} 
                              tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} 
                              axisLine={false}
                              tickLine={false}
                              dx={-10}
                            />
                            <Tooltip 
                              cursor={{fill: '#f1f5f9'}} 
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 600, padding: '12px 16px' }}
                              formatter={(value: any) => [`฿${Number(value).toLocaleString()}`, 'ยอดขาย']}
                              labelFormatter={(label) => new Date(label).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                            />
                            <Bar 
                              dataKey="total" 
                              name="Total Sales" 
                              fill="#4f46e5" 
                              radius={[8, 8, 8, 8]} 
                              maxBarSize={50}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    </div>
  );
};

export default Dashboard;