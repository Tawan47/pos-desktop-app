"use client";
import React from 'react';
import { SaleItem } from '@/types';

interface CartSectionProps {
    cart: SaleItem[];
    onUpdateQty: (productId: number | string, delta: number) => void;
    onRemoveItem: (productId: number | string) => void;
    subtotal: number;
    discount: number;
    setDiscount: (discount: number) => void;
    extraCost: number;
    setExtraCost: (cost: number) => void;
    total: number;
    onPay: () => void;
    onHold: () => void;
    onCancel: () => void;
}

const CartSection = ({
    cart,
    onUpdateQty,
    onRemoveItem,
    subtotal,
    discount,
    setDiscount,
    extraCost,
    setExtraCost,
    total,
    onPay,
    onHold,
    onCancel
}: CartSectionProps) => {
    return (
        <div className="lg:col-span-1 border-l-2 border-slate-100 bg-white/50 backdrop-blur-xl flex flex-col h-[calc(100vh-200px)] lg:h-auto rounded-3xl order-1 lg:order-2 shadow-sm">
            {/* Cart Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <i className="fa-solid fa-cart-shopping text-blue-500"></i> รายการสินค้า
                </h2>
                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-bold">{cart.length} รายการ</span>
            </div>

            {/* Cart Items List */}
            <div className="flex-grow overflow-y-auto px-6 py-2">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
                        <i className="fa-solid fa-basket-shopping text-6xl"></i>
                        <p className="font-bold text-xl">ไม่มีสินค้าในตะกร้า</p>
                    </div>
                ) : (
                    <div className="space-y-4 pt-4 pb-6">
                        {cart.map((item) => (
                            <div key={item.id} className="group flex flex-col gap-3 p-4 bg-white rounded-2xl border-2 border-slate-50 hover:border-blue-100 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-800 leading-tight">{item.name}</h3>
                                        <p className="text-sm text-slate-400 mt-1">@฿{item.price.toLocaleString()}</p>
                                    </div>
                                    <button 
                                        onClick={() => onRemoveItem(item.id)}
                                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                    >
                                        <i className="fa-solid fa-circle-xmark text-xl"></i>
                                    </button>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
                                        <button 
                                            onClick={() => onUpdateQty(item.id, -1)}
                                            className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 shadow-sm transition-colors active:scale-95"
                                        >
                                            <i className="fa-solid fa-minus text-xs"></i>
                                        </button>
                                        <span className="w-10 text-center font-bold text-slate-800">{item.qty}</span>
                                        <button 
                                            onClick={() => onUpdateQty(item.id, 1)}
                                            className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-600 hover:bg-green-50 hover:text-green-600 shadow-sm transition-colors active:scale-95"
                                        >
                                            <i className="fa-solid fa-plus text-xs"></i>
                                        </button>
                                    </div>
                                    <p className="font-black text-lg text-slate-800">฿{(item.price * item.qty).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Totals Section */}
            <div className="p-6 bg-white border-t-2 border-slate-100 rounded-b-3xl space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-slate-500 font-medium">
                        <span>รวมราคา</span>
                        <span>฿{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-rose-500 font-medium">
                        <div className="flex items-center gap-2">
                            <span>ส่วนลด</span>
                        </div>
                        <input 
                            type="number" 
                            className="w-24 text-right bg-rose-50 border-none rounded-lg py-1 px-2 font-bold focus:ring-2 focus:ring-rose-200"
                            value={discount || ''}
                            onChange={(e) => setDiscount(Number(e.target.value))}
                            placeholder="0"
                        />
                    </div>
                    <div className="flex items-center justify-between text-indigo-500 font-medium">
                        <div className="flex items-center gap-2">
                            <span>ค่าแรง/อื่นๆ</span>
                        </div>
                        <input 
                            type="number" 
                            className="w-24 text-right bg-indigo-50 border-none rounded-lg py-1 px-2 font-bold focus:ring-2 focus:ring-indigo-200"
                            value={extraCost || ''}
                            onChange={(e) => setExtraCost(Number(e.target.value))}
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <p className="text-xl font-bold text-slate-800">ยอดสุทธิ</p>
                    <p className="text-4xl font-black text-blue-600 tracking-tight">฿{total.toLocaleString()}</p>
                </div>

                {/* Primary Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                        onClick={onHold}
                        className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all active:scale-95"
                    >
                        พักบิล
                    </button>
                    <button 
                        onClick={onCancel}
                        className="py-4 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 font-bold rounded-2xl transition-all active:scale-95"
                    >
                        ล้างตะกร้า
                    </button>
                    <button 
                        onClick={onPay}
                        disabled={cart.length === 0}
                        className="col-span-2 py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black text-xl rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        {cart.length === 0 ? <i className="fa-solid fa-lock opacity-50"></i> : <i className="fa-solid fa-wallet"></i>}
                        ชำระเงิน
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartSection;
