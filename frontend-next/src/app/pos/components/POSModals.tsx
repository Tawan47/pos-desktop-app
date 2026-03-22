"use client";
import React from 'react';
import { SaleItem, QuickService } from '@/types';
import QRCode from 'qrcode';

interface POSModalsProps {
    activeModal: 'payment' | 'customItem' | 'manageServices' | null;
    setActiveModal: (modal: 'payment' | 'customItem' | 'manageServices' | null) => void;
    total: number;
    paymentMethod: 'เงินสด' | 'พร้อมเพย์';
    setPaymentMethod: (method: 'เงินสด' | 'พร้อมเพย์') => void;
    receivedAmount: string;
    setReceivedAmount: (amount: string) => void;
    change: number;
    qrCodeData: string | null;
    onFinalizeSale: () => void;
    customItem: { name: string, price: string };
    setCustomItem: (item: { name: string, price: string }) => void;
    onAddCustomItem: () => void;
    quickServices: QuickService[];
    serviceToEdit: QuickService | null;
    newService: { name: string, price: string };
    setNewService: (service: { name: string, price: string }) => void;
    onOpenServiceModal: (service: QuickService | null) => void;
    onSaveService: () => void;
    onDeleteService: (id: string | number) => void;
}

const POSModals = ({
    activeModal,
    setActiveModal,
    total,
    paymentMethod,
    setPaymentMethod,
    receivedAmount,
    setReceivedAmount,
    change,
    qrCodeData,
    onFinalizeSale,
    customItem,
    setCustomItem,
    onAddCustomItem,
    quickServices,
    serviceToEdit,
    newService,
    setNewService,
    onOpenServiceModal,
    onSaveService,
    onDeleteService
}: POSModalsProps) => {
    if (!activeModal) return null;

    return (
        <>
            {/* Payment Modal */}
            {activeModal === 'payment' && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-lg border border-slate-100 animate-in fade-in zoom-in duration-300">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">ชำระเงิน</h2>
                            <p className="text-slate-500 font-medium">เลือกรูปแบบการชำระเงิน</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button 
                                onClick={() => setPaymentMethod('เงินสด')}
                                className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === 'เงินสด' ? 'bg-blue-50 border-blue-500 shadow-lg shadow-blue-500/10' : 'bg-white border-slate-100'}`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${paymentMethod === 'เงินสด' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <i className="fa-solid fa-money-bill-wave"></i>
                                </div>
                                <span className={`font-bold ${paymentMethod === 'เงินสด' ? 'text-blue-600' : 'text-slate-500'}`}>เงินสด</span>
                            </button>
                            <button 
                                onClick={() => setPaymentMethod('พร้อมเพย์')}
                                className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === 'พร้อมเพย์' ? 'bg-blue-50 border-blue-500 shadow-lg shadow-blue-500/10' : 'bg-white border-slate-100'}`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${paymentMethod === 'พร้อมเพย์' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <i className="fa-solid fa-qrcode"></i>
                                </div>
                                <span className={`font-bold ${paymentMethod === 'พร้อมเพย์' ? 'text-blue-600' : 'text-slate-500'}`}>พร้อมเพย์</span>
                            </button>
                        </div>

                        {paymentMethod === 'พร้อมเพย์' ? (
                            <div className="text-center bg-slate-50 p-8 rounded-3xl mb-8 flex flex-col items-center">
                                {qrCodeData ? (
                                    <>
                                        <div className="bg-white p-0 rounded-2xl shadow-inner mb-4 flex items-center justify-center border-4 border-white" style={{ width: '220px', height: '220px' }}>
                                            <img src={qrCodeData} alt="PromptPay QR" className="w-[180px] h-[180px]" />
                                        </div>
                                        <p className="text-blue-600 font-black text-4xl mb-1 tracking-tight">฿{total.toLocaleString()}</p>
                                        <p className="text-slate-500 font-bold text-sm">สแกนเพื่อจ่ายเงินได้เลย</p>
                                    </>
                                ) : (
                                    <div className="py-12"><i className="fas fa-spinner fa-spin fa-2x text-blue-500"></i></div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6 mb-8">
                                <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">ยอดที่ต้องชำระ</label>
                                        <p className="text-4xl font-black text-slate-800 tracking-tight">฿{total.toLocaleString()}</p>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200">
                                        <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">รับเงินมา</label>
                                        <input 
                                            type="number"
                                            value={receivedAmount}
                                            onChange={(e) => setReceivedAmount(e.target.value)}
                                            className="w-full text-4xl font-black text-blue-600 bg-white border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                            placeholder="0"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                                        <span className="text-lg font-bold text-slate-500">เงินทอน</span>
                                        <span className={`text-4xl font-black ${change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            ฿{change.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setActiveModal(null)}
                                className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95"
                            >
                                ยกเลิก
                            </button>
                            <button 
                                onClick={onFinalizeSale}
                                disabled={paymentMethod === 'เงินสด' && (Number(receivedAmount) < total || !receivedAmount)}
                                className="flex-[2] py-4 px-6 rounded-2xl font-black text-xl text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 shadow-xl shadow-blue-600/20 transition-all active:scale-95"
                            >
                                ยืนยันการชำระเงิน
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Item Modal */}
            {activeModal === 'customItem' && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-100">
                        <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center"><i className="fa-solid fa-plus text-lg"></i></div>
                            เพิ่มรายการพิเศษ
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">ชื่อรายการ / บริการ</label>
                                <input 
                                    type="text" 
                                    value={customItem.name} 
                                    onChange={(e) => setCustomItem({...customItem, name: e.target.value})} 
                                    placeholder="เช่น ค่าแรงพิเศษ, สินค้าฝากขาย" 
                                    className="w-full text-lg font-bold p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">ราคา (บาท)</label>
                                <input 
                                    type="number" 
                                    value={customItem.price} 
                                    onChange={(e) => setCustomItem({...customItem, price: e.target.value})} 
                                    placeholder="0" 
                                    className="w-full text-2xl font-black p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white text-indigo-600 outline-none transition-all"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setActiveModal(null)} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all">ยกเลิก</button>
                                <button onClick={onAddCustomItem} className="flex-[2] py-4 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all">เพิ่มรายการ</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Services Modal */}
            {activeModal === 'manageServices' && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-2xl border border-slate-100 max-h-[90vh] flex flex-col">
                        <h2 className="text-3xl font-black text-slate-800 mb-8 text-center tracking-tight">จัดการบริการด่วน</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto pr-4 custom-scrollbar">
                            {/* List of existing services */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">บริการทั้งหมด ({quickServices.length})</h3>
                                <div className="space-y-3">
                                    {quickServices.map(s => (
                                        <div key={s.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all group">
                                            <div>
                                                <p className="font-bold text-slate-800">{s.name}</p>
                                                <p className="text-sm text-blue-600 font-bold">฿{s.price}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => onOpenServiceModal(s)} className="w-10 h-10 bg-white shadow-sm rounded-xl text-blue-500 hover:bg-blue-500 hover:text-white transition-all"><i className="fa-solid fa-pen-to-square text-sm"></i></button>
                                                <button onClick={() => onDeleteService(s.id)} className="w-10 h-10 bg-white shadow-sm rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><i className="fa-solid fa-trash text-sm"></i></button>
                                            </div>
                                        </div>
                                    ))}
                                    {quickServices.length === 0 && (
                                        <div className="py-8 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                                            <p className="font-medium">ยังไม่มีรายการเทมเพลต</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Form to add/edit service */}
                            <div className="bg-slate-50 p-6 rounded-3xl h-fit sticky top-0 border border-slate-100">
                                <h3 className="text-xl font-black text-slate-800 mb-6">{serviceToEdit ? 'แก้ไขบริการ' : 'สร้างบริการใหม่'}</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">ชื่อบริการ</label>
                                        <input 
                                            type="text" 
                                            value={newService.name} 
                                            onChange={(e) => setNewService({...newService, name: e.target.value})} 
                                            placeholder="ดึงรอยบุบ, เปลี่ยนยาง..." 
                                            className="w-full font-bold p-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">ราคาปกติ (บาท)</label>
                                        <input 
                                            type="number" 
                                            value={newService.price} 
                                            onChange={(e) => setNewService({...newService, price: e.target.value})} 
                                            placeholder="0" 
                                            className="w-full font-black p-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all text-blue-600"
                                        />
                                    </div>
                                    <button onClick={onSaveService} className="w-full py-4 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                                        {serviceToEdit ? 'บันทึกการแก้ไข' : 'สร้างเทมเพลต'}
                                    </button>
                                    {serviceToEdit && (
                                        <button onClick={() => onOpenServiceModal(null)} className="w-full py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                                            ยกเลิกการแก้ไข
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-center mt-8 pt-6 border-t border-slate-100">
                            <button onClick={() => setActiveModal(null)} className="px-12 py-4 rounded-2xl font-black text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95">ปิดหน้าต่าง</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default POSModals;
