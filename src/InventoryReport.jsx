import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// ฟังก์ชันสำหรับสร้างสีแบบสุ่มสำหรับกราฟ
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// ไอคอนสำหรับการ์ด
const CubeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const CollectionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const CashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;


const InventoryReport = ({ products = [] }) => {

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
    
    const valueByBrand = products.reduce((acc, p) => {
      const brand = p.brand || 'Unbranded';
      const value = p.price * p.quantity;
      if (!acc[brand]) {
        acc[brand] = 0;
      }
      acc[brand] += value;
      return acc;
    }, {});

    const chartData = Object.keys(valueByBrand).map(brand => ({
      name: brand,
      value: valueByBrand[brand]
    })).sort((a, b) => b.value - a.value);

    return { totalSKU, totalItems, totalValue, chartData };
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
    <div className="p-4 sm:p-6 lg:p-8 font-sans">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Inventory Report</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
            <div className="bg-blue-500 p-3 rounded-full text-white"><CubeIcon /></div>
            <div>
                <h3 className="text-sm font-medium text-gray-500">Total Products (SKU)</h3>
                <p className="text-3xl font-bold text-gray-900">{summaryData.totalSKU}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
            <div className="bg-teal-500 p-3 rounded-full text-white"><CollectionIcon /></div>
            <div>
                <h3 className="text-sm font-medium text-gray-500">Total Items in Stock</h3>
                <p className="text-3xl font-bold text-gray-900">{summaryData.totalItems.toLocaleString()}</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
            <div className="bg-amber-500 p-3 rounded-full text-white"><CashIcon /></div>
            <div>
                <h3 className="text-sm font-medium text-gray-500">Total Stock Value</h3>
                <p className="text-3xl font-bold text-gray-900">฿{summaryData.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Stock Value by Brand</h2>
          <div className="w-full h-80">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={summaryData.chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {summaryData.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">All Products Details</h2>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name or barcode..."
              className="block w-full md:w-1/2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="min-h-[400px]">
            {filteredProducts.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                    <p className="text-center text-gray-500 py-10">
                        {searchTerm ? `No products found for "${searchTerm}"` : 'No products in inventory.'}
                    </p>
                </div>
            ) : (
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map(p => (
                    <tr key={p.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{p.brand || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{p.size || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{p.color || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">฿{p.price.toFixed(2)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{p.quantity}</td>
                    </tr>
                  ))}
                </tbody>
            </table>
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
                 <span className="text-sm text-gray-700">
                    Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                </span>
                <div className="flex items-center space-x-2">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
                </div>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default InventoryReport;