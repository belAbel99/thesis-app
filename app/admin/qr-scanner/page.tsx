"use client";

import { QrScanner } from "@/components/QRScanner";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Upload, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Client, Databases, Query, ID} from "appwrite";
import SideBar from "@/components/SideBar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import jsQR from "jsqr";

const QRScannerPage = () => {
  const [scanResult, setScanResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const router = useRouter();

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);
  
  const databases = new Databases(client);

  const handleScanSuccess = async (decodedText: string) => {
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

      // Verify the hash
      const expectedHash = generateHash(parsedData.appointmentId);
      if (parsedData.hash !== expectedHash) {
        throw new Error("Invalid QR code");
      }

      // Verify appointment exists
      const appointment = await databases.getDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e",
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
        "67f2970e00143006a1fb",
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

      // After successful scan, create notification
      const student = await databases.getDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PATIENT_COLLECTION_ID!,
        parsedData.studentId
      );

      const counselors = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_COUNSELOR_COLLECTION_ID!,
        [
          Query.equal("program", [student.program]),
          Query.limit(1)
        ]
      );

      if (counselors.documents.length > 0) {
        const counselor = counselors.documents[0];
        
        // Create notification
        await databases.createDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          process.env.NEXT_PUBLIC_NOTIFICATIONS_COLLECTION_ID!,
          ID.unique(),
          {
            counselorId: counselor.$id,
            studentId: parsedData.studentId,
            appointmentId: parsedData.appointmentId,
            message: `${student.name} has checked in for their appointment`,
            read: false,
            type: "qr_scan",
            createdAt: new Date().toISOString(),
            redirectUrl: `/admin/counselors/appointments?appointmentId=${parsedData.appointmentId}`
          }
        );
      }

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
    setCameraActive(false);
    
    try {
      const decodedText = await readQRFromImage(selectedFile);
      if (decodedText) {
        await handleScanSuccess(decodedText);
      } else {
        throw new Error("No QR code found in the image");
      }
    } catch (err: any) {
      setError(err.message || "Failed to read QR code from image");
    } finally {
      setLoading(false);
      setCameraActive(true);
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

  const generateHash = (appointmentId: string): string => {
    let hash = 0;
    for (let i = 0; i < appointmentId.length; i++) {
      const char = appointmentId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    setSuccess(false);
    setFile(null);
    setCameraActive(true);
  };

  const toggleCamera = () => {
    setCameraActive(!cameraActive);
    setError(null);
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
                <div className="w-full flex justify-center gap-4">
                  <Button 
                    variant={cameraActive ? "default" : "outline"} 
                    onClick={toggleCamera}
                    className="flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Use Camera
                  </Button>
                  <Button 
                    variant={!cameraActive ? "default" : "outline"} 
                    onClick={toggleCamera}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Image
                  </Button>
                </div>

                {cameraActive ? (
                  <div className="w-full max-w-md">
                    <QrScanner
                      onScanSuccess={handleScanSuccess}
                      onScanError={(err) => {
                        // Ignore common "not found" errors during scanning
                        if (!err.includes("NotFoundException")) {
                          setError(err);
                        }
                      }}
                      qrbox={{ width: 250, height: 250 }}
                    />
                    <p className="mt-4 text-gray-500 text-center">
                      Position the QR code within the frame
                    </p>
                  </div>
                ) : (
                  <div className="w-full max-w-md space-y-4">
                    <Label htmlFor="qr-upload" className="text-center block">
                      Upload QR Code Image
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="qr-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="cursor-pointer"
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
                )}

                {error && (
                  <div className="text-red-500 text-center mt-2">
                    {error}
                  </div>
                )}

                {loading && (
                  <div className="flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="ml-2">Processing...</span>
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
                        <span className="text-gray-600">Program:</span>
                        <span className="font-medium">{scanResult.program}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assigned Counselor:</span>
                        <span className="font-medium">{scanResult.counselorId}</span>
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