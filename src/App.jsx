import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

import SalesHistory from './SalesHistory';
import Home from './Home';
import POS from './POS';
import Stock from './Stock';
import Dashboard from './Dashboard';
import InventoryReport from './InventoryReport';
import BarcodeGenerator from './BarcodeGenerator';
import logo from './assets/logo.png';

const socket = io('http://localhost:5000');

const App = () => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, salesRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/products`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/sales`)
        ]);
        setProducts(productsRes.data);
        setSales(salesRes.data.sort((a, b) => b.id - a.id));
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    socket.on('product-updated', (updatedProducts) => {
      console.log('App.jsx: Product list updated via socket!');
      setProducts(updatedProducts);
    });
    
    socket.on('sale-updated', (updatedSales) => {
        console.log('App.jsx: Sales list updated via socket!');
        setSales(updatedSales.sort((a, b) => b.id - a.id));
    });

    return () => {
      socket.off('product-updated');
      socket.off('sale-updated');
    };
  }, []);

  const navLinkStyles = ({ isActive }) => {
    return `block py-2.5 px-4 rounded-lg transition duration-200 text-sm ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Loading Application...</div>;
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-100 font-sans">
        <aside className="w-64 bg-gray-800 text-white flex flex-col">
          <div className="flex items-center justify-center py-6 px-4">
            <img src={logo} alt="Logo" className="h-24 w-35 w-auto" />
          </div>
          
          <nav className="flex-grow px-4 py-6 space-y-2">
            <NavLink to="/" end className={navLinkStyles}>Home</NavLink>
            <NavLink to="/pos" className={navLinkStyles}>POS</NavLink>
            <NavLink to="/stock" className={navLinkStyles}>Stock</NavLink>
            <NavLink to="/dashboard" className={navLinkStyles}>Dashboard</NavLink>
            <NavLink to="/report" className={navLinkStyles}>Inventory Report</NavLink>
            <NavLink to="/barcode" className={navLinkStyles}>Barcode Generator</NavLink>
            <NavLink to="/history" className={navLinkStyles}>Sales History</NavLink>
          </nav>
        </aside>

        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard products={products} sales={sales} />} />
            <Route path="/" element={<Home />} />
            <Route path="/pos" element={<POS products={products} />} />
            {/* === จุดที่แก้ไข === */}
            <Route path="/stock" element={<Stock products={products} />} />
            <Route path="/report" element={<InventoryReport products={products} />} />
            <Route path="/barcode" element={<BarcodeGenerator products={products} />} />
            <Route path="/history" element={<SalesHistory sales={sales} loading={loading} />} />
          </Routes>
        </main>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
    </Router>
  );
};

export default App;