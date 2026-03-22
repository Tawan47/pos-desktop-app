"use client";
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import generatePayload from 'promptpay-qr';
import QRCode from 'qrcode';
import { useStore } from '@/providers/StoreProvider';
import { getApiUrl } from '@/lib/utils';
import { Product, SaleItem, QuickService, CustomerInfo } from '@/types';

// Components
import ProductSearch from './components/ProductSearch';
import CartSection from './components/CartSection';
import POSModals from './components/POSModals';

const API_URL = getApiUrl();

const POSPage = () => {
    const { products } = useStore();
    
    // Cart and Transaction State
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [discount, setDiscount] = useState<number>(0);
    const [extraCost, setExtraCost] = useState<number>(0);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ name: '', phone: '' });
    
    // Search and Quick Services
    const [searchTerm, setSearchTerm] = useState('');
    const [quickServices, setQuickServices] = useState<QuickService[]>([]);
    
    // Modal State
    const [activeModal, setActiveModal] = useState<'payment' | 'customItem' | 'manageServices' | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'เงินสด' | 'พร้อมเพย์'>('เงินสด');
    const [receivedAmount, setReceivedAmount] = useState('');
    const [qrCodeData, setQrCodeData] = useState<string | null>(null);
    
    // Temporary State for Adding/Editing
    const [customItem, setCustomItem] = useState({ name: '', price: '' });
    const [serviceToEdit, setServiceToEdit] = useState<QuickService | null>(null);
    const [newService, setNewService] = useState({ name: '', price: '' });

    // Constants
    const PROMPTPAY_ID = "0814948833"; // เบอร์โทรศัพท์สำหรับรับเงิน

    // --- Data Fetching ---
    const fetchQuickServices = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/api/quick-services`);
            setQuickServices(res.data || []);
        } catch (err: unknown) {
            console.error("Failed to fetch services", err);
        }
    }, []);

    useEffect(() => {
        fetchQuickServices();
    }, [fetchQuickServices]);

    // --- Search Logic ---
    const searchResults = React.useMemo(() => {
        if (!searchTerm.trim()) return [];
        return products.filter(p => 
            p.name.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(searchTerm.trim().toLowerCase())) ||
            (p.barcode && p.barcode.toLowerCase().includes(searchTerm.trim().toLowerCase()))
        );
    }, [searchTerm, products]);

    // --- Cart Management ---
    const addToCart = (product: Product | { id: string | number, name: string, price: number }) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { ...product, qty: 1 }];
        });
        setSearchTerm('');
        toast.success(`เพิ่ม ${product.name} แล้ว`, { autoClose: 1000, position: 'bottom-left' });
    };

    const updateQty = (id: string | number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.qty + delta);
                return { ...item, qty: newQty };
            }
            return item;
        }).filter(item => item.qty > 0));
    };

    const removeItem = (id: string | number) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    // --- Calculations ---
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const total = Math.max(0, subtotal - discount + extraCost);
    const change = Number(receivedAmount) > 0 ? Number(receivedAmount) - total : 0;

    // --- PromptPay QR Logic ---
    useEffect(() => {
        if (activeModal === 'payment' && paymentMethod === 'พร้อมเพย์' && total > 0) {
            const payload = generatePayload(PROMPTPAY_ID, { amount: total });
            QRCode.toDataURL(payload, {
                width: 400,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' }
            }).then(setQrCodeData).catch((err: unknown) => {
                console.error("QR Error", err);
                toast.error("ไม่สามารถสร้าง QR Code ได้");
            });
        }
    }, [activeModal, paymentMethod, total]);

    // --- Actions ---
    const handlePayClick = () => {
        if (cart.length === 0) return;
        setReceivedAmount('');
        setActiveModal('payment');
    };

    const handleFinalizeSale = async () => {
        try {
            const saleData = {
                items: cart,
                subtotal,
                discount,
                extraCost,
                total,
                paymentMethod,
                receivedAmount: paymentMethod === 'เงินสด' ? Number(receivedAmount) : total,
                change: paymentMethod === 'เงินสด' ? change : 0,
                customer: customerInfo,
                date: new Date().toISOString()
            };

            const res = await axios.post(`${API_URL}/api/sales`, saleData);
            
            if (res.status === 201 || res.status === 200) {
                toast.success('บันทึกการขายสำเร็จ! กำลังพิมพ์ใบเสร็จ...', { position: 'top-center' });
                
                // Print handling
                if (window.electronAPI) {
                    window.electronAPI.printReceipt({
                        ...saleData,
                        invoiceNumber: res.data.invoiceNumber || 'INV-'+Date.now()
                    });
                }

                // Reset state
                setCart([]);
                setDiscount(0);
                setExtraCost(0);
                setCustomerInfo({ name: '', phone: '' });
                setActiveModal(null);
            }
        } catch (err: unknown) {
            console.error("Sale failed", err);
            toast.error('ไม่สามารถบันทึกการขายได้');
        }
    };

    const handleAddCustomItem = () => {
        if (!customItem.name || !customItem.price) {
            toast.warn("กรุณาระบุชื่อและราคา");
            return;
        }
        addToCart({
            id: `custom-${Date.now()}`,
            name: customItem.name,
            price: Number(customItem.price)
        });
        setCustomItem({ name: '', price: '' });
        setActiveModal(null);
    };

    const handleSaveService = async () => {
        if (!newService.name || !newService.price) return;
        try {
            if (serviceToEdit) {
                await axios.put(`${API_URL}/api/quick-services/${serviceToEdit.id}`, newService);
                toast.success("แก้ไขบริการแล้ว");
            } else {
                await axios.post(`${API_URL}/api/quick-services`, newService);
                toast.success("เพิ่มบริการใหม่แล้ว");
            }
            fetchQuickServices();
            setNewService({ name: '', price: '' });
            setServiceToEdit(null);
        } catch (err: unknown) {
            toast.error("บันทึกไม่สำเร็จ");
        }
    };

    const handleDeleteService = async (id: string | number) => {
        if (!confirm('ยืนยันที่จะลบเทมเพลตนี้?')) return;
        try {
            await axios.delete(`${API_URL}/api/quick-services/${id}`);
            fetchQuickServices();
            toast.success("ลบสำเร็จ");
        } catch (err: unknown) {
            toast.error("ลบไม่สำเร็จ");
        }
    };

    return (
        <div className="h-full bg-slate-50 relative">
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-8 h-full">
                {/* Left: Product Search and Results */}
                <ProductSearch 
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    searchResults={searchResults}
                    onProductSelect={addToCart}
                    quickServices={quickServices}
                    onQuickServiceSelect={(s) => addToCart({ id: `service-${s.id}`, name: s.name, price: s.price })}
                    onManageServices={() => setActiveModal('manageServices')}
                    onAddCustomItem={() => setActiveModal('customItem')}
                />

                {/* Right: Cart Section */}
                <CartSection 
                    cart={cart}
                    onUpdateQty={updateQty}
                    onRemoveItem={removeItem}
                    subtotal={subtotal}
                    discount={discount}
                    setDiscount={setDiscount}
                    extraCost={extraCost}
                    setExtraCost={setExtraCost}
                    total={total}
                    onPay={handlePayClick}
                    onHold={() => toast.info('ฟีเจอร์พักบิลกำลังมาเร็วๆ นี้')}
                    onCancel={() => { if(confirm('ต้องการล้างตะกร้าหรือไม่?')) setCart([]); }}
                />
            </div>

            {/* Modals Overlay */}
            <POSModals 
                activeModal={activeModal}
                setActiveModal={setActiveModal}
                total={total}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                receivedAmount={receivedAmount}
                setReceivedAmount={setReceivedAmount}
                change={change}
                qrCodeData={qrCodeData}
                onFinalizeSale={handleFinalizeSale}
                customItem={customItem}
                setCustomItem={setCustomItem}
                onAddCustomItem={handleAddCustomItem}
                quickServices={quickServices}
                serviceToEdit={serviceToEdit}
                newService={newService}
                setNewService={setNewService}
                onOpenServiceModal={(s) => { setServiceToEdit(s); setNewService(s ? { name: s.name, price: s.price.toString() } : { name: '', price: '' }); }}
                onSaveService={handleSaveService}
                onDeleteService={handleDeleteService}
            />
        </div>
    );
};

export default POSPage;
