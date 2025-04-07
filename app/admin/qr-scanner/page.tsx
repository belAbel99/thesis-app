"use client";

import { QrScanner } from "@/components/QRScanner";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Client, Databases, Query } from "appwrite";
import SideBar from "@/components/SideBar";
import { Html5QrcodeScanner } from "html5-qrcode"; // Only for scanning


const QRScannerPage = () => {
  const [scanResult, setScanResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);
  
  const databases = new Databases(client);

  const handleScanSuccess = async (decodedText: string) => {
    if (scanResult) return;
    
    try {
      setLoading(true);
      const parsedData = JSON.parse(decodedText);
      
      // Verify appointment exists
      const appointment = await databases.getDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e",
        parsedData.appointmentId
      );

      if (appointment && appointment.status === "Scheduled") {
        // Update status to "Pending Completion"
        await databases.updateDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          "6734ba2700064c66818e",
          parsedData.appointmentId,
          { status: "Pending Completion" }
        );

        setScanResult({
          ...parsedData,
          appointmentDetails: appointment
        });
        setSuccess(true);
      } else {
        setError("Invalid or already used appointment");
      }
    } catch (err) {
      setError("Invalid QR code format");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    setSuccess(false);
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
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            {!scanResult ? (
              <div className="flex flex-col items-center">
                <div className="w-full max-w-md">
                  <QrScanner
                    onScanSuccess={handleScanSuccess}
                    onScanError={(err) => setError(err)}
                    qrbox={{ width: 300, height: 300 }}
                  />
                </div>
                <p className="mt-4 text-gray-500">Position the QR code within the frame</p>
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
                      Scan Again
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