"use client";

import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
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
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanningActive, setScanningActive] = useState(true);

  // Check camera permissions before initializing
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setHasCameraPermission(true);
      } catch (err) {
        console.error("Camera permission error:", err);
        setHasCameraPermission(false);
        setError("Camera access was denied. Please enable camera permissions.");
      }
    };

    checkCameraPermission();
  }, []);

  useEffect(() => {
    if (!hasCameraPermission || isInitializing || !scannerContainerRef.current || !scanningActive) return;

    let scannerInstance: Html5QrcodeScanner | null = null;
    let isMounted = true;

    const initializeScanner = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        scannerInstance = new Html5QrcodeScanner(
          "qr-scanner-container",
          {
            fps,
            qrbox,
            rememberLastUsedCamera: true,
            supportedScanTypes: [Html5QrcodeSupportedFormats.QR_CODE],
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: false
            }
          },
          false
        );

        scannerInstance.render(
          (decodedText) => {
            if (isMounted && scannerInstance?.getState() === 2) {
              setScanningActive(false); // Pause scanning after success
              onScanSuccess(decodedText);
            }
          },
          (err) => {
            if (isMounted) {
              // Ignore common "not found" errors during scanning
              if (!err.includes("NotFoundException")) {
                setError(err);
                onScanError?.(err);
              }
            }
          }
        );

        if (isMounted) {
          scannerRef.current = scannerInstance;
          setCameraReady(true);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Initialization error:", err);
          setError(err.message || "Failed to initialize scanner");
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    initializeScanner();

    return () => {
      isMounted = false;
      if (scannerInstance) {
        scannerInstance.clear().catch((cleanupErr) => {
          console.error("Scanner cleanup error:", cleanupErr);
        });
      }
    };
  }, [fps, qrbox, onScanSuccess, onScanError, isInitializing, hasCameraPermission, scanningActive]);

  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasCameraPermission(true);
      setError(null);
      setScanningActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Camera access was denied. Please enable camera permissions.");
    }
  };

  const handleRetry = () => {
    setError(null);
    setScanningActive(true);
  };

  return (
    <div className="relative w-full">
      <div id="qr-scanner-container" ref={scannerContainerRef} className="w-full" />
      
      {!cameraReady && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center flex-col gap-2">
          {hasCameraPermission === false ? (
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-red-600">Camera access is required for scanning QR codes</p>
              <button 
                onClick={requestCameraAccess}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Grant Camera Access
              </button>
            </div>
          ) : isInitializing ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p>Initializing camera...</p>
            </>
          ) : error ? (
            <>
              <div className="text-red-500 text-center p-4 bg-red-50 rounded-lg">
                <p>{error}</p>
                <button 
                  onClick={handleRetry}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Retry Scanning
                </button>
              </div>
            </>
          ) : (
            <p>Loading scanner...</p>
          )}
        </div>
      )}
      
      {cameraReady && !error && (
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>• Ensure good lighting</p>
          <p>• Hold steady 15-30cm from camera</p>
          <p>• Avoid glare on the QR code</p>
        </div>
      )}
    </div>
  );
};