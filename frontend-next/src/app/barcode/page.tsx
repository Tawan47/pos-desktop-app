"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/providers/StoreProvider';
import { toast } from 'react-toastify';

interface BarcodeProps {
    value: string;
    format: string;
    width: number;
    height: number;
    fontSize: number;
    margin: number;
    background: string;
    lineColor: string;
}

interface Product {
    id: number | string;
    name: string;
    barcode: string | number;
    price: number;
    quantity: number;
    brand?: string;
    color?: string;
    size?: string;
}

declare global {
    interface Window {
        JsBarcode: any;
        electronAPI: any;
    }
}

// Component ย่อยสำหรับแสดงผล Barcode
const Barcode: React.FC<BarcodeProps> = ({ value, format, width, height, fontSize, margin, background, lineColor }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const initBarcode = () => {
            if (svgRef.current && window.JsBarcode) {
                try {
                    window.JsBarcode(svgRef.current, value, {
                        format: format,
                        width: width,
                        height: height,
                        fontSize: fontSize,
                        margin: margin,
                        background: background,
                        lineColor: lineColor,
                        displayValue: true,
                        fontOptions: "bold",
                        textAlign: "center",
                    });
                } catch (e) {
                    console.error("Barcode generation error:", e);
                    if (svgRef.current) svgRef.current.innerHTML = ''; 
                }
            }
        };

        // โหลด script ของ JsBarcode ถ้ายังไม่มี
        if (window.JsBarcode) {
            initBarcode();
        } else {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js";
            script.async = true;
            script.onload = initBarcode;
            script.onerror = () => console.error("Failed to load JsBarcode script.");
            document.body.appendChild(script);

            return () => {
                const existingScript = document.querySelector(`script[src="${script.src}"]`);
                if (existingScript) document.body.removeChild(existingScript);
            };
        }
    }, [value, format, width, height, fontSize, margin, background, lineColor]);

    return <svg ref={svgRef} />;
};


// Component หลัก
export default function BarcodeGenerator() {
    const { products } = useStore();
    const [mode, setMode] = useState<'search' | 'custom'>('search');
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [customData, setCustomData] = useState({ name: '', price: '', barcode: '' });
    const [printQuantity, setPrintQuantity] = useState(1);
    const barcodePrintRef = useRef<HTMLDivElement>(null);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (!term.trim()) {
            setFilteredProducts([]);
            return;
        }
        const matches = (products as Product[]).filter(p =>
            p.name.toLowerCase().includes(term.toLowerCase()) ||
            (p.barcode && String(p.barcode).toLowerCase().includes(term.toLowerCase()))
        );
        setFilteredProducts(matches.slice(0, 10));
    };

    const selectProduct = (product: Product) => {
        setSelectedProduct(product);
        setSearchTerm(product.name);
        setFilteredProducts([]);
        setCustomData({ name: '', price: '', barcode: '' });
    };

    const handleCustomChange = (field: string, value: string) => {
        if (field === 'barcode' && !/^\d*$/.test(value)) {
            return toast.warn('บาร์โค้ดต้องเป็นตัวเลขเท่านั้น');
        }
        setCustomData(prev => ({...prev, [field]: value}));
        setSelectedProduct(null);
    };
    
    // ฟังก์ชันสร้างบาร์โค้ด EAN-13 แบบสุ่ม
    const generateBarcode = () => {
        const randomBase = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        let oddSum = 0;
        let evenSum = 0;
        for (let i = 0; i < randomBase.length; i++) {
            if ((i + 1) % 2 === 0) {
                evenSum += parseInt(randomBase[i], 10);
            } else {
                oddSum += parseInt(randomBase[i], 10);
            }
        }
        const totalSum = oddSum + (evenSum * 3);
        const checksum = (10 - (totalSum % 10)) % 10;
        const fullBarcode = randomBase + checksum;
        handleCustomChange('barcode', fullBarcode);
        toast.info(`สร้างบาร์โค้ด EAN-13 ใหม่: ${fullBarcode}`);
    };

    // --- FIX #2: ปรับปรุงฟังก์ชันการพิมพ์ให้ใช้ IPC ของ Electron ---
    const handlePrint = () => {
        const productToPrint = selectedProduct || (customData.barcode ? customData : null);

        if (!productToPrint || !productToPrint.barcode || String(productToPrint.barcode).length !== 13) {
            return toast.error("กรุณาเลือกสินค้าหรือกรอกบาร์โค้ด EAN-13 (13 หลัก) ให้ถูกต้อง");
        }
        if (printQuantity < 1) {
            return toast.error("จำนวนที่พิมพ์ต้องมากกว่า 0");
        }

        const svgNode = barcodePrintRef.current?.querySelector('svg');
        if (!svgNode) {
            return toast.error("ไม่สามารถสร้างรูปภาพบาร์โค้ดได้");
        }

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgNode);

        let stickersHtml = '';
        for (let i = 0; i < printQuantity; i++) {
            stickersHtml += `
                <div style="width: 40mm; height: 25mm; display: flex; flex-direction: column; justify-content: center; align-items: center; page-break-after: always; box-sizing: border-box; overflow: hidden; padding: 1mm; font-family: sans-serif;">
                    <p style="font-size: 8pt; font-weight: bold; text-align: center; margin: 0 0 1mm 0; line-height: 1.1;">${(productToPrint as any).name || ''}</p>
                    ${(productToPrint as any).price ? `<p style="margin: 0 0 1mm 0; font-size: 8pt; text-align: center;">฿${parseFloat(String((productToPrint as any).price)).toFixed(2)}</p>` : ''}
                    <div style="line-height: 1; width: 100%; text-align: center;">${svgString}</div>
                </div>
            `;
        }
        
        const fullHtml = `
            <html>
                <head>
                    <title>Print Barcodes</title>
                    <style>
                        @page { 
                            size: 40mm 25mm; 
                            margin: 0; 
                        }
                        body { 
                            margin: 0; 
                            padding: 0; 
                        }
                        svg { 
                            max-width: 100%; 
                            height: auto; 
                            display: block; 
                            margin: 0 auto;
                            shape-rendering: crispEdges;
                        }
                    </style>
                </head>
                <body>${stickersHtml}</body>
            </html>
        `;
        
        // ส่ง HTML ไปยัง Main Process ผ่าน preload script
        if (window.electronAPI && typeof window.electronAPI.printComponent === 'function') {
            window.electronAPI.printComponent(fullHtml);
        } else {
            console.error('Print function is not available. Check your preload script.');
            toast.error('ไม่สามารถเชื่อมต่อฟังก์ชันการพิมพ์ได้');
        }
    };
    
    const productToPreview = selectedProduct || (customData.barcode ? customData : null);
    
    // --- FIX #1: แก้ไขการตรวจสอบความถูกต้องของบาร์โค้ด ---
    // แปลงเป็น String ก่อนนับความยาวเสมอ
    const isBarcodeValid = productToPreview && (productToPreview as any).barcode && String((productToPreview as any).barcode).length === 13;

    return (
        <div className="p-4 sm:p-6 lg:p-8 font-sans space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">เครื่องสร้างและพิมพ์บาร์โค้ด</h1>
                    <p className="text-slate-500 font-medium mt-1">สร้างรหัสบาร์โค้ด EAN-13 และพิมพ์สติ๊กเกอร์</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                {/* ส่วนของฟอร์ม (ซ้าย) */}
                <div className="md:col-span-1 bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 self-start">
                    <div className="flex border-b mb-4">
                        <button onClick={() => setMode('search')} className={`py-2 px-4 font-semibold ${mode === 'search' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>ค้นหาสินค้า</button>
                        <button onClick={() => setMode('custom')} className={`py-2 px-4 font-semibold ${mode === 'custom' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>สร้างเอง</button>
                    </div>

                    {mode === 'custom' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">ชื่อสินค้า</label>
                                <input type="text" placeholder="เช่น ล้อ TE37" value={customData.name} onChange={e => handleCustomChange('name', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">ราคา</label>
                                <input type="number" placeholder="เช่น 3200" value={customData.price} onChange={e => handleCustomChange('price', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">เลขบาร์โค้ด (EAN-13)</label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <input type="text" value={customData.barcode} onChange={e => handleCustomChange('barcode', e.target.value)} maxLength={13} className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 border-gray-300" />
                                    <button type="button" onClick={generateBarcode} className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-600 text-sm hover:bg-gray-100 rounded-r-md">สร้าง</button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {mode === 'search' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700">ค้นหาสินค้า</label>
                                <input
                                    type="text"
                                    placeholder="ค้นหาจากชื่อหรือบาร์โค้ด..."
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
                                    value={searchTerm}
                                    onChange={handleSearch}
                                />
                                {filteredProducts.length > 0 && (
                                    <ul className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto border">
                                        {filteredProducts.map(p => (
                                            <li key={p.id} className="p-3 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => selectProduct(p)}>
                                                {p.name} <span className="text-gray-500">({p.barcode})</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}

                    <hr className="my-6"/>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">จำนวนที่ต้องการพิมพ์</label>
                        <input
                            type="number" min="1" value={printQuantity}
                            onChange={(e) => setPrintQuantity(Number(e.target.value))}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500"
                        />
                    </div>
                    
                    <button
                        onClick={handlePrint}
                        disabled={!isBarcodeValid}
                        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-xl shadow-blue-600/30 text-lg disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed active:scale-95 disabled:active:scale-100"
                    >
                        <i className="fa-solid fa-print mr-2"></i> พิมพ์บาร์โค้ด
                    </button>
                </div>

                {/* ส่วนของ Preview (ขวา) */}
                <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-center items-center min-h-[300px]">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><i className="fa-solid fa-eye text-blue-500"></i> ตัวอย่างบาร์โค้ด</h3>
                    <div className="text-center" ref={barcodePrintRef} style={{minHeight: '120px'}}>
                        {productToPreview && (productToPreview as any).barcode ? (
                            isBarcodeValid ? (
                                <div>
                                    <p className="font-semibold text-lg">{(productToPreview as any).name || 'สินค้าตัวอย่าง'}</p>
                                    {(productToPreview as any).price && <p className="text-sm text-gray-600 mb-2">฿{parseFloat(String((productToPreview as any).price)).toFixed(2)}</p>}
                                    <Barcode 
                                        value={String((productToPreview as any).barcode)} // ส่งค่าเป็น String เสมอ
                                        format="EAN13"
                                        width={2.5}
                                        height={60}
                                        fontSize={14}
                                        margin={10}
                                        background="#FFFFFF"
                                        lineColor="#000000"
                                    />
                                </div>
                            ) : (
                                <div className="text-center text-red-500 p-4 border border-red-300 rounded-md">
                                    <p className="font-bold">บาร์โค้ดไม่ถูกต้อง</p>
                                    <p className="text-sm">บาร์โค้ดแบบ EAN-13 ต้องมี 13 หลักพอดี</p>
                                </div>
                            )
                        ) : (
                            <div className="text-center text-gray-400">
                                <p>กรุณาเลือกสินค้าหรือสร้างบาร์โค้ดเพื่อดูตัวอย่าง</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
