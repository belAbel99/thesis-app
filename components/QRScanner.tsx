"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef } from "react";

type QrScannerProps = {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  qrbox?: { width: number; height: number };
  fps?: number;
};

export const QrScanner = ({
  onScanSuccess,
  onScanError,
  qrbox = { width: 250, height: 250 },
  fps = 10
}: QrScannerProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scannerContainerRef.current) return;

    scannerRef.current = new Html5QrcodeScanner(
      "qr-scanner-container",
      {
        fps,
        qrbox,
        rememberLastUsedCamera: true,
        supportedScanTypes: [0, 1] // 0 = QR_CODE, 1 = BARCODE
      },
      false
    );

    scannerRef.current.render(
      (decodedText) => {
        if (scannerRef.current?.getState() === 2) { // 2 = SCANNING
          onScanSuccess(decodedText);
        }
      },
      (error) => {
        onScanError?.(error);
      }
    );

    return () => {
      scannerRef.current?.clear().catch(console.error);
    };
  }, [fps, qrbox, onScanSuccess, onScanError]);

  return <div id="qr-scanner-container" ref={scannerContainerRef} />;
};