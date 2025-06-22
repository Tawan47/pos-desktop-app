import React, { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Dialog, Transition } from '@headlessui/react';

const LOW_STOCK_THRESHOLD = 10;

const Stock = ({ products }) => { // รับ products จาก props
  // ไม่ต้องมี useState และ useEffect สำหรับดึงข้อมูลที่นี่แล้ว

  const [product, setProduct] = useState({
    barcode: '', name: '', brand: '', size: '', color: '', price: 0, quantity: 0
  });
  const [editingId, setEditingId] = useState(null);
  const [scanBarcode, setScanBarcode] = useState('');
  const [receiveQty, setReceiveQty] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ฟังก์ชันสำหรับเปิด/ปิด Modal
  const closeModal = () => {
      setIsModalOpen(false);
      setTimeout(() => {
          clearForm();
      }, 300);
  };
  const openModal = () => setIsModalOpen(true);

  // เมื่อมีการค้นหา ให้กลับไปที่หน้า 1 เสมอ
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleChange = (field, value) => {
    setProduct(prev => ({ ...prev, [field]: value }));
  };

  const clearForm = () => {
    setProduct({ barcode: '', name: '', brand: '', size: '', color: '', price: 0, quantity: 0 });
    setEditingId(null);
  };

  const handleSubmitForm = () => {
    if (editingId) {
      saveProduct();
    } else {
      addProduct();
    }
  };

  const addProduct = () => {
    const { barcode, name, price } = product;
    if (!barcode || !name || price <= 0) {
      return toast.error('กรุณากรอกบาร์โค้ด, ชื่อสินค้า และราคาให้ถูกต้อง');
    }
    axios.post(`${import.meta.env.VITE_API_URL}/api/products`, product)
      .then(() => {
        closeModal();
        toast.success('เพิ่มสินค้าใหม่สำเร็จ!');
      })
      .catch(err => toast.error('เกิดข้อผิดพลาดในการเพิ่มสินค้า'));
  };

  const handleEdit = (prod) => {
    setEditingId(prod.id);
    setProduct({ ...prod });
    openModal();
  };

  const saveProduct = () => {
    axios.put(`${import.meta.env.VITE_API_URL}/api/products/${editingId}`, product)
      .then(() => {
        closeModal();
        toast.success(`แก้ไขสินค้า "${product.name}" สำเร็จ!`);
      })
      .catch(err => toast.error('เกิดข้อผิดพลาดในการแก้ไขสินค้า'));
  };

  const removeProduct = (id) => {
    if (!window.confirm('คุณแน่ใจที่จะลบสินค้านี้?')) return;
    axios.delete(`${import.meta.env.VITE_API_URL}/api/products/${id}`)
      .then(() => toast.success('ลบสินค้าสำเร็จ!'))
      .catch(err => toast.error('เกิดข้อผิดพลาดในการลบสินค้า'));
  };

  const receiveStock = () => {
    if (!scanBarcode || receiveQty <= 0) return toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
    const exist = products.find(p => p.barcode === scanBarcode);
    if (!exist) return toast.error('ไม่พบสินค้าที่มีบาร์โค้ดนี้');
    
    const newQuantity = Number(exist.quantity) + Number(receiveQty);
    const updatedProduct = { ...exist, quantity: newQuantity };

    axios.put(`${import.meta.env.VITE_API_URL}/api/products/${exist.id}`, updatedProduct)
      .then(() => {
        toast.success(`เพิ่มสต็อก "${exist.name}" จำนวน ${receiveQty} ชิ้น`);
        setScanBarcode('');
        setReceiveQty(1);
      })
      .catch(err => toast.error('เกิดข้อผิดพลาดในการเพิ่มสต็อก'));
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const inputStyle = "mt-1 block w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Manage Stock</h1>
          <button 
            onClick={() => { clearForm(); openModal(); }} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Add New Product
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Receive Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Scan Barcode</label>
                <input
                  type="text"
                  placeholder="Barcode or Product Name"
                  value={scanBarcode}
                  onChange={e => setScanBarcode(e.target.value)}
                  className={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                 <input
                  type="number"
                  placeholder="Quantity"
                  min="1"
                  value={receiveQty}
                  onChange={e => setReceiveQty(+e.target.value)}
                  className={inputStyle}
                />
              </div>
              <button onClick={receiveStock} className="md:col-span-3 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-base">
                Add to Stock
              </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Product List</h2>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by name or barcode..."
                    className="block w-full md:w-1/2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="min-h-[500px]">
                {filteredProducts.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-center text-gray-500 py-10">
                            {searchTerm ? `No products found for "${searchTerm}"` : 'No products available in stock.'}
                        </p>
                    </div>
                ) : (
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map(prod => (
                        <tr key={prod.id} className={`hover:bg-gray-50 ${prod.quantity <= LOW_STOCK_THRESHOLD ? 'bg-red-50' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{prod.barcode}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prod.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prod.brand}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">฿{prod.price.toFixed(2)}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-center ${prod.quantity <= LOW_STOCK_THRESHOLD ? 'font-bold text-red-600' : 'text-gray-500'}`}>
                                {prod.quantity}
                                {prod.quantity <= LOW_STOCK_THRESHOLD && (
                                <span className="ml-2 text-xs font-semibold bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                                    LOW
                                </span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <button onClick={() => handleEdit(prod)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                <button onClick={() => removeProduct(prod.id)} className="text-red-600 hover:text-red-900">Delete</button>
                            </td>
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

      {/* === Modal for Add/Edit Product === */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 border-b pb-4 mb-6">
                    {editingId ? `Edit Product (ID: ${editingId})` : 'Add New Product'}
                  </Dialog.Title>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                    {['barcode', 'name', 'brand', 'size', 'color'].map(field => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 capitalize">{field}</label>
                        <input type="text" value={product[field]} onChange={e => handleChange(field, e.target.value)} placeholder={`Enter ${field}`} className={inputStyle} />
                      </div>
                    ))}
                    <div key="price">
                      <label className="block text-sm font-medium text-gray-700">Price</label>
                      <input type="number" min="0" value={product.price} onChange={e => handleChange('price', +e.target.value)} className={inputStyle} />
                    </div>
                    <div key="quantity">
                      <label className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input type="number" min="0" value={product.quantity} onChange={e => handleChange('quantity', +e.target.value)} className={inputStyle} />
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-end space-x-4">
                    <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
                    <button type="button" onClick={handleSubmitForm} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                      {editingId ? 'Save Changes' : 'Add Product'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default Stock;