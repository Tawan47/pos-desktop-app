"use client";
import React from 'react';
import { Product, QuickService } from '@/types';

interface ProductSearchProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    searchResults: Product[];
    onProductSelect: (product: Product) => void;
    quickServices: QuickService[];
    onQuickServiceSelect: (service: QuickService) => void;
    onManageServices: () => void;
    onAddCustomItem: () => void;
}

const ProductSearch = ({
    searchTerm,
    setSearchTerm,
    searchResults,
    onProductSelect,
    quickServices,
    onQuickServiceSelect,
    onManageServices,
    onAddCustomItem
}: ProductSearchProps) => {
    return (
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            {/* Search Section */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <i className="fa-solid fa-magnifying-glass text-slate-400 group-focus-within:text-blue-500 transition-colors"></i>
                </div>
                <input 
                    type="text"
                    placeholder="ค้นหาสินค้าด้วยชื่อ หรือ สแกนบาร์โค้ด..."
                    className="block w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl text-lg font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
                
                {/* Search Results Dropdown */}
                {searchTerm && searchResults.length > 0 && (
                    <div className="absolute z-30 mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[60vh] overflow-y-auto">
                        {searchResults.map((product) => (
                            <div 
                                key={product.id}
                                className="flex items-center justify-between p-4 hover:bg-blue-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                                onClick={() => onProductSelect(product)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                                        <i className="fa-solid fa-box text-xl"></i>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{product.name}</p>
                                        <p className="text-sm text-slate-500">รหัส: {product.sku || product.id} | สต็อก: {product.quantity}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-xl text-blue-600">฿{product.price.toLocaleString()}</p>
                                    <p className="text-xs text-slate-400">คลิกเพื่อเพิ่ม</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Services Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {quickServices.map((service) => (
                    <button
                        key={service.id}
                        onClick={() => onQuickServiceSelect(service)}
                        className="bg-white p-4 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all group flex flex-col items-center justify-center gap-3 active:scale-95"
                    >
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <i className="fa-solid fa-screwdriver-wrench text-xl"></i>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-slate-800 text-sm line-clamp-1">{service.name}</p>
                            <p className="font-extrabold text-blue-600">฿{service.price}</p>
                        </div>
                    </button>
                ))}
                
                {/* Special Action Buttons */}
                <button
                    onClick={onAddCustomItem}
                    className="bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-100 hover:bg-indigo-100 transition-all flex flex-col items-center justify-center gap-3 active:scale-95"
                >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm">
                        <i className="fa-solid fa-plus text-xl"></i>
                    </div>
                    <p className="font-bold text-indigo-700 text-sm">รายการพิเศษ</p>
                </button>

                <button
                    onClick={onManageServices}
                    className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 hover:bg-slate-100 transition-all flex flex-col items-center justify-center gap-3 active:scale-95"
                >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-500 shadow-sm">
                        <i className="fa-solid fa-gear text-xl"></i>
                    </div>
                    <p className="font-bold text-slate-600 text-sm">ตั้งค่าบริการ</p>
                </button>
            </div>
        </div>
    );
};

export default ProductSearch;
