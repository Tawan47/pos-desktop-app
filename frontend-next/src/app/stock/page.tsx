"use client";
import React, { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Dialog, Transition } from '@headlessui/react';
import { useStore } from '@/providers/StoreProvider';
import BarcodeScanner from '@/components/BarcodeScanner';

const LOW_STOCK_THRESHOLD = 10;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Stock() {
  const { products } = useStore();

  const [product, setProduct] = useState({
    barcode: '', name: '', brand: '', size: '', color: '', price: 0, quantity: 0
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [scanBarcode, setScanBarcode] = useState('');
  const [receiveQty, setReceiveQty] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeScanTarget, setActiveScanTarget] = useState<'form' | 'receive'>('form');

  const closeModal = () => {
      setIsModalOpen(false);
      setTimeout(() => {
          clearForm();
      }, 300);
  };
  const openModal = () => setIsModalOpen(true);

  const openScanner = (target: 'form' | 'receive') => {
    setActiveScanTarget(target);
    setIsScannerOpen(true);
  };

  const handleScanSuccess = (decodedText: string) => {
    if (activeScanTarget === 'form') {
      setProduct(prev => ({ ...prev, barcode: decodedText }));
    } else {
      setScanBarcode(decodedText);
    }
    setIsScannerOpen(false);
    toast.success(`สแกนสำเร็จ: ${decodedText}`);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleChange = (field: string, value: any) => {
    setProduct(prev => ({ ...prev, [field]: value }));
  };

  const clearForm = () => {
    setProduct({ barcode: '', name: '', brand: '', size: '', color: '', price: 0, quantity: 0 });
    setEditingId(null);
  };

  const handleSubmitForm = () => {
    if (editingId) saveProduct();
    else addProduct();
  };

  const addProduct = () => {
    const { barcode, name, price } = product;
    if (!barcode || !name || price <= 0) {
      return toast.error('กรุณากรอกบาร์โค้ด, ชื่อสินค้า และราคาให้ถูกต้อง');
    }
    axios.post(`${API_URL}/api/products`, product)
      .then(() => { closeModal(); toast.success('เพิ่มสินค้าใหม่สำเร็จ!'); })
      .catch((err) => toast.error('เกิดข้อผิดพลาดในการเพิ่มสินค้า'));
  };

  const handleEdit = (prod: any) => {
    setEditingId(prod.id);
    setProduct({ ...prod });
    openModal();
  };

  const saveProduct = () => {
    axios.put(`${API_URL}/api/products/${editingId}`, product)
      .then(() => { closeModal(); toast.success(`แก้ไขสินค้า "${product.name}" สำเร็จ!`); })
      .catch((err) => toast.error('เกิดข้อผิดพลาดในการแก้ไขสินค้า'));
  };

  const removeProduct = (id: number) => {
    if (!window.confirm('คุณแน่ใจที่จะลบสินค้านี้?')) return;
    axios.delete(`${API_URL}/api/products/${id}`)
      .then(() => toast.success('ลบสินค้าสำเร็จ!'))
      .catch((err) => toast.error('เกิดข้อผิดพลาดในการลบสินค้า'));
  };

  const receiveStock = () => {
    if (!scanBarcode || receiveQty <= 0) return toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
    const exist = products.find(p => p.barcode === scanBarcode);
    if (!exist) return toast.error('ไม่พบสินค้าที่มีบาร์โค้ดนี้');
    
    const newQuantity = Number(exist.quantity) + Number(receiveQty);
    const updatedProduct = { ...exist, quantity: newQuantity };

    axios.put(`${API_URL}/api/products/${exist.id}`, updatedProduct)
      .then(() => {
        toast.success(`เพิ่มสต็อก "${exist.name}" จำนวน ${receiveQty} ชิ้น`);
        setScanBarcode('');
        setReceiveQty(1);
      })
      .catch((err) => toast.error('เกิดข้อผิดพลาดในการเพิ่มสต็อก'));
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.toString().toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const inputStyle = "mt-1 block w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 font-sans">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">จัดการคลังสินค้า</h1>
            <p className="text-slate-500 font-medium mt-1">เพิ่ม, แก้ไข, และเติมสต็อกสินค้าในระบบ</p>
          </div>
          <button onClick={() => { clearForm(); openModal(); }} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl transition-transform active:scale-95 shadow-xl shadow-blue-500/30 flex items-center justify-center">
            <i className="fa-solid fa-plus text-lg mr-2"></i>
            เพิ่มสินค้าใหม่
          </button>
        </div>
        
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 md:p-8 rounded-3xl shadow-xl shadow-emerald-500/20 text-white relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10"><i className="fa-solid fa-boxes-packing text-emerald-200"></i> สแกนรับสินค้าเข้าคลัง (เติมสต็อก)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end relative z-10">
              <div className="sm:col-span-7">
                <label className="block text-sm font-semibold text-emerald-100 mb-1">รหัสบาร์โค้ด / ชื่อสินค้า</label>
                <div className="relative flex gap-2">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><i className="fa-solid fa-barcode"></i></div>
                        <input type="text" placeholder="สแกนหรือพิมพ์เพื่อค้นหา..." value={scanBarcode} onChange={e => setScanBarcode(e.target.value)} className="mt-1 block w-full pl-10 px-3 py-3 rounded-2xl border-none shadow-inner text-slate-800 font-medium focus:ring-4 focus:ring-emerald-300/50 bg-white" />
                    </div>
                    <button onClick={() => openScanner('receive')} className="mt-1 p-3 bg-white text-emerald-600 rounded-2xl shadow-sm hover:bg-emerald-50 transition-colors flex items-center justify-center border border-emerald-100" title="ใช้กล้องสแกน">
                        <i className="fa-solid fa-camera text-xl"></i>
                    </button>
                </div>
                {/* MATCHED PRODUCT INFO */}
                {scanBarcode && products.find(p => p.barcode === scanBarcode) && (
                  <div className="mt-2 p-2 bg-emerald-700/50 rounded-xl flex items-center justify-between text-sm animate-pulse">
                    <span className="font-bold"><i className="fa-solid fa-circle-check mr-1"></i> {products.find(p => p.barcode === scanBarcode)?.name}</span>
                    <span className="bg-white text-emerald-700 px-2 py-0.5 rounded-lg font-bold">สต็อกปัจจุบัน: {products.find(p => p.barcode === scanBarcode)?.quantity}</span>
                  </div>
                )}
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-semibold text-emerald-100 mb-1">จำนวนที่เติม</label>
                 <input type="number" placeholder="จำนวน" min="1" value={receiveQty} onChange={e => setReceiveQty(+e.target.value)} className="mt-1 block w-full px-4 py-3 rounded-2xl border-none shadow-inner text-slate-800 font-bold text-center focus:ring-4 focus:ring-emerald-300/50 bg-white" />
              </div>
              <button onClick={receiveStock} className="sm:col-span-2 h-[52px] w-full bg-slate-900 hover:bg-black text-white font-bold rounded-2xl transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2 mt-2 sm:mt-0">
                  <i className="fa-solid fa-check"></i> ยืนยัน
              </button>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><i className="fa-solid fa-list-check text-blue-500"></i> รายการสินค้า</h2>
                <div className="w-full sm:w-72 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><i className="fa-solid fa-magnifying-glass"></i></div>
                    <input type="text" placeholder="ค้นหาสินค้า..." className="block w-full pl-10 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl shadow-inner text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                    <div className="hidden md:block overflow-x-auto custom-scrollbar rounded-xl border border-slate-100">
                        <table className="min-w-full divide-y divide-slate-200 text-sm xl:text-base">
                            <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider rounded-tl-xl text-xs xl:text-sm">บาร์โค้ด</th>
                                <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-xs xl:text-sm">ชื่อสินค้า</th>
                                <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-xs xl:text-sm">แบรนด์/หมวดหมู่</th>
                                <th className="px-6 py-4 text-left font-bold text-slate-500 uppercase tracking-wider text-xs xl:text-sm">ราคา</th>
                                <th className="px-6 py-4 text-center font-bold text-slate-500 uppercase tracking-wider text-xs xl:text-sm">สต็อก</th>
                                <th className="px-6 py-4 text-right font-bold text-slate-500 uppercase tracking-wider rounded-tr-xl text-xs xl:text-sm">จัดการ</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                            {currentItems.map(prod => (
                                <tr key={prod.id} className={`hover:bg-slate-50 transition-colors ${prod.quantity <= LOW_STOCK_THRESHOLD ? 'bg-rose-50/50' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-600"><i className="fa-solid fa-barcode mr-2 text-slate-300"></i> {prod.barcode}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">{prod.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">{prod.brand || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-blue-600">฿{prod.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-3 py-1 rounded-full font-bold text-xs ${prod.quantity <= LOW_STOCK_THRESHOLD ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {prod.quantity} ชิ้น
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold flex justify-end gap-2">
                                        <button onClick={() => handleEdit(prod)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-500 hover:text-white transition-colors" title="แก้ไข"><i className="fa-solid fa-pen"></i></button>
                                        <button onClick={() => removeProduct(Number(prod.id))} className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-colors" title="ลบ"><i className="fa-solid fa-trash"></i></button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE CARD VIEW */}
                    <div className="md:hidden grid grid-cols-1 gap-4">
                        {currentItems.map(prod => (
                            <div key={prod.id} className={`bg-white p-5 rounded-2xl shadow-sm border flex flex-col gap-3 relative overflow-hidden ${prod.quantity <= LOW_STOCK_THRESHOLD ? 'border-rose-200' : 'border-slate-200'}`}>
                                {prod.quantity <= LOW_STOCK_THRESHOLD && <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm tracking-widest uppercase">LOW STOCK</div>}
                                <div className="flex justify-between items-start pt-1">
                                    <span className="font-extrabold text-slate-800 text-lg leading-tight pr-12">{prod.name}</span>
                                </div>
                                <div className="flex flex-col text-sm text-slate-600 bg-slate-50 p-3 rounded-xl gap-2 font-medium">
                                    <span className="flex items-center gap-2"><i className="fa-solid fa-barcode text-slate-400 w-4"></i> {prod.barcode}</span>
                                    {prod.brand && <span className="flex items-center gap-2"><i className="fa-solid fa-tag text-slate-400 w-4"></i> {prod.brand}</span>}
                                    <div className="flex justify-between items-center mt-1 border-t border-slate-200 pt-2">
                                        <span className="font-extrabold text-blue-600 text-lg">฿{prod.price.toLocaleString(undefined, {minimumFractionDigits: 0})}</span>
                                        <span className={`px-2 py-1 rounded-lg font-bold text-xs ${prod.quantity <= LOW_STOCK_THRESHOLD ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            เหลือ {prod.quantity} ชิ้น
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-1">
                                    <button onClick={() => handleEdit(prod)} className="flex-1 flex items-center justify-center gap-2 text-indigo-700 font-bold px-4 py-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors active:scale-95"><i className="fa-solid fa-pen"></i> แก้ไข</button>
                                    <button onClick={() => removeProduct(Number(prod.id))} className="w-12 flex items-center justify-center text-rose-600 font-bold bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors active:scale-95 text-lg"><i className="fa-solid fa-trash"></i></button>
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
                        <div className="flex gap-2">
                          <input type="text" value={(product as any)[field]} onChange={e => handleChange(field, e.target.value)} placeholder={`Enter ${field}`} className={inputStyle} />
                          {field === 'barcode' && (
                            <button onClick={() => openScanner('form')} className="mt-1 p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                              <i className="fa-solid fa-camera text-lg"></i>
                            </button>
                          )}
                        </div>
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
                    <button type="button" onClick={handleSubmitForm} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">{editingId ? 'Save Changes' : 'Add Product'}</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={isScannerOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[60]" onClose={() => setIsScannerOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-75" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white p-6 text-left align-middle shadow-2xl transition-all">
                  <div className="flex justify-between items-center mb-6">
                    <Dialog.Title as="h3" className="text-xl font-bold text-slate-800">เครื่องสแกนบาร์โค้ด</Dialog.Title>
                    <button onClick={() => setIsScannerOpen(false)} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-xl"></i></button>
                  </div>
                  
                  <BarcodeScanner onScanSuccess={handleScanSuccess} />
                  
                  <div className="mt-6">
                    <button onClick={() => setIsScannerOpen(false)} className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all">ยกเลิก</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
