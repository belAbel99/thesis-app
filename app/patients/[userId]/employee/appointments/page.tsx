"use client";

// import { useState } from "react";
import { useParams } from "next/navigation";
import { Databases, Client } from "appwrite";
import EmployeeSideBar from "@/components/EmployeeSideBar";
import AppointmentForm from "@/components/forms/AppointmentForm";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);

const databases = new Databases(client);

const EmployeeAppointmentsPage = () => {
  const params = useParams();
  const userId = params.userId as string;

  return (
    <div className="flex h-screen bg-gray-100">
      <EmployeeSideBar userId={userId} />
      
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-blue-700 mb-8">Schedule New Appointment</h1>
          <AppointmentForm userId={userId} />
        </div>
      </div>
    </div>
  );
};

export default EmployeeAppointmentsPage; 