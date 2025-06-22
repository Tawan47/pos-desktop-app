import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Helper function to format date
const toLocalISOString = (date) => {
    const year = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
};

const POS = ({ products, onSaleComplete }) => {
    // --- NEW DUAL-FUNCTION STATE ---
    const [discount, setDiscount] = useState(0);
    const [extraCost, setExtraCost] = useState(0);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('discount'); // 'discount' or 'extraCost'
    const [tempValue, setTempValue] = useState(0);

    // --- EXISTING STATE ---
    const [term, setTerm] = useState('');
    const [filtered, setFiltered] = useState([]);
    const [detail, setDetail] = useState(null);
    const [qtyToAdd, setQtyToAdd] = useState(1);
    const [cart, setCart] = useState([]);
    const [selectedIdx, setSelectedIdx] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('เงินสด');
    const [invoiceNumber, setInvoiceNumber] = useState('');

    const searchInputRef = useRef(null);
    
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);
    
    // Reset adjustments when cart is cleared
    useEffect(() => {
        if (cart.length === 0) {
            setDiscount(0);
            setExtraCost(0);
        }
    }, [cart]);


    // --- Search and Select Logic (No Changes) ---
    const handleChange = (e) => {
        const v = e.target.value;
        setTerm(v);
        if (!v.trim()) {
            setFiltered([]);
            setDetail(null);
            return;
        }
        const t = v.trim().toLowerCase();
        const matches = products.filter(
            (p) =>
                p.barcode?.toString().includes(t) ||
                p.name.toLowerCase().includes(t)
        );
        setFiltered(matches);
        if (matches.length === 1) {
            setDetail(matches[0]);
        } else {
            setDetail(null);
        }
        setSelectedIdx(null);
    };

    const selectProductFromList = (product) => {
        setDetail(product);
        setTerm(product.name);
        setFiltered([]);
        searchInputRef.current?.focus();
    };

    // --- Cart Management (No Changes) ---
    const addSelectedToCart = () => {
        if (!detail) return toast.error('กรุณาเลือกสินค้า');
        if (qtyToAdd < 1) return toast.error('กรุณากรอกจำนวนที่ถูกต้อง');
        if (qtyToAdd > detail.quantity) {
            return toast.error(`สินค้าไม่พอ! เหลือเพียง ${detail.quantity} ชิ้น`);
        }

        const existingItemIndex = cart.findIndex(item => item.id === detail.id);

        if (existingItemIndex > -1) {
            const updatedCart = [...cart];
            const currentQtyInCart = updatedCart[existingItemIndex].qty;
            const newTotalQty = currentQtyInCart + qtyToAdd;

            if (newTotalQty > detail.quantity) {
                return toast.error(`สินค้าไม่พอ! มีในตะกร้าแล้ว ${currentQtyInCart} ชิ้น, เพิ่มได้อีกไม่เกิน ${detail.quantity - currentQtyInCart} ชิ้น`);
            }
            updatedCart[existingItemIndex].qty = newTotalQty;
            setCart(updatedCart);
        } else {
            setCart([...cart, { ...detail, qty: qtyToAdd }]);
        }
        
        toast.success(`เพิ่ม '${detail.name}' ลงตะกร้าแล้ว`);
        
        setTerm('');
        setFiltered([]);
        setDetail(null);
        setQtyToAdd(1);
        searchInputRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && term.trim()) {
            e.preventDefault();
            addSelectedToCart();
        }
    };
    
    const removeItem = () => {
        if (selectedIdx == null) return toast.warn('กรุณาเลือกรายการที่จะลบ');
        setCart(cart.filter((_, i) => i !== selectedIdx));
        setSelectedIdx(null);
    };

    const clearCart = () => {
        setCart([]);
        setDiscount(0);
        setExtraCost(0);
        setSelectedIdx(null);
    };
    
    // --- UPDATED Calculations ---
    const subtotal = cart.reduce((s, p) => s + p.price * p.qty, 0);
    const finalAmount = (subtotal - discount) + extraCost;

    // --- NEW Generic Adjustment Modal Logic ---
    const handleOpenAdjustmentModal = (mode) => {
        setModalMode(mode);
        setTempValue(mode === 'discount' ? discount : extraCost);
        setIsAdjustmentModalOpen(true);
    };

    const handleApplyAdjustment = () => {
        if (tempValue < 0) {
            toast.error('จำนวนเงินต้องไม่ติดลบ');
            return;
        }
        
        if (modalMode === 'discount') {
            // A discount cannot make the final total negative
            const maxDiscount = subtotal + extraCost;
            if (tempValue > maxDiscount) {
                toast.error(`ส่วนลดสูงสุดคือ ${maxDiscount.toFixed(2)} บาท`);
                return;
            }
            setDiscount(tempValue || 0);
            toast.success(`ใช้ส่วนลด ${tempValue || 0} บาท`);
        } else { // mode is 'extraCost'
            setExtraCost(tempValue || 0);
            toast.success(`เพิ่มค่าบริการ ${tempValue || 0} บาท`);
        }
        
        setIsAdjustmentModalOpen(false);
    };


    // --- Sale Confirmation and Printing (Updated) ---
    const handleConfirmSaleClick = () => {
        if (!cart.length) return toast.error('ไม่มีรายการในตะกร้า');
        if (finalAmount < 0) return toast.error('ยอดรวมสุทธิติดลบหลังหักส่วนลด');
        
        const now = new Date();
        const invNum = `INV${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
        setInvoiceNumber(invNum);
        setIsModalOpen(true);
    };

    const processSale = async () => {
        setIsModalOpen(false);
        
        try {
            // --- UPDATED PAYLOAD with both discount and extraCost ---
            await axios.post(`${import.meta.env.VITE_API_URL}/api/sales`, {
                items: cart.map(p => ({ id: p.id, name: p.name, price: p.price, qty: p.qty })),
                subtotal: subtotal,
                discount: discount,
                extraCost: extraCost,
                total: finalAmount,
                paymentMethod,
                invoiceNumber,
                date: toLocalISOString(new Date()),
            });
            
            toast.info('กำลังพิมพ์ใบเสร็จ...');
            await printReceipt();
            
            clearCart();
            if(onSaleComplete) onSaleComplete();

            toast.success('บันทึกการขายสำเร็จ!');

        } catch (err) {
            console.error('Error saving sale:', err);
            toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกการขาย');
        }
    };
    
    // --- Print Function (No changes, but receipt content is updated) ---
    const printReceipt = () => {
        return new Promise((resolve) => {
            const printContents = document.getElementById('invoice-to-print').innerHTML;
            const iframe = document.createElement('iframe');
            
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.write(`
                <html>
                    <head>
                        <title>Print</title>
                        <style>
                            @page { size: 80mm auto; margin: 2mm; }
                            body { font-family: 'Courier New', Courier, monospace; font-size: 10pt; color: black; line-height: 1.4; font-weight: bold; text-rendering: crisp-edges; -webkit-font-smoothing: none; -moz-osx-font-smoothing: grayscale; image-rendering: crisp-edges; }
                            h1, h2, p, span, div { font-weight: bold; text-rendering: crisp-edges; -webkit-font-smoothing: none; }
                            .text-center { text-align: center; } .text-right { text-align: right; } .text-left { text-align: left; } .font-bold { font-weight: bold; }
                            hr { border: none; border-top: 1px dashed black; margin: 8px 0; font-weight: bold; }
                            table { width: 100%; border-collapse: collapse; font-size: 9pt; font-weight: bold; }
                            th, td { padding: 2px 0; font-weight: bold; } .item-name { white-space: normal; word-break: break-all; font-weight: bold; }
                            .total-section p { margin: 4px 0; font-weight: bold; } .final-total { font-size: 14pt !important; font-weight: bold; }
                        </style>
                    </head>
                    <body>${printContents}</body>
                </html>
            `);
            
            const logoImage = iframeDoc.getElementById('receipt-logo');
            const triggerPrint = () => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                setTimeout(() => { document.body.removeChild(iframe); resolve(); }, 500);
            };

            if (logoImage) { logoImage.onload = triggerPrint; if (logoImage.complete) { triggerPrint(); } }
            else { triggerPrint(); }
            iframeDoc.close();
        });
    };

    const logoUrl = `${window.location.origin}/shop-logo.png`;

    return (
        <div className="grid grid-cols-3 gap-6 h-full font-sans">
            {/* Left & Center Column */}
            <div className="col-span-2 flex flex-col bg-gray-50 p-4 rounded-lg">
                <div className="flex-grow bg-white rounded-lg shadow-md p-4 flex flex-col overflow-hidden">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">Shopping Cart</h2>
                    <div className="flex-grow overflow-y-auto">
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 w-16">ID</th>
                                    <th className="px-4 py-3">Product</th>
                                    <th className="px-4 py-3 w-32">Price</th>
                                    <th className="px-4 py-3 w-20">Qty</th>
                                    <th className="px-4 py-3 w-32">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-10 text-gray-400">ตะกร้าสินค้าว่างเปล่า</td></tr>
                                ) : (
                                    cart.map((p, i) => (
                                        <tr key={`${p.id}-${i}`} className={`border-b hover:bg-gray-100 cursor-pointer ${selectedIdx === i ? 'bg-blue-100 ring-2 ring-blue-300' : ''}`} onClick={() => setSelectedIdx(i)}>
                                            <td className="px-4 py-3 font-medium text-gray-900">{p.id}</td>
                                            <td className="px-4 py-3">{p.name}</td>
                                            <td className="px-4 py-3">฿{p.price.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center">{p.qty}</td>
                                            <td className="px-4 py-3 font-semibold">฿{(p.price * p.qty).toFixed(2)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- UPDATED Total Section --- */}
                <div className="bg-white rounded-lg shadow-md p-4 mt-4 flex items-end justify-between">
                    <div className='text-left space-y-2'>
                        <div className="flex items-baseline justify-between">
                             <p className="text-md font-semibold text-gray-500 w-32">Subtotal:</p>
                             <p className="text-xl font-bold text-gray-700">฿{subtotal.toFixed(2)}</p>
                        </div>
                        {discount > 0 && (
                             <div className="flex items-baseline justify-between text-red-500">
                                 <p className="text-md font-semibold w-32">Discount:</p>
                                 <p className="text-xl font-bold">- ฿{discount.toFixed(2)}</p>
                             </div>
                        )}
                        {extraCost > 0 && (
                             <div className="flex items-baseline justify-between text-sky-500">
                                 <p className="text-md font-semibold w-32">Labor/Other:</p>
                                 <p className="text-xl font-bold">+ ฿{extraCost.toFixed(2)}</p>
                             </div>
                        )}
                         <div className="flex items-baseline justify-between border-t-2 pt-2 mt-2">
                             <p className="text-lg font-bold text-gray-800 w-32">Total:</p>
                             <p className="text-4xl font-bold text-blue-600">฿{finalAmount.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                        {/* --- DUAL Buttons --- */}
                        <button onClick={() => handleOpenAdjustmentModal('discount')} className="px-4 py-2 rounded-lg font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-sm disabled:bg-gray-300" disabled={cart.length === 0}>
                            ส่วนลด
                        </button>
                        <button onClick={() => handleOpenAdjustmentModal('extraCost')} className="px-4 py-2 rounded-lg font-semibold text-white bg-sky-500 hover:bg-sky-600 transition-colors shadow-sm disabled:bg-gray-300" disabled={cart.length === 0}>
                            ค่าแรง/อื่นๆ
                        </button>
                        <button onClick={removeItem} className="px-4 py-2 rounded-lg font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm disabled:bg-gray-300" disabled={selectedIdx === null}>Remove</button>
                        <button onClick={clearCart} className="px-4 py-2 rounded-lg font-semibold text-white bg-yellow-500 hover:bg-yellow-600 transition-colors shadow-sm disabled:bg-gray-300" disabled={cart.length === 0}>Clear</button>
                        <button onClick={handleConfirmSaleClick} className="px-6 py-4 rounded-lg font-bold text-white bg-green-500 hover:bg-green-600 transition-colors shadow-sm text-lg disabled:bg-gray-300" disabled={cart.length === 0}>Confirm Sale</button>
                    </div>
                </div>
            </div>

            {/* Right Column (No changes) */}
            <div className="col-span-1 flex flex-col space-y-4">
                <div className="bg-white rounded-lg shadow-md p-4 relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scan/Search Product</label>
                    <div className="flex space-x-2">
                        <input ref={searchInputRef} type="text" className="flex-grow w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg p-2" value={term} onChange={handleChange} onKeyDown={handleKeyDown} placeholder="Enter barcode or name..." />
                        <input type="number" min="1" className="w-24 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg p-2 text-center" value={qtyToAdd} onChange={(e) => setQtyToAdd(e.target.valueAsNumber || 1)} onKeyDown={handleKeyDown} />
                    </div>
                    {filtered.length > 0 && (
                        <ul className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto border">
                            {filtered.map((p) => ( <li key={p.id} className="p-3 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => selectProductFromList(p)}>{p.name} <span className="text-gray-500">({p.barcode})</span></li> ))}
                        </ul>
                    )}
                    <button onClick={addSelectedToCart} disabled={!detail} className="w-full mt-3 px-4 py-3 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-base">Add to Cart</button>
                </div>
                {detail && (
                    <div className="bg-white rounded-lg shadow-md p-4 flex-grow">
                        <h2 className="text-lg font-bold mb-2 border-b pb-2 text-gray-700">Product Detail</h2>
                        <div className="space-y-2 mt-4 text-sm">
                            <p><strong>ID:</strong> <span className="text-gray-700">{detail.id}</span></p>
                            <p><strong>Barcode:</strong> <span className="text-gray-700">{detail.barcode}</span></p>
                            <p><strong>Name:</strong> <span className="text-gray-700 font-semibold">{detail.name}</span></p>
                            <p><strong>Brand:</strong> <span className="text-gray-700">{detail.brand}</span></p>
                            <p className="text-2xl text-blue-600 font-bold mt-4"><strong>Price:</strong> ฿{detail.price.toFixed(2)}</p>
                            <p className="text-lg font-bold text-green-600"><strong>Stock:</strong> {detail.quantity}</p>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Hidden Invoice */}
            <div className="hidden">
                <div id="invoice-to-print">
                    <div className="text-center">
                        <img id="receipt-logo" src={logoUrl} alt="Shop Logo" style={{ width: '50mm', height: 'auto', margin: '0 auto 8px auto' }} />
                        <h1 style={{fontSize: '14pt', margin: '0', fontWeight: 'bold'}}>ร้านมายล้อซิ่ง</h1>
                        <p style={{fontSize: '9pt', margin: '2px 0'}}>อ่างเก็บน้ำหนองค้อ เส้นสวนเสือ</p>
                        <p style={{fontSize: '9pt', margin: '2px 0'}}>ต.หนองขาม อ.ศรีราชา จ.ชลบุรี 20110</p>
                        <p style={{fontSize: '9pt', margin: '2px 0'}}>โทร: 090-992-7861, 081-591-2992</p>
                    </div>
                    <hr />
                    <div style={{fontSize: '9pt'}}>
                        <p style={{margin: '2px 0'}}><strong>เลขที่:</strong> {invoiceNumber}</p>
                        <p style={{margin: '2px 0'}}><strong>วันที่:</strong> {new Date().toLocaleString('th-TH')}</p>
                        <p style={{margin: '2px 0'}}><strong>ชำระโดย:</strong> {paymentMethod}</p>
                    </div>
                    <hr />
                    <table>
                        <thead><tr><th className="text-left">รายการ</th><th className="text-center">จำนวน</th><th className="text-right">ราคา</th><th className="text-right">รวม</th></tr></thead>
                        <tbody>
                            {cart.map((item, idx) => ( <tr key={idx}><td className="item-name">{item.name}</td><td className="text-center">{item.qty}</td><td className="text-right">{item.price.toFixed(2)}</td><td className="text-right">{(item.price * item.qty).toFixed(2)}</td></tr> ))}
                        </tbody>
                    </table>
                    <hr />
                    {/* --- UPDATED RECEIPT TOTALS --- */}
                    <div className="text-right font-bold total-section" style={{fontSize: '11pt'}}>
                        <p>ยอดรวม: ฿{subtotal.toFixed(2)}</p>
                        {discount > 0 && (<p>ส่วนลด: -฿{discount.toFixed(2)}</p>)}
                        {extraCost > 0 && (<p>อื่นๆ: +฿{extraCost.toFixed(2)}</p>)}
                        <p className="final-total">ยอดสุทธิ: ฿{finalAmount.toFixed(2)}</p>
                    </div>
                    <hr />
                    <p className="text-center" style={{fontSize: '9pt', marginTop: '8px'}}>** ขอบคุณที่ใช้บริการ **</p>
                </div>
            </div>

            {/* Confirmation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4 text-center">Confirm Sale</h2>
                        <div className="text-center mb-6">
                            <p className="text-lg text-gray-600">Total Amount</p>
                            <p className="text-5xl font-bold text-blue-600">฿{finalAmount.toFixed(2)}</p>
                        </div>
                        <div className="mb-6">
                            <p className="text-lg font-semibold mb-2 text-center">Payment Method</p>
                            <div className="flex justify-center space-x-4">
                                <div><input type="radio" id="cash" name="payment" value="เงินสด" checked={paymentMethod === 'เงินสด'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" /><label htmlFor="cash" className={`block cursor-pointer p-4 rounded-lg border-2 ${paymentMethod === 'เงินสด' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}><span className="text-lg font-semibold">เงินสด</span></label></div>
                                <div><input type="radio" id="transfer" name="payment" value="โอน/QR Code" checked={paymentMethod === 'โอน/QR Code'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" /><label htmlFor="transfer" className={`block cursor-pointer p-4 rounded-lg border-2 ${paymentMethod === 'โอน/QR Code' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}><span className="text-lg font-semibold">โอน/QR</span></label></div>
                            </div>
                        </div>
                        <div className="flex justify-between mt-8">
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300">Cancel</button>
                            <button onClick={processSale} className="px-8 py-3 rounded-lg font-bold text-white bg-green-500 hover:bg-green-600 text-lg">Confirm & Print</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* --- NEW Generic Adjustment Modal --- */}
            {isAdjustmentModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                     <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-sm">
                         <h2 className="text-2xl font-bold mb-4 text-center">
                            {modalMode === 'discount' ? 'เพิ่ม/แก้ไข ส่วนลด' : 'เพิ่ม/แก้ไข ค่าบริการ'}
                         </h2>
                         <div className="mb-6">
                              <label htmlFor="adjustment-input" className="block text-sm font-medium text-gray-700 mb-2">
                                {modalMode === 'discount' ? 'ใส่จำนวนเงินส่วนลด (บาท)' : 'ใส่จำนวนเงินค่าบริการ (บาท)'}
                              </label>
                             <input
                                 id="adjustment-input"
                                 type="number"
                                 className={`w-full border-gray-300 rounded-md shadow-sm text-2xl p-3 text-center focus:ring-2 ${
                                    modalMode === 'discount' ? 'focus:ring-orange-500 focus:border-orange-500' : 'focus:ring-sky-500 focus:border-sky-500'
                                 }`}
                                 value={tempValue}
                                 onChange={(e) => setTempValue(e.target.valueAsNumber)}
                                 onKeyDown={(e) => e.key === 'Enter' && handleApplyAdjustment()}
                                 autoFocus
                             />
                              <p className="text-center text-sm text-gray-500 mt-2">ยอดรวมสินค้า: {subtotal.toFixed(2)} บาท</p>
                         </div>
                         <div className="flex justify-between mt-8">
                             <button onClick={() => setIsAdjustmentModalOpen(false)} className="px-6 py-3 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300">
                                 Cancel
                             </button>
                             <button 
                                onClick={handleApplyAdjustment} 
                                className={`px-8 py-3 rounded-lg font-bold text-white text-lg ${
                                    modalMode === 'discount' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-sky-500 hover:bg-sky-600'
                                }`}
                            >
                                ตกลง
                             </button>
                         </div>
                     </div>
                 </div>
            )}

        </div>
    );
};

export default POS;