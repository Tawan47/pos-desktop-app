import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// --- 1. Import ไลบรารีสำหรับสร้าง QR Code ---
import QRCode from 'qrcode';
import generatePayload from 'promptpay-qr';

// Helper function to format date
const toLocalISOString = (date) => {
    const year = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
};

const POS = ({ products, onSaleComplete }) => {
    // States for UI and data
    const [logoBase64, setLogoBase64] = useState('');
    const [discount, setDiscount] = useState(0);
    const [extraCost, setExtraCost] = useState(0);
    const [term, setTerm] = useState('');
    const [filtered, setFiltered] = useState([]);
    const [detail, setDetail] = useState(null);
    const [qtyToAdd, setQtyToAdd] = useState(1);
    const [cart, setCart] = useState([]);
    const [selectedIdx, setSelectedIdx] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('เงินสด');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    
    const [promptPayId, setPromptPayId] = useState('');
    const [customerInfo, setCustomerInfo] = useState({ name: '', address: '', phone: '', other: '' });

    // --- State for Quick Services (Offline) ---
    const [quickServices, setQuickServices] = useState([]);
    const [serviceToEdit, setServiceToEdit] = useState(null);
    const [newService, setNewService] = useState({ name: '', price: '' });

    // --- State for Modal Management ---
    const [activeModal, setActiveModal] = useState(null);
    
    // State for modal temporary data
    const [modalMode, setModalMode] = useState('discount');
    const [tempValue, setTempValue] = useState(0);
    const [tempPromptPayId, setTempPromptPayId] = useState('');
    const [tempCustomerInfo, setTempCustomerInfo] = useState({ name: '', address: '', phone: '', other: '' });
    const [tempCustomItem, setTempCustomItem] = useState({ name: '', price: 0, type: 'addition' });

    const searchInputRef = useRef(null);
    
    // --- Load all saved data from localStorage on mount ---
    useEffect(() => {
        const fetchLogo = async () => {
            if (window.electronAPI && typeof window.electronAPI.getLogoData === 'function') {
                try {
                    const data = await window.electronAPI.getLogoData();
                    if (data) setLogoBase64(data);
                } catch (error) {
                    console.error("Error fetching logo data:", error);
                }
            }
        };
        
        const loadSavedData = () => {
            const savedId = localStorage.getItem('savedPromptPayId');
            if (savedId) setPromptPayId(savedId);

            try {
                const savedServices = localStorage.getItem('quickServices');
                if (savedServices) {
                    setQuickServices(JSON.parse(savedServices));
                } else {
                    // Default services for first-time use
                    setQuickServices([
                        { id: 'service-01', name: 'ปะยาง', price: 150 },
                        { id: 'service-02', name: 'เปลี่ยนน้ำมันเครื่อง', price: 500 },
                    ]);
                }
            } catch (error) {
                toast.error("ไม่สามารถโหลดรายการบริการด่วนได้");
            }
        };

        fetchLogo();
        loadSavedData();
    }, []);

    // --- Save quickServices to localStorage whenever it changes ---
    useEffect(() => {
        try {
            if (quickServices.length > 0) {
               localStorage.setItem('quickServices', JSON.stringify(quickServices));
            }
        } catch (error) {
            console.error("Failed to save services to localStorage", error);
        }
    }, [quickServices]);


    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);
    
    useEffect(() => {
        if (cart.length === 0) {
            setDiscount(0);
            setExtraCost(0);
            setCustomerInfo({ name: '', address: '', phone: '', other: '' });
        }
    }, [cart]);

    // Handle product search
    const handleChange = (e) => {
        const v = e.target.value;
        setTerm(v);
        if (!v.trim()) {
            setFiltered([]);
            setDetail(null);
            return;
        }
        const t = v.trim().toLowerCase();
        // --- MODIFIED: เพิ่มการค้นหาจาก Color และ Size ---
        const matches = products.filter(
            (p) =>
                p.barcode?.toString().includes(t) ||
                p.name.toLowerCase().includes(t) ||
                p.color?.toLowerCase().includes(t) ||
                p.size?.toLowerCase().includes(t)
        );
        setFiltered(matches);
        if (matches.length === 1) {
            setDetail(matches[0]);
        } else {
            setDetail(null);
        }
        setSelectedIdx(null);
    };

    // Select a product from the search list
    const selectProductFromList = (product) => {
        setDetail(product);
        setTerm(product.name);
        setFiltered([]);
        searchInputRef.current?.focus();
    };

    // Add selected product to the cart
    const addSelectedToCart = () => {
        if (!detail) return toast.error('กรุณาเลือกสินค้า');
        if (qtyToAdd < 1) return toast.error('กรุณากรอกจำนวนที่ถูกต้อง');
        if (detail.quantity !== undefined && qtyToAdd > detail.quantity) {
            return toast.error(`สินค้าไม่พอ! เหลือเพียง ${detail.quantity} ชิ้น`);
        }

        const existingItemIndex = cart.findIndex(item => item.id === detail.id);

        if (existingItemIndex > -1) {
            const updatedCart = [...cart];
            const currentQtyInCart = updatedCart[existingItemIndex].qty;
            const newTotalQty = currentQtyInCart + qtyToAdd;

            if (detail.quantity !== undefined && newTotalQty > detail.quantity) {
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

    // Handle 'Enter' key press to add to cart
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && term.trim()) {
            e.preventDefault();
            addSelectedToCart();
        }
    };
    
    // Remove selected item from cart
    const removeItem = () => {
        if (selectedIdx == null) return toast.warn('กรุณาเลือกรายการที่จะลบ');
        setCart(cart.filter((_, i) => i !== selectedIdx));
        setSelectedIdx(null);
    };

    // Clear the entire cart
    const clearCart = () => {
        setCart([]);
        setDiscount(0);
        setExtraCost(0);
        setSelectedIdx(null);
        setCustomerInfo({ name: '', address: '', phone: '', other: '' });
    };
    
    // Calculate totals
    const subtotal = cart.reduce((s, p) => s + p.price * p.qty, 0);
    const finalAmount = (subtotal - discount) + extraCost;

    // Handle opening the discount/extra cost modal
    const handleOpenAdjustmentModal = (mode) => {
        setModalMode(mode);
        setTempValue(mode === 'discount' ? discount : extraCost);
        setActiveModal('adjustment');
    };

    // Apply the discount or extra cost
    const handleApplyAdjustment = () => {
        if (tempValue < 0) return toast.error('จำนวนเงินต้องไม่ติดลบ');
        
        if (modalMode === 'discount') {
            const maxDiscount = subtotal + extraCost;
            if (tempValue > maxDiscount) return toast.error(`ส่วนลดสูงสุดคือ ${maxDiscount.toFixed(2)} บาท`);
            setDiscount(tempValue || 0);
            toast.success(`ใช้ส่วนลด ${tempValue || 0} บาท`);
        } else {
            setExtraCost(tempValue || 0);
            toast.success(`เพิ่มค่าบริการ ${tempValue || 0} บาท`);
        }
        
        setActiveModal(null);
    };

    // Open the sale confirmation modal
    const handleConfirmSaleClick = () => {
        if (!cart.length) return toast.error('ไม่มีรายการในตะกร้า');
        if (finalAmount < 0) return toast.error('ยอดรวมสุทธิติดลบหลังหักส่วนลด');
        
        const now = new Date();
        const invNum = `INV${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
        setInvoiceNumber(invNum);
        setActiveModal('confirmSale');
    };

    const processSale = async () => {
        setActiveModal(null);

        if (paymentMethod === 'โอน/QR Code' && !promptPayId) {
            return toast.error('กรุณาตั้งค่า PromptPay ID ก่อน');
        }

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/sales`, {
                items: cart.map(p => ({ id: p.id, name: p.name, price: p.price, qty: p.qty, isCustom: p.isCustom || false })),
                subtotal, discount, extraCost,
                total: finalAmount,
                paymentMethod, invoiceNumber,
                date: toLocalISOString(new Date()),
                customer: customerInfo, 
            });
            
            toast.info('กำลังสร้างใบเสร็จ...');
            await printReceipt();
            
            clearCart();
            if(onSaleComplete) onSaleComplete();
            toast.success('บันทึกการขายและพิมพ์ใบเสร็จสำเร็จ!');

        } catch (err) {
            console.error('Error processing sale:', err);
            toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกการขาย');
        }
    };
    
    const printReceipt = async () => {
        if (!window.electronAPI || typeof window.electronAPI.printComponent !== 'function') {
            return toast.error('ฟังก์ชันการปริ้นท์ไม่พร้อมใช้งาน');
        }

        let paymentInfoHtml = '';
        if (paymentMethod === 'โอน/QR Code' && finalAmount > 0) {
            try {
                const payload = generatePayload(promptPayId, { amount: finalAmount });
                const qrCodeDataUrl = await QRCode.toDataURL(payload, { width: 250, margin: 1 });
                paymentInfoHtml = `
                    <div class="qr-code-container">
                        <p><b>สแกนเพื่อจ่ายเงิน</b></p>
                        <img src="${qrCodeDataUrl}" alt="PromptPay QR Code" />
                    </div>
                `;
            } catch (error) {
                console.error('Failed to generate QR Code:', error);
                toast.warn('ไม่สามารถสร้าง QR Code ได้ แต่จะพิมพ์ใบเสร็จต่อไป');
            }
        }

        const customerInfoHtml = customerInfo.name ? `
            <div class="customer-info">
                <p><strong>ลูกค้า:</strong> ${customerInfo.name}</p>
                ${customerInfo.phone ? `<p><strong>โทร:</strong> ${customerInfo.phone}</p>` : ''}
                ${customerInfo.address ? `<p><strong>ที่อยู่:</strong> ${customerInfo.address}</p>` : ''}
                ${customerInfo.other ? `<p><strong>อื่นๆ:</strong> ${customerInfo.other}</p>` : ''}
            </div>
            <hr />
        ` : '';

        const receiptItemsHtml = cart.map(item => `
            <tr>
                <td class="item-name">${item.name}</td>
                <td class="text-center">${item.qty}</td>
                <td class="text-right">${item.price.toFixed(2)}</td>
                <td class="text-right">${(item.price * item.qty).toFixed(2)}</td>
            </tr>
        `).join('');

        const htmlToPrint = `
            <html>
                <head>
                    <title>ใบเสร็จรับเงิน</title>
                    <style>
                        @page { size: 80mm auto; margin: 2mm; }
                        body { 
                            font-family: 'Kanit', sans-serif; 
                            font-size: 9.5pt; 
                            color: #000; 
                            line-height: 1.4; 
                        }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .text-left { text-align: left; }
                        hr { border: none; border-top: 1.5px dashed #555; margin: 2mm 0; }
                        p { margin: 1px 0; }
                        table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
                        th { font-weight: 700; padding-bottom: 1.5mm; border-bottom: 1.5px solid #000; }
                        td { padding: 1mm 0; vertical-align: top; }
                        .item-name { white-space: normal; word-break: break-all; padding-right: 2mm; }
                        
                        .totals-section { font-size: 11pt; margin-top: 3mm; font-weight: 500; }
                        .total-row { display: flex; justify-content: space-between; padding: 1.5px 0; }
                        .final-total { 
                            font-size: 16pt !important; 
                            font-weight: 700; 
                            border-top: 1.5px solid #000; 
                            border-bottom: 1.5px solid #000;
                            padding: 2mm 0;
                            margin-top: 2mm;
                        }

                        .qr-code-container { text-align: center; margin-top: 4mm; }
                        .qr-code-container img { width: 40mm; height: 40mm; }
                        .customer-info { font-size: 9pt; text-align: left; font-weight: 500; }
                    </style>
                </head>
                <body>
                    <div class="text-center">
                        ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" style="width: 40mm; max-height: 15mm; object-fit: contain; margin: 0 auto 5px auto;" />` : ''}
                        <h1 style="font-size: 14pt; margin: 0; font-weight: 700;">ร้านมายล้อซิ่ง</h1>
                        <p>อ่างเก็บน้ำหนองค้อ เส้นสวนเสือ</p>
                        <p>ต.หนองขาม อ.ศรีราชา จ.ชลบุรี 20230</p>
                        <p>โทร: 090-992-7861, 081-591-2992</p>
                    </div>
                    <hr />
                    <div style="font-size: 9pt;">
                        <p><strong>เลขที่:</strong> ${invoiceNumber}</p>
                        <p><strong>วันที่:</strong> ${new Date().toLocaleString('th-TH')}</p>
                        <p><strong>ชำระโดย:</strong> ${paymentMethod}</p>
                    </div>
                    ${customerInfoHtml ? `<hr />${customerInfoHtml}` : ''}
                    <hr />
                    <table>
                        <thead>
                            <tr>
                                <th class="text-left">รายการ</th>
                                <th class="text-center">จำนวน</th>
                                <th class="text-right">ราคา</th>
                                <th class="text-right">รวม</th>
                            </tr>
                        </thead>
                        <tbody>${receiptItemsHtml}</tbody>
                    </table>
                    <hr />
                    <div class="totals-section">
                        <div class="total-row"><span>ยอดรวม:</span><span>฿${subtotal.toFixed(2)}</span></div>
                        ${discount > 0 ? `<div class="total-row"><span>ส่วนลด:</span><span>-฿${discount.toFixed(2)}</span></div>` : ''}
                        ${extraCost > 0 ? `<div class="total-row"><span>อื่นๆ:</span><span>+฿${extraCost.toFixed(2)}</span></div>` : ''}
                        <div class="total-row final-total"><span>ยอดสุทธิ:</span><span>฿${finalAmount.toFixed(2)}</span></div>
                    </div>
                    ${paymentInfoHtml}
                    <p class="text-center" style="font-size: 9pt; margin-top: 8px;">** ขอบคุณที่ใช้บริการ **</p>
                </body>
            </html>
        `;

        try {
            window.electronAPI.printComponent(htmlToPrint);
        } catch (error) {
            console.error('Call to print-component failed:', error);
            toast.error('การเรียกฟังก์ชันปริ้นท์ล้มเหลว');
        }
    };

    const handleOpenCustomerModal = () => {
        setTempCustomerInfo(customerInfo);
        setActiveModal('customer');
    };

    const handleSaveCustomerInfo = () => {
        setCustomerInfo(tempCustomerInfo);
        toast.success("บันทึกข้อมูลลูกค้าสำเร็จ");
        setActiveModal(null);
    };

    const handleOpenCustomItemModal = () => {
        setTempCustomItem({ name: '', price: 0, type: 'addition' });
        setActiveModal('customItem');
    };

    const handleAddCustomItem = () => {
        const { name, price, type } = tempCustomItem;
        if (!name.trim()) return toast.error("กรุณาใส่ชื่อรายการ");
        if (isNaN(price)) return toast.error("กรุณาใส่ราคาที่ถูกต้อง");

        const absolutePrice = Math.abs(Number(price));
        const finalPrice = type === 'deduction' ? -absolutePrice : absolutePrice;

        const newItem = {
            id: `custom-${Date.now()}`,
            name: name,
            price: finalPrice,
            qty: 1,
            isCustom: true
        };

        setCart([...cart, newItem]);
        toast.success(`เพิ่มรายการ '${name}' สำเร็จ`);
        setActiveModal(null);
    };

    const handleOpenPaymentModal = () => {
        setTempPromptPayId(promptPayId);
        setActiveModal('payment');
    };

    const handleSavePaymentDetails = () => {
        if (!tempPromptPayId.trim()) return toast.error("กรุณากรอก PromptPay ID");
        
        setPromptPayId(tempPromptPayId);
        localStorage.setItem('savedPromptPayId', tempPromptPayId);
        toast.success("บันทึก PromptPay ID สำเร็จ!");
        setActiveModal(null);
    };
    
    // --- NEW: Functions for managing Quick Services without API ---
    const handleOpenServiceModal = (service = null) => {
        if (service) {
            setServiceToEdit(service);
            setNewService({ name: service.name, price: service.price });
        } else {
            setServiceToEdit(null);
            setNewService({ name: '', price: '' });
        }
        setActiveModal('manageServices');
    };

    const handleSaveService = () => {
        const { name, price } = newService;
        if (!name.trim() || !price || isNaN(Number(price))) {
            return toast.error("กรุณากรอกชื่อและราคาของบริการให้ถูกต้อง");
        }

        if (serviceToEdit) {
            // Update existing service
            setQuickServices(prevServices => 
                prevServices.map(s => 
                    s.id === serviceToEdit.id ? { ...s, name, price: Number(price) } : s
                )
            );
            toast.success("อัปเดตบริการสำเร็จ");
        } else {
            // Add new service
            const newServiceToAdd = {
                id: `service-${Date.now()}`,
                name,
                price: Number(price)
            };
            setQuickServices(prevServices => [...prevServices, newServiceToAdd]);
            toast.success("เพิ่มบริการใหม่สำเร็จ");
        }
        setActiveModal(null);
    };

    const handleDeleteService = (serviceId) => {
        if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบบริการนี้?")) {
            setQuickServices(prevServices => prevServices.filter(s => s.id !== serviceId));
            toast.success("ลบบริการสำเร็จ");
        }
    };

    const handleServiceClick = (service) => {
        const newItem = {
            id: `service-${service.id}`,
            name: service.name,
            price: service.price,
            qty: 1,
            isCustom: true // Treat as custom item in cart
        };
        setCart([...cart, newItem]);
        toast.success(`เพิ่มบริการ '${service.name}' ลงตะกร้า`);
    };

    return (
        <div className="grid grid-cols-3 gap-6 h-full font-sans">
            {/* Left & Center Column */}
            <div className="col-span-2 flex flex-col bg-gray-50 p-4 rounded-lg">
                {/* Cart Section */}
                <div className="flex-grow bg-white rounded-lg shadow-md p-4 flex flex-col overflow-hidden">
                    {customerInfo.name && (
                        <div className="p-3 mb-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800">
                            <p className="font-bold">ลูกค้า: {customerInfo.name}</p>
                            <p className="text-sm">โทร: {customerInfo.phone || '-'}</p>
                            <p className="text-sm">ที่อยู่: {customerInfo.address || '-'}</p>
                            <p className="text-sm">อื่นๆ: {customerInfo.other || '-'}</p>
                        </div>
                    )}
                    <h2 className="text-xl font-bold mb-4 text-gray-700">ตะกร้าสินค้า</h2>
                    <div className="flex-grow overflow-y-auto">
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 w-16">ID</th>
                                    <th className="px-4 py-3">สินค้า/บริการ</th>
                                    <th className="px-4 py-3 w-32">ราคา</th>
                                    <th className="px-4 py-3 w-20">จำนวน</th>
                                    <th className="px-4 py-3 w-32">รวม</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-10 text-gray-400">ตะกร้าสินค้าว่างเปล่า</td></tr>
                                ) : (
                                    cart.map((p, i) => (
                                        <tr key={p.id} className={`border-b hover:bg-gray-100 cursor-pointer ${selectedIdx === i ? 'bg-blue-100 ring-2 ring-blue-300' : ''}`} onClick={() => setSelectedIdx(i)}>
                                            <td className="px-4 py-3 font-medium text-gray-900">{p.id.toString().startsWith('custom-') || p.id.toString().startsWith('service-') ? 'N/A' : p.id}</td>
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

                {/* Totals & Actions Section */}
                <div className="bg-white rounded-lg shadow-md p-4 mt-4 flex items-end justify-between">
                    <div className='text-left space-y-2'>
                        <div className="flex items-baseline justify-between">
                            <p className="text-md font-semibold text-gray-500 w-32">ยอดรวมย่อย:</p>
                            <p className="text-xl font-bold text-gray-700">฿{subtotal.toFixed(2)}</p>
                        </div>
                        {discount > 0 && (
                            <div className="flex items-baseline justify-between text-red-500">
                                <p className="text-md font-semibold w-32">ส่วนลด:</p>
                                <p className="text-xl font-bold">- ฿{discount.toFixed(2)}</p>
                            </div>
                        )}
                        {extraCost > 0 && (
                            <div className="flex items-baseline justify-between text-sky-500">
                                <p className="text-md font-semibold w-32">ค่าบริการ/อื่นๆ:</p>
                                <p className="text-xl font-bold">+ ฿{extraCost.toFixed(2)}</p>
                            </div>
                        )}
                         <div className="flex items-baseline justify-between border-t-2 pt-2 mt-2">
                            <p className="text-lg font-bold text-gray-800 w-32">ยอดสุทธิ:</p>
                            <p className="text-4xl font-bold text-blue-600">฿{finalAmount.toFixed(2)}</p>
                         </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                         <button onClick={handleOpenCustomItemModal} className="px-4 py-2 rounded-lg font-semibold text-white bg-purple-500 hover:bg-purple-600 transition-colors shadow-sm">เพิ่มรายการเอง</button>
                         <button onClick={handleOpenCustomerModal} className="px-4 py-2 rounded-lg font-semibold text-white bg-teal-500 hover:bg-teal-600 transition-colors shadow-sm">ข้อมูลลูกค้า</button>
                         <button onClick={handleOpenPaymentModal} className="px-4 py-2 rounded-lg font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors shadow-sm">ตั้งค่า PromptPay</button>
                         <button onClick={() => handleOpenAdjustmentModal('discount')} className="px-4 py-2 rounded-lg font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-sm disabled:bg-gray-300" disabled={cart.length === 0}>ส่วนลด</button>
                         <button onClick={() => handleOpenAdjustmentModal('extraCost')} className="px-4 py-2 rounded-lg font-semibold text-white bg-sky-500 hover:bg-sky-600 transition-colors shadow-sm disabled:bg-gray-300" disabled={cart.length === 0}>ค่าแรง/อื่นๆ</button>
                         <button onClick={removeItem} className="px-4 py-2 rounded-lg font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm disabled:bg-gray-300" disabled={selectedIdx === null}>ลบสินค้า</button>
                         <button onClick={clearCart} className="px-4 py-2 rounded-lg font-semibold text-white bg-yellow-500 hover:bg-yellow-600 transition-colors shadow-sm disabled:bg-gray-300" disabled={cart.length === 0}>ล้างตะกร้า</button>
                         <button onClick={handleConfirmSaleClick} className="px-6 py-4 rounded-lg font-bold text-white bg-green-500 hover:bg-green-600 transition-colors shadow-sm text-lg disabled:bg-gray-300" disabled={cart.length === 0}>ยืนยันการขาย</button>
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="col-span-1 flex flex-col space-y-4">
                {/* --- NEW: Quick Services Section --- */}
                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-bold text-gray-700">บริการด่วน</h2>
                        <button onClick={() => handleOpenServiceModal()} className="text-sm text-blue-600 hover:text-blue-800 font-semibold">จัดการ</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {quickServices.map(service => (
                            <button key={service.id} onClick={() => handleServiceClick(service)} className="p-3 border rounded-lg text-center hover:bg-gray-100 transition-colors">
                                <p className="font-semibold text-sm">{service.name}</p>
                                <p className="text-xs text-gray-500">฿{service.price}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Section */}
                <div className="bg-white rounded-lg shadow-md p-4 relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">สแกน/ค้นหาสินค้า</label>
                    <div className="flex space-x-2">
                        <input ref={searchInputRef} type="text" className="flex-grow w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg p-2" value={term} onChange={handleChange} onKeyDown={handleKeyDown} placeholder="ใส่บาร์โค้ด, ชื่อ, สี, ขนาด..." />
                        <input type="number" min="1" className="w-24 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg p-2 text-center" value={qtyToAdd} onChange={(e) => setQtyToAdd(e.target.valueAsNumber || 1)} onKeyDown={handleKeyDown} />
                    </div>
                    {/* --- MODIFIED: ปรับปรุงการแสดงผลรายการค้นหา --- */}
                    {filtered.length > 0 && (
                         <ul className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto border">
                              {filtered.map((p) => ( 
                                <li key={p.id} className="p-3 hover:bg-gray-100 cursor-pointer text-sm border-b" onClick={() => selectProductFromList(p)}>
                                    <div>
                                        <span className="font-semibold text-gray-800">{p.name}</span>
                                        <span className="text-gray-500 ml-2">({p.barcode})</span>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        {p.color && <span>สี: {p.color}</span>}
                                        {p.size && <span className="ml-3">ขนาด: {p.size}</span>}
                                    </div>
                                </li> 
                              ))}
                         </ul>
                    )}
                    <button onClick={addSelectedToCart} disabled={!detail} className="w-full mt-3 px-4 py-3 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-base">เพิ่มลงตะกร้า</button>
                </div>
                {/* Product Detail Section */}
                {/* --- MODIFIED: เพิ่มการแสดงผล Color และ Size ในรายละเอียด --- */}
                {detail && (
                    <div className="bg-white rounded-lg shadow-md p-4 flex-grow">
                        <h2 className="text-lg font-bold mb-2 border-b pb-2 text-gray-700">รายละเอียดสินค้า</h2>
                        <div className="space-y-2 mt-4 text-sm">
                            <p><strong>ID:</strong> <span className="text-gray-700">{detail.id}</span></p>
                            <p><strong>Barcode:</strong> <span className="text-gray-700">{detail.barcode}</span></p>
                            <p><strong>Name:</strong> <span className="text-gray-700 font-semibold">{detail.name}</span></p>
                            <p><strong>Brand:</strong> <span className="text-gray-700">{detail.brand}</span></p>
                            {detail.color && <p><strong>Color:</strong> <span className="text-gray-700">{detail.color}</span></p>}
                            {detail.size && <p><strong>Size:</strong> <span className="text-gray-700">{detail.size}</span></p>}
                            <p className="text-2xl text-blue-600 font-bold mt-4"><strong>Price:</strong> ฿{detail.price.toFixed(2)}</p>
                            <p className="text-lg font-bold text-green-600"><strong>Stock:</strong> {detail.quantity}</p>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Confirmation Modal */}
            {activeModal === 'confirmSale' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4 text-center">ยืนยันการขาย</h2>
                        <div className="text-center mb-6">
                            <p className="text-lg text-gray-600">ยอดรวม</p>
                            <p className="text-5xl font-bold text-blue-600">฿{finalAmount.toFixed(2)}</p>
                        </div>
                        <div className="mb-6">
                            <p className="text-lg font-semibold mb-2 text-center">ช่องทางการชำระเงิน</p>
                            <div className="flex justify-center space-x-4">
                                <div><input type="radio" id="cash" name="payment" value="เงินสด" checked={paymentMethod === 'เงินสด'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" /><label htmlFor="cash" className={`block cursor-pointer p-4 rounded-lg border-2 ${paymentMethod === 'เงินสด' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}><span className="text-lg font-semibold">เงินสด</span></label></div>
                                <div><input type="radio" id="transfer" name="payment" value="โอน/QR Code" checked={paymentMethod === 'โอน/QR Code'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" /><label htmlFor="transfer" className={`block cursor-pointer p-4 rounded-lg border-2 ${paymentMethod === 'โอน/QR Code' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}><span className="text-lg font-semibold">โอน/QR</span></label></div>
                            </div>
                        </div>
                        <div className="flex justify-between mt-8">
                            <button onClick={() => setActiveModal(null)} className="px-6 py-3 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300">ยกเลิก</button>
                            <button onClick={processSale} className="px-8 py-3 rounded-lg font-bold text-white bg-green-500 hover:bg-green-600 text-lg">ยืนยันและพิมพ์</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Adjustment Modal */}
            {activeModal === 'adjustment' && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-sm">
                            <h2 className="text-2xl font-bold mb-4 text-center">{modalMode === 'discount' ? 'เพิ่ม/แก้ไข ส่วนลด' : 'เพิ่ม/แก้ไข ค่าบริการ'}</h2>
                            <div className="mb-6">
                                <label htmlFor="adjustment-input" className="block text-sm font-medium text-gray-700 mb-2">{modalMode === 'discount' ? 'ใส่จำนวนเงินส่วนลด (บาท)' : 'ใส่จำนวนเงินค่าบริการ (บาท)'}</label>
                               <input id="adjustment-input" type="number" className={`w-full border-gray-300 rounded-md shadow-sm text-2xl p-3 text-center focus:ring-2 ${modalMode === 'discount' ? 'focus:ring-orange-500 focus:border-orange-500' : 'focus:ring-sky-500 focus:border-sky-500'}`} value={tempValue} onChange={(e) => setTempValue(e.target.valueAsNumber)} onKeyDown={(e) => e.key === 'Enter' && handleApplyAdjustment()} autoFocus />
                                <p className="text-center text-sm text-gray-500 mt-2">ยอดรวมสินค้า: {subtotal.toFixed(2)} บาท</p>
                            </div>
                            <div className="flex justify-between mt-8">
                                 <button onClick={() => setActiveModal(null)} className="px-6 py-3 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300">ยกเลิก</button>
                                 <button onClick={handleApplyAdjustment} className={`px-8 py-3 rounded-lg font-bold text-white text-lg ${modalMode === 'discount' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-sky-500 hover:bg-sky-600'}`}>ตกลง</button>
                            </div>
                       </div>
                 </div>
            )}

            {activeModal === 'customer' && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-6 text-center">ข้อมูลลูกค้า</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
                                    <input type="text" value={tempCustomerInfo.name} onChange={(e) => setTempCustomerInfo({...tempCustomerInfo, name: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                                    <input type="text" value={tempCustomerInfo.phone} onChange={(e) => setTempCustomerInfo({...tempCustomerInfo, phone: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ที่อยู่</label>
                                    <textarea value={tempCustomerInfo.address} onChange={(e) => setTempCustomerInfo({...tempCustomerInfo, address: e.target.value})} rows="3" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">อื่นๆ (เช่น รุ่นรถ, ทะเบียน)</label>
                                    <input type="text" value={tempCustomerInfo.other} onChange={(e) => setTempCustomerInfo({...tempCustomerInfo, other: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                                </div>
                            </div>
                            <div className="flex justify-between mt-8">
                                 <button onClick={() => setActiveModal(null)} className="px-6 py-3 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300">ยกเลิก</button>
                                 <button onClick={handleSaveCustomerInfo} className="px-8 py-3 rounded-lg font-bold text-white bg-teal-500 hover:bg-teal-600 text-lg">บันทึกข้อมูลลูกค้า</button>
                            </div>
                       </div>
                 </div>
            )}

            {/* Modal สำหรับตั้งค่า PromptPay ID */}
            {activeModal === 'payment' && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-6 text-center">ตั้งค่า PromptPay ID</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">PromptPay ID (เบอร์โทรศัพท์ / เลขประจำตัวผู้เสียภาษี)</label>
                                    <input type="text" value={tempPromptPayId} onChange={(e) => setTempPromptPayId(e.target.value)} placeholder="เช่น 0812345678" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                                </div>
                            </div>
                            <div className="flex justify-between mt-8">
                                 <button onClick={() => setActiveModal(null)} className="px-6 py-3 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300">ยกเลิก</button>
                                 <button onClick={handleSavePaymentDetails} className="px-8 py-3 rounded-lg font-bold text-white bg-indigo-500 hover:bg-indigo-600 text-lg">บันทึกข้อมูล</button>
                            </div>
                       </div>
                 </div>
            )}
            
            {/* Modal สำหรับเพิ่มรายการเอง */}
            {activeModal === 'customItem' && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-6 text-center">เพิ่มรายการเอง</h2>
                            <div className="space-y-4">
                                <div className="flex justify-center space-x-4">
                                    <div>
                                        <input type="radio" id="addition" name="itemType" value="addition" checked={tempCustomItem.type === 'addition'} onChange={(e) => setTempCustomItem({...tempCustomItem, type: e.target.value})} className="hidden" />
                                        <label htmlFor="addition" className={`block cursor-pointer p-3 rounded-lg border-2 ${tempCustomItem.type === 'addition' ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}><span className="font-semibold">รายรับ</span></label>
                                    </div>
                                    <div>
                                        <input type="radio" id="deduction" name="itemType" value="deduction" checked={tempCustomItem.type === 'deduction'} onChange={(e) => setTempCustomItem({...tempCustomItem, type: e.target.value})} className="hidden" />
                                        <label htmlFor="deduction" className={`block cursor-pointer p-3 rounded-lg border-2 ${tempCustomItem.type === 'deduction' ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}><span className="font-semibold">รายการหัก</span></label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ชื่อรายการ</label>
                                    <input type="text" value={tempCustomItem.name} onChange={(e) => setTempCustomItem({...tempCustomItem, name: e.target.value})} placeholder="เช่น หักเทิร์นล้อ, ค่าบริการ" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700">ราคา (ใส่เป็นตัวเลขบวก)</label>
                                    <input type="number" value={tempCustomItem.price} onChange={(e) => setTempCustomItem({...tempCustomItem, price: e.target.value})} placeholder="เช่น 5000" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                                </div>
                            </div>
                            <div className="flex justify-between mt-8">
                                 <button onClick={() => setActiveModal(null)} className="px-6 py-3 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300">ยกเลิก</button>
                                 <button onClick={handleAddCustomItem} className="px-8 py-3 rounded-lg font-bold text-white bg-purple-500 hover:bg-purple-600 text-lg">เพิ่มรายการ</button>
                            </div>
                       </div>
                 </div>
            )}

            {/* --- NEW: Modal for Managing Quick Services --- */}
            {activeModal === 'manageServices' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl">
                        <h2 className="text-2xl font-bold mb-6 text-center">จัดการบริการด่วน</h2>
                        <div className="grid grid-cols-2 gap-6">
                            {/* List of existing services */}
                            <div className="border-r pr-6">
                                <h3 className="font-semibold mb-2">รายการที่มีอยู่</h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {quickServices.map(s => (
                                        <div key={s.id} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                                            <span>{s.name} (฿{s.price})</span>
                                            <div>
                                                <button onClick={() => handleOpenServiceModal(s)} className="text-xs text-blue-600 hover:underline mr-2">แก้ไข</button>
                                                <button onClick={() => handleDeleteService(s.id)} className="text-xs text-red-600 hover:underline">ลบ</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Form to add/edit service */}
                            <div>
                                <h3 className="font-semibold mb-2">{serviceToEdit ? 'แก้ไขบริการ' : 'เพิ่มบริการใหม่'}</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">ชื่อบริการ</label>
                                        <input type="text" value={newService.name} onChange={(e) => setNewService({...newService, name: e.target.value})} placeholder="เช่น ปะยาง" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">ราคา</label>
                                        <input type="number" value={newService.price} onChange={(e) => setNewService({...newService, price: e.target.value})} placeholder="เช่น 150" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                                    </div>
                                    <button onClick={handleSaveService} className="w-full py-2 px-4 rounded-lg font-bold text-white bg-green-500 hover:bg-green-600">
                                        {serviceToEdit ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มบริการ'}
                                    </button>
                                    {serviceToEdit && (
                                        <button onClick={() => handleOpenServiceModal(null)} className="w-full text-sm text-center text-gray-600 hover:underline mt-2">
                                            ยกเลิกการแก้ไข
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-center mt-8">
                            <button onClick={() => setActiveModal(null)} className="px-6 py-3 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300">ปิด</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;
