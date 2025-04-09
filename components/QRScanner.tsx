"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";

type QrScannerProps = {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  qrbox?: { width: number; height: number };
  fps?: number;
};

export const QrScanner = ({
  onScanSuccess,
  onScanError,
  qrbox = { width: 500, height: 500 },
  fps = 10
}: QrScannerProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    if (!scannerContainerRef.current) return;

    const initializeScanner = () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }

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
          if (scannerRef.current?.getState() === 2) {
            onScanSuccess(decodedText);
          }
        },
        (error) => {
          onScanError?.(error);
        }
      );
      setCameraReady(true);
    };

    initializeScanner();

    return () => {
      scannerRef.current?.clear().catch(console.error);
    };
  }, [fps, qrbox, onScanSuccess, onScanError]);

  return (
    <div className="relative">
      <div id="qr-scanner-container" ref={scannerContainerRef} />
      {!cameraReady && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <p>Initializing camera...</p>
        </div>
      )}
    </div>
  );
};