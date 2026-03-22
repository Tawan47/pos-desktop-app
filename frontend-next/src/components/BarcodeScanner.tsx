"use client";
import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void;
  fps?: number;
  qrbox?: number | { width: number; height: number };
  aspectRatio?: number;
  disableFlip?: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanSuccess,
  onScanFailure,
  fps = 10,
  qrbox = 250,
  aspectRatio = 1.0,
  disableFlip = false,
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Initialize the scanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps,
        qrbox,
        aspectRatio,
        disableFlip,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        onScanSuccess(decodedText);
      },
      (error) => {
        if (onScanFailure) onScanFailure(error);
      }
    );

    scannerRef.current = scanner;

    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner", error);
        });
      }
    };
  }, [onScanSuccess, onScanFailure, fps, qrbox, aspectRatio, disableFlip]);

  return (
    <div className="w-full max-w-md mx-auto overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50 shadow-inner">
      <div id="qr-reader" className="w-full" />
      <div className="p-4 bg-white border-t border-slate-100 italic text-sm text-slate-500 text-center">
         วางบาร์โค้ดให้อยู่ในกรอบเพื่อสแกน
      </div>
    </div>
  );
};

export default BarcodeScanner;
