"use client";

import { useState } from "react";
import { Client, Databases, ID } from "appwrite";
import { Button } from "@/components/ui/button";

interface AppointmentFormProps {
  userId: string;
}

const AppointmentForm = ({ userId }: AppointmentFormProps) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [patientName, setPatientName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState("");

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);

  const databases = new Databases(client);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const appointmentData = {
      patientName,
      date,
      time,
      reason,
      status: "Scheduled",
      userid: userId,
    };

    try {
      await databases.createDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e",
        ID.unique(),
        appointmentData
      );

      setPatientName("");
      setDate("");
      setTime("");
      setReason("");
      setMessage("✅ Appointment scheduled successfully!");
      setMessageType("success");
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      setMessage("Failed to schedule appointment. Please try again.");
      setMessageType("error");
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Patient Name</label>
        <input
          type="text"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          className="mt-1 block w-full rounded-md border-2 border-blue-700 p-2 bg-white text-black focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full rounded-md border-2 border-blue-700 bg-white text-black p-2 focus:outline-none placeholder-black"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Time</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="mt-1 block w-full rounded-md border-2 border-blue-700 bg-white text-black p-2 focus:outline-none placeholder-black"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Reason for Visit</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 block w-full rounded-md border-2 border-blue-700 bg-white text-black p-2 focus:outline-none"
          rows={4}
          required
        />
      </div>

      {message && (
            <div className="flex items-center justify-center">
              <div
                className={`flex px-4 py-3 rounded relative my-4 border items-center justify-center${
                  messageType === "success"
                    ? "bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6"
                    : "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6"
                }`}
              >
                {message}
              </div>
            </div>
              
          )}

      <Button type="submit" className="w-full bg-green-400 text-white hover:bg-green-500">
        Schedule Appointment
      </Button>
    </form>
  );
};

export default AppointmentForm;
