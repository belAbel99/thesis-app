"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Client, Databases, Query } from "appwrite";
import SideBar from "@/components/SideBar";
import jsQR from "jsqr";

const QRScannerPage = () => {
  const [scanResult, setScanResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);
  
  const databases = new Databases(client);

  const handleScan = async (decodedText: string) => {
    if (scanResult) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Basic validation
      if (!decodedText || typeof decodedText !== 'string') {
        throw new Error("Invalid QR code data");
      }

      let parsedData;
      try {
        parsedData = JSON.parse(decodedText);
      } catch (e) {
        throw new Error("Invalid QR code format");
      }

      // Required fields check
      if (!parsedData.appointmentId || !parsedData.studentId) {
        throw new Error("QR code missing required data");
      }

      // Verify appointment exists
      const appointment = await databases.getDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e", // APPOINTMENT_COLLECTION_ID
        parsedData.appointmentId
      );

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      // Check current status
      if (appointment.status !== "Scheduled") {
        throw new Error(`Appointment is already ${appointment.status.toLowerCase()}`);
      }

      // Verify QR code record
      const qrRecords = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "67f2970e00143006a1fb", // APPOINTMENT_QR_CODES_COLLECTION_ID
        [
          Query.equal("appointmentId", [parsedData.appointmentId]),
          Query.equal("status", ["generated"])
        ]
      );

      if (qrRecords.documents.length === 0) {
        throw new Error("Invalid or already used QR code");
      }

      const qrRecord = qrRecords.documents[0];

      // Update appointment status
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e",
        parsedData.appointmentId,
        { status: "Pending" }
      );

      // Update QR code status
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "67f2970e00143006a1fb",
        qrRecord.$id,
        {
          status: "scanned",
          scannedAt: new Date().toISOString()
        }
      );

      setScanResult({
        ...parsedData,
        appointmentDetails: appointment
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to process QR code");
      console.error("Scan error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setLoading(true);
    
    try {
      const decodedText = await readQRFromImage(selectedFile);
      if (decodedText) {
        await handleScan(decodedText);
      } else {
        throw new Error("No QR code found in the image");
      }
    } catch (err: any) {
      setError(err.message || "Failed to read QR code from image");
    } finally {
      setLoading(false);
    }
  };

  const readQRFromImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) {
            reject(new Error("Could not create canvas context"));
            return;
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            resolve(code.data);
          } else {
            reject(new Error("No QR code found in image"));
          }
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    setSuccess(false);
    setFile(null);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <SideBar />
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-blue-700">Appointment Check-In</h1>
            <p className="text-gray-600 mt-2">Scan student QR codes to check them in</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-black">
            {!scanResult ? (
              <div className="flex flex-col items-center space-y-6">
                <div className="w-full max-w-md space-y-4">
                  <label className="block text-center">
                    Upload QR Code Image
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        cursor-pointer"
                      disabled={loading}
                    />
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  </div>
                  {file && (
                    <p className="text-sm text-gray-500">
                      Selected: {file.name}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="text-red-500 text-center mt-2">
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {loading ? (
                  <div className="flex flex-col items-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="mt-2">Verifying appointment...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <XCircle className="w-12 h-12 text-red-500" />
                    <p className="mt-2 text-red-600 font-medium">{error}</p>
                    <Button onClick={resetScanner} className="mt-4">
                      Try Again
                    </Button>
                  </div>
                ) : success && scanResult.appointmentDetails ? (
                  <div className="w-full max-w-md space-y-4">
                    <div className="flex flex-col items-center">
                      <CheckCircle className="w-12 h-12 text-green-500" />
                      <h3 className="mt-2 text-lg font-semibold">Check-In Successful!</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Student:</span>
                        <span className="font-medium">{scanResult.appointmentDetails.patientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">
                          {new Date(scanResult.appointmentDetails.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">{scanResult.appointmentDetails.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium text-blue-600">Pending Completion</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-center gap-4 mt-6">
                      <Button onClick={resetScanner} variant="outline">
                        Scan Another
                      </Button>
                      <Button onClick={() => router.push("/admin/appointments")}>
                        View Appointments
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerPage;