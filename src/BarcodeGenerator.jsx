import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';

// This component remains the same, the fix is in the main component logic.
const Barcode = ({ value, format, width, height, fontSize, margin, background, lineColor }) => {
    const svgRef = useRef(null);

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


// Main Barcode Generator Component
const BarcodeGenerator = ({ products = [] }) => {
  const [mode, setMode] = useState('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customData, setCustomData] = useState({ name: '', price: '', barcode: '' });
  const [printQuantity, setPrintQuantity] = useState(1);
  const barcodePrintRef = useRef();

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredProducts([]);
      return;
    }
    const matches = products.filter(p =>
      p.name.toLowerCase().includes(term.toLowerCase()) ||
      (p.barcode && p.barcode.toString().toLowerCase().includes(term.toLowerCase()))
    );
    setFilteredProducts(matches.slice(0, 10));
  };

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setFilteredProducts([]);
    setCustomData({ name: '', price: '', barcode: '' });
  };

  const handleCustomChange = (field, value) => {
    if (field === 'barcode' && !/^\d*$/.test(value)) {
        return toast.warn('Barcode must contain only numbers.');
    }
    setCustomData(prev => ({...prev, [field]: value}));
    setSelectedProduct(null);
  };
  
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
    toast.info(`Generated new EAN-13 barcode: ${fullBarcode}`);
  };

  const handlePrint = () => {
    const productToPrint = selectedProduct || (customData.barcode ? customData : null);

    if (!productToPrint || !productToPrint.barcode || productToPrint.barcode.length !== 13) {
      return toast.error("Please provide a valid 13-digit EAN-13 barcode.");
    }
    if (printQuantity < 1) {
      return toast.error("Print quantity must be greater than 0.");
    }

    const svgNode = barcodePrintRef.current.querySelector('svg');
    if (!svgNode) {
      return toast.error("Could not generate the barcode image.");
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgNode);

    let stickersHtml = '';
    for (let i = 0; i < printQuantity; i++) {
        stickersHtml += `
            <div style="width: 40mm; height: 25mm; display: flex; flex-direction: column; justify-content: center; align-items: center; page-break-after: always; box-sizing: border-box; overflow: hidden; padding: 1mm; font-family: sans-serif;">
                <p style="font-size: 8pt; font-weight: bold; text-align: center; margin: 0 0 1mm 0; line-height: 1.1;">${productToPrint.name || ''}</p>
                ${productToPrint.price ? `<p style="margin: 0 0 1mm 0; font-size: 8pt; text-align: center;">฿${parseFloat(productToPrint.price).toFixed(2)}</p>` : ''}
                <div style="line-height: 1; width: 100%; text-align: center;">${svgString}</div>
            </div>
        `;
    }

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    iframe.contentDocument.write(`
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
                -webkit-font-smoothing: none; /* Disable anti-aliasing */
            }
            svg { 
                max-width: 100%; 
                height: auto; 
                display: block; 
                margin: 0 auto;
                /* Key properties for crisp printing */
                shape-rendering: crispEdges; /* Most important for SVG shapes */
                image-rendering: crisp-edges;
                text-rendering: optimizeLegibility;
            }
          </style>
        </head>
        <body>${stickersHtml}</body>
      </html>
    `);
    
    const image = iframe.contentDocument.querySelector('svg');
    if (image) {
        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            setTimeout(() => { document.body.removeChild(iframe); }, 500);
        }, 300);
    }
  };
  
  const productToPreview = selectedProduct || (customData.barcode ? customData : null);
  // --- FIX: Use productToPreview instead of productToPrint which is out of scope ---
  const isBarcodeValid = productToPreview && productToPreview.barcode && productToPreview.barcode.length === 13;

  return (
    <div className="p-4 sm:p-6 lg:p-8 font-sans space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Barcode Generator & Printing</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-lg self-start">
            <div className="flex border-b mb-4">
                <button onClick={() => setMode('search')} className={`py-2 px-4 font-semibold ${mode === 'search' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Search Product</button>
                <button onClick={() => setMode('custom')} className={`py-2 px-4 font-semibold ${mode === 'custom' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Create Custom</button>
            </div>

            {mode === 'custom' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Product Name</label>
                        <input type="text" placeholder="e.g., TE37 Wheel" value={customData.name} onChange={e => handleCustomChange('name', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Price</label>
                        <input type="number" placeholder="e.g., 3200" value={customData.price} onChange={e => handleCustomChange('price', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Barcode Number (EAN-13)</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <input type="text" value={customData.barcode} onChange={e => handleCustomChange('barcode', e.target.value)} maxLength="13" className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 border-gray-300" />
                            <button type="button" onClick={generateBarcode} className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-600 text-sm hover:bg-gray-100 rounded-r-md">Generate</button>
                        </div>
                    </div>
                </div>
            )}
            
            {mode === 'search' && (
                <div className="space-y-4">
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700">Search Product</label>
                        <input
                            type="text"
                            placeholder="Search by name or barcode..."
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
              <label className="block text-sm font-medium text-gray-700">Print Quantity</label>
              <input
                type="number" min="1" value={printQuantity}
                onChange={(e) => setPrintQuantity(Number(e.target.value))}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500"
              />
            </div>
            
            <button
              onClick={handlePrint}
              disabled={!isBarcodeValid}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-base disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Print Barcodes
            </button>
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-lg flex flex-col justify-center items-center min-h-[300px]">
          <h3 className="text-lg font-semibold text-gray-500 mb-4">Barcode Preview</h3>
          <div className="text-center" ref={barcodePrintRef} style={{minHeight: '120px'}}>
              {productToPreview && productToPreview.barcode ? (
                  isBarcodeValid ? (
                      <div>
                          <p className="font-semibold text-lg">{productToPreview.name || 'Sample Product'}</p>
                          {productToPreview.price && <p className="text-sm text-gray-600 mb-2">฿{parseFloat(productToPreview.price).toFixed(2)}</p>}
                          
                          <Barcode 
                              value={productToPreview.barcode} 
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
                          <p className="font-bold">Invalid Barcode</p>
                          <p className="text-sm">EAN-13 barcodes must be exactly 13 digits long.</p>
                      </div>
                  )
              ) : (
                  <div className="text-center text-gray-400">
                      <p>Please select a product or create a custom barcode to see the preview.</p>
                  </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeGenerator;
