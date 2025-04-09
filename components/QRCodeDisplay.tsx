"use client";

import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import Image from "next/image";

interface QRCodeDisplayProps {
  qrCodeUrl: string;
  appointmentDetails: {
    date: string;
    time: string;
    reason: string;
  };
  onClose: () => void;
}

export const QRCodeDisplay = ({
  qrCodeUrl,
  appointmentDetails,
  onClose
}: QRCodeDisplayProps) => {
  const handleDownload = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `appointment-qr-${appointmentDetails.date}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-black">Your Appointment QR Code</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex flex-col items-center space-y-4">
          {qrCodeUrl && (
            <div className="p-2 bg-white rounded border border-gray-200">
              {/* Option 1: Using regular img tag (works without config changes) */}
              <img 
                src={qrCodeUrl} 
                alt="Appointment QR Code" 
                className="w-full h-auto"
              />
              
              {/* Option 2: Using Next.js Image (requires next.config.js update) */}
              {/* <Image 
                src={qrCodeUrl} 
                alt="Appointment QR Code" 
                width={256} 
                height={256}
                className="w-full h-auto"
              /> */}
            </div>
          )}
          
          <div className="text-center text-black">
            <p className="font-medium">{appointmentDetails.date} at {appointmentDetails.time}</p>
            <p className="text-sm text-gray-600">{appointmentDetails.reason}</p>
          </div>
          
          <Button 
            onClick={handleDownload}
            variant="outline"
            className="flex items-center gap-2 text-black"
          >
            <Download className="w-4 h-4 text-black" />
            Download QR Code
          </Button>
          
          <p className="text-sm text-gray-500 text-center">
            Present this QR code at the counseling office to check in for your appointment.
          </p>
        </div>
      </div>
    </div>
  );
};