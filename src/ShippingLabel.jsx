import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';

// Component ย่อยสำหรับ Barcode (ไม่มีการแก้ไข)
const Barcode = ({ value, format = 'CODE128', width = 2, height = 50 }) => {
    const svgRef = useRef(null);
    useEffect(() => {
        if (svgRef.current && window.JsBarcode) {
            try {
                window.JsBarcode(svgRef.current, value, {
                    format,
                    width,
                    height,
                    displayValue: true,
                    margin: 0,
                });
            } catch (e) { console.error("Barcode error:", e); }
        }
    }, [value, format, width, height]);
    return <svg ref={svgRef} />;
};


// Component หลักสำหรับสร้างใบปะหน้า
const ShippingLabel = () => {
    // State และฟังก์ชันต่างๆ ยังคงเหมือนเดิม ไม่มีการแก้ไข
    const [sender, setSender] = useState({
        name: 'ร้านมายด์ ล้อซิ่ง',
        address: 'อ่างเก็บน้ำหนองค้อ เส้นสวนเสือ ตำบล หนองขาม อำเภอศรีราชา ชลบุรี 20230',
        phone: '081-591-2992'
    });
    const [receiver, setReceiver] = useState({
        name: '',
        address: '',
        phone: ''
    });
    const [orderDetails, setOrderDetails] = useState({
        trackingNumber: '',
        notes: '',
        codAmount: 0
    });
    const [shopLogo, setShopLogo] = useState(null);

    useEffect(() => {
        if (window.electronAPI && typeof window.electronAPI.getLogoData === 'function') {
            window.electronAPI.getLogoData().then(logoDataUrl => {
                if (logoDataUrl) setShopLogo(logoDataUrl);
            });
        }
    }, []);
    
    const handleSenderChange = (e) => setSender({ ...sender, [e.target.name]: e.target.value });
    const handleReceiverChange = (e) => setReceiver({ ...receiver, [e.target.name]: e.target.value });
    const handleOrderChange = (e) => setOrderDetails({ ...orderDetails, [e.target.name]: e.target.value });

    // ฟังก์ชันสร้างและสั่งพิมพ์ใบปะหน้า
    const handlePrint = () => {
        if (!receiver.name || !receiver.address || !receiver.phone) {
            return toast.error('กรุณากรอกข้อมูลผู้รับให้ครบถ้วน');
        }

        const codAmount = parseFloat(orderDetails.codAmount) || 0;
        
        // --- FIX: ออกแบบ Template ใหม่เพื่อความชัดเจนสูงสุด ---
        const printHtml = `
            <html>
                <head>
                    <title>Shipping Label - ${orderDetails.trackingNumber || 'N/A'}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@500;700&display=swap');
                        @page { size: 100mm 150mm; margin: 0; }
                        html, body {
                            width: 100mm; height: 150mm; margin: 0; padding: 0;
                            box-sizing: border-box; overflow: hidden;
                            font-family: 'IBM Plex Sans Thai', sans-serif; 
                            -webkit-print-color-adjust: exact; color: #000;
                        }
                        .label-container {
                            width: 100%; height: 100%; box-sizing: border-box;
                            display: flex; flex-direction: column; background-color: #fff; padding: 5mm;
                        }
                        .section {
                            padding: 3mm; border: 2.5px solid #000;
                        }
                        .header {
                            display: flex; justify-content: space-between; align-items: flex-start;
                            padding-bottom: 3mm;
                        }
                        .header img { max-height: 12mm; }
                        .header .type { font-size: 12pt; font-weight: 700; }
                        
                        .main-info {
                            flex-grow: 1; display: flex; flex-direction: column;
                            border-top: 2.5px solid #000; border-bottom: 2.5px solid #000;
                            padding: 3mm 0; margin: 3mm 0;
                        }
                        .info-box { padding: 2mm 0; }
                        .info-box:first-child { border-bottom: 2px solid #000; padding-bottom: 4mm; margin-bottom: 2mm; }
                        
                        .info-box .title {
                            font-size: 10pt; font-weight: 700; margin-bottom: 1mm; text-transform: uppercase;
                        }
                        .info-box p { margin: 0; }
                        
                        .sender-info p { font-size: 11pt; font-weight: 500; line-height: 1.5; }

                        .receiver-info .name { font-size: 22pt; font-weight: 700; line-height: 1.3; }
                        .receiver-info .address { font-size: 16pt; font-weight: 500; line-height: 1.6; margin: 1mm 0; }
                        .receiver-info .phone { font-size: 22pt; font-weight: 700; }
                        
                        .barcode-section { text-align: center; padding: 3mm 0; }
                        .barcode-placeholder { color: #888; padding: 20mm 0; }
                        
                        .footer { 
                           margin-top: auto; padding-top: 3mm;
                           display: flex; justify-content: space-between; align-items: stretch; gap: 4mm;
                        }
                        .notes-info { font-size: 9pt; width: 60%; font-weight: 500;}
                        .cod-section {
                            width: 40%; background-color: #000; color: #fff; text-align: center;
                            padding: 3mm; border-radius: 6px;
                            display: flex; flex-direction: column; justify-content: center;
                        }
                        .cod-section .cod-title { font-size: 10pt; font-weight: 500; }
                        .cod-section .cod-amount { font-size: 24pt; font-weight: 700; line-height: 1.1; }
                    </style>
                </head>
                <body>
                    <div class="label-container">
                        <div class="header">
                            ${shopLogo ? `<img src="${shopLogo}" alt="Logo">` : '<span></span>'}
                            <div class="type">${codAmount > 0 ? 'เก็บเงินปลายทาง' : 'ส่งปกติ'}</div>
                        </div>

                        <div class="main-info">
                            <div class="info-box sender-info">
                                <p class="title">From / ผู้ส่ง</p>
                                <p><b>${sender.name}</b><br>${sender.address}<br>โทร. ${sender.phone}</p>
                            </div>
                             <div class="info-box receiver-info">
                                <p class="title">To / ผู้รับ</p>
                                <p class="name">${receiver.name}</p>
                                <p class="address">${receiver.address}</p>
                                <p class="phone">โทร. ${receiver.phone}</p>
                            </div>
                        </div>

                        <div class="barcode-section">
                            ${orderDetails.trackingNumber ? 
                                `<svg id="trackingBarcode"></svg>` : 
                                `<div class="barcode-placeholder"><span>(ไม่มีเลขพัสดุ)</span></div>`
                            }
                        </div>

                        <div class="footer">
                           <div class="notes-info">
                               <b>หมายเหตุ:</b> ${orderDetails.notes || '-'}
                           </div>
                           ${codAmount > 0 ? `
                           <div class="cod-section">
                               <span class="cod-title">ยอดชำระ</span>
                               <span class="cod-amount">${codAmount.toFixed(2)}</span>
                           </div>
                           ` : ''}
                        </div>
                    </div>
                    
                    ${orderDetails.trackingNumber ? `
                        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
                        <script>
                            try {
                                JsBarcode("#trackingBarcode", "${orderDetails.trackingNumber}", {
                                    format: "CODE128", width: 3.5, height: 60, textMargin: 4, fontSize: 20, font: "IBM Plex Sans Thai",
                                });
                            } catch(e) { console.error(e); }
                        <\/script>
                    ` : ''}
                </body>
            </html>
        `;

        if (window.electronAPI && typeof window.electronAPI.printComponent === 'function') {
            window.electronAPI.printComponent(printHtml);
        } else {
            toast.error('ไม่สามารถเชื่อมต่อฟังก์ชันการพิมพ์ได้');
        }
    };

    // ส่วน JSX ของ Component (ไม่มีการแก้ไข)
    return (
        <div className="p-4 sm:p-6 lg:p-8 font-sans">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">พิมพ์ใบปะหน้าพัสดุ</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ฟอร์มกรอกข้อมูล */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4">ข้อมูลผู้ส่ง</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">ชื่อร้าน/ผู้ส่ง</label>
                                <input type="text" name="name" value={sender.name} onChange={handleSenderChange} className="mt-1 block w-full input-style" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">ที่อยู่ผู้ส่ง</label>
                                <textarea name="address" value={sender.address} onChange={handleSenderChange} rows="3" className="mt-1 block w-full input-style"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">เบอร์โทรผู้ส่ง</label>
                                <input type="text" name="phone" value={sender.phone} onChange={handleSenderChange} className="mt-1 block w-full input-style" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4">ข้อมูลผู้รับ</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">ชื่อผู้รับ</label>
                                <input type="text" name="name" value={receiver.name} onChange={handleReceiverChange} className="mt-1 block w-full input-style" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">ที่อยู่ผู้รับ</label>
                                <textarea name="address" value={receiver.address} onChange={handleReceiverChange} rows="3" className="mt-1 block w-full input-style"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">เบอร์โทรผู้รับ</label>
                                <input type="text" name="phone" value={receiver.phone} onChange={handleReceiverChange} className="mt-1 block w-full input-style" />
                            </div>
                        </div>
                    </div>
                </div>
                {/* ส่วนควบคุมและตัวอย่าง */}
                <div className="space-y-6">
                     <div className="bg-white p-6 rounded-xl shadow-lg">
                         <h2 className="text-xl font-bold mb-4">รายละเอียดออเดอร์</h2>
                         <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">เลขพัสดุ (ไม่บังคับ)</label>
                                <input type="text" name="trackingNumber" value={orderDetails.trackingNumber} onChange={handleOrderChange} className="mt-1 block w-full input-style" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">ยอดเก็บเงินปลายทาง (COD) (ใส่ 0 หากไม่มี)</label>
                                <input type="number" name="codAmount" value={orderDetails.codAmount} onChange={handleOrderChange} className="mt-1 block w-full input-style" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">หมายเหตุ</label>
                                <input type="text" name="notes" value={orderDetails.notes} onChange={handleOrderChange} className="mt-1 block w-full input-style" />
                            </div>
                         </div>
                     </div>
                     <button
                        onClick={handlePrint}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-lg transition-colors text-lg"
                     >
                        สร้างและสั่งพิมพ์ใบปะหน้า
                     </button>
                     <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                        <h3 className="text-lg font-semibold text-gray-500 mb-4">ตัวอย่างบาร์โค้ดเลขพัสดุ</h3>
                        <div className="min-h-[60px] flex justify-center items-center">
                        {orderDetails.trackingNumber ? 
                            <Barcode value={orderDetails.trackingNumber} /> : 
                            <p className="text-gray-400">กรุณากรอกเลขพัสดุ</p>
                        }
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ShippingLabel;
