import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

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
// --------------------

const toLocalISOString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const formatMonthYear = (monthString) => {
    const date = new Date(`${monthString}-01`);
    return date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
};


const Dashboard = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeFrame, setTimeFrame] = useState('monthly');
  
  const [totalToday, setTotalToday] = useState(0);
  const [totalThisMonth, setTotalThisMonth] = useState(0);
  const [totalForSelectedDate, setTotalForSelectedDate] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  const [selectedDate, setSelectedDate] = useState(toLocalISOString(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(toLocalISOString(new Date()).slice(0, 7));
  const [lastFetchedDate, setLastFetchedDate] = useState(null);

  const LOW_STOCK_THRESHOLD = 10;

  const fetchTotals = async () => {
    const todayStr = toLocalISOString(new Date());
    const thisMonthStr = todayStr.slice(0, 7);
    setLastFetchedDate(todayStr);
    try {
      const [todayRes, monthRes, productsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/summary?date=${todayStr}`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/summary?month=${thisMonthStr}`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/products`)
      ]);
      
      // ** จุดที่แก้ไข: เพิ่มการตรวจสอบข้อมูลก่อนคำนวณ **
      const dailySalesData = todayRes.data?.salesByDate || [];
      const monthlySalesData = monthRes.data?.salesByDate || [];
      const productsData = productsRes.data || [];

      const dailyTotal = dailySalesData.reduce((acc, curr) => acc + curr.total, 0);
      setTotalToday(dailyTotal);
      const monthlyTotal = monthlySalesData.reduce((acc, curr) => acc + curr.total, 0);
      setTotalThisMonth(monthlyTotal);
      const lowStockProducts = productsData.filter(p => p.quantity <= LOW_STOCK_THRESHOLD);
      setLowStockCount(lowStockProducts.length);

    } catch (err) { console.error("Failed to fetch totals", err); }
  };
  
  // ... useEffects เหมือนเดิม ...
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
        let url = `${import.meta.env.VITE_API_URL}/api/summary`;
        const params = new URLSearchParams();

        if (timeFrame === 'daily' && selectedDate) {
            params.append('date', selectedDate);
        } else if (timeFrame === 'monthly' && selectedMonth) {
            params.append('month', selectedMonth);
        }
        
        url = `${url}?${params.toString()}`;

        try {
            const res = await axios.get(url);
            const salesData = res.data?.salesByDate || []; // ** จุดที่แก้ไข **
            
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

  // ... ส่วนของ JSX เหมือนเดิม ...
  return (
    <div className="p-4 sm:p-6 lg:p-8 font-sans bg-gray-50 min-h-full">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
            <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm">
                <div>
                    <select value={timeFrame} onChange={(e) => setTimeFrame(e.target.value)} className="border-none bg-transparent focus:ring-0">
                        <option value="monthly">Monthly</option>
                        <option value="daily">Daily</option>
                    </select>
                </div>
                {timeFrame === 'daily' && (
                    <div>
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border-none bg-transparent focus:ring-0"/>
                    </div>
                )}
                {timeFrame === 'monthly' && (
                    <div>
                        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="border-none bg-transparent focus:ring-0"/>
                    </div>
                )}
                 <button onClick={() => { fetchTotals(); fetchChartData(); }} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors">Refresh</button>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
                <div className="bg-indigo-500 p-3 rounded-full text-white"><ChartIcon /></div>
                <div>
                    <h3 className="text-sm font-medium text-gray-500">This Month's Sales</h3>
                    <p className="text-3xl font-bold text-gray-900">฿{totalThisMonth.toFixed(2)}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4 border-2 border-green-500">
                <div className="bg-green-500 p-3 rounded-full text-white"><CalendarIcon /></div>
                <div>
                    <h3 className="text-sm font-medium text-gray-500">Today's Sales</h3>
                    <p className="text-3xl font-bold text-gray-900">฿{totalToday.toFixed(2)}</p>
                </div>
            </div>
            {timeFrame === 'daily' && totalForSelectedDate > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
                    <div className="bg-yellow-500 p-3 rounded-full text-white"><SearchIcon /></div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Selected Day's Sales</h3>
                        <p className="text-3xl font-bold text-gray-900">฿{totalForSelectedDate.toFixed(2)}</p>
                    </div>
                </div>
            )}
            <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
                <div className="bg-red-500 p-3 rounded-full text-white"><AlertIcon /></div>
                <div>
                    <h3 className="text-sm font-medium text-gray-500">Low Stock Items</h3>
                    <p className="text-3xl font-bold text-gray-900">{lowStockCount} <span className="text-lg font-normal">items</span></p>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg min-h-[460px]">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Sales Chart ({timeFrame === 'monthly' ? formatMonthYear(selectedMonth) : new Date(selectedDate).toLocaleDateString('th-TH', { dateStyle: 'long' })})
            </h2>
            <div className="w-full h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <LoadingSpinner />
                        <p className="ml-4 text-gray-500">Loading Chart...</p>
                    </div>
                ) : error ? (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-red-600 bg-red-100 p-4 rounded-lg">{error}</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tickFormatter={(tick) => new Date(tick).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} tick={{ fill: '#6B7280' }} />
                            <YAxis tickFormatter={(value) => `฿${value > 0 ? (value/1000).toFixed(1) : 0}k`} tick={{ fill: '#6B7280' }} />
                            <Tooltip formatter={(value, name, props) => [`฿${value.toFixed(2)}`, `Date: ${new Date(props.payload.date).toLocaleDateString('th-TH')}`]} cursor={{fill: 'rgba(239, 246, 255, 0.5)'}} />
                            <Legend />
                            <Bar dataKey="total" name="Total Sales" fill="#4f46e5" barSize={30} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    </div>
  );
};

export default Dashboard;