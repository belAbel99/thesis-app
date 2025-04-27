"use client";

import { Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from "html5-qrcode";
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
  qrbox = { width: 250, height: 250 },
  fps = 10
}: QrScannerProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error("Camera permission error:", err);
      return false;
    }
  };

  const initializeScanner = async () => {
    if (!scannerContainerRef.current || isInitializing) return;

    setIsInitializing(true);
    setError(null);

    const hasPermission = await checkCameraPermission();
    if (!hasPermission) {
      setError("Camera access was denied. Please enable camera permissions.");
      setIsInitializing(false);
      return;
    }

    try {
      const scanner = new Html5QrcodeScanner(
        scannerContainerRef.current.id,
        {
          fps,
          qrbox,
          rememberLastUsedCamera: true,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          experimentalFeatures: { useBarCodeDetectorIfSupported: false }
        },
        false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear(); // Stop scanning after success
          onScanSuccess(decodedText);
        },
        (scanError) => {
          if (scanError) {
            // Ignore normal "no QR detected" errors
            if (
              !scanError.includes("NotFoundException") &&
              !scanError.includes("No MultiFormat Readers")
            ) {
              console.error("Scan error:", scanError);
              setError(scanError);
              onScanError?.(scanError);
            }
          }
        }
      );

      scannerRef.current = scanner;
      setCameraReady(true);
    } catch (err: any) {
      console.error("Scanner initialization error:", err);
      setError(err.message || "Failed to initialize scanner");
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initializeScanner();

    return () => {
      scannerRef.current?.clear().catch(err => console.error("Scanner cleanup error:", err));
    };
  }, []);

  const retryHandler = () => {
    setError(null);
    initializeScanner();
  };

  return (
    <div className="relative w-full">
      <div id="qr-scanner-container" ref={scannerContainerRef} className="w-full" />

      {!cameraReady && (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center gap-4">
          {isInitializing ? (
            <>
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              <p>Initializing scanner...</p>
            </>
          ) : error ? (
            <>
              <div className="p-4 bg-red-100 rounded-lg text-center">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={retryHandler}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Retry
                </button>
              </div>
            </>
          ) : (
            <p>Waiting for camera access...</p>
          )}
        </div>
      )}

      {cameraReady && !error && (
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>• Ensure good lighting</p>
          <p>• Hold steady 15–30cm from the camera</p>
          <p>• Avoid glare on the QR code</p>
        </div>
      )}
    </div>
  );
};
