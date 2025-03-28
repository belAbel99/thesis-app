"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import StudentList from "@/components/StudentList";
import SideBar from "@/components/SideBar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { UserRound, Calendar, BookOpenText, Stethoscope } from "lucide-react";
import { Client, Databases } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);

const databases = new Databases(client);

const AdminDashboard = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [studentsCount, setStudentsCount] = useState(0);
  const [counselorsCount, setCounselorsCount] = useState(0);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch students
        const studentsRes = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          process.env.NEXT_PUBLIC_PATIENT_COLLECTION_ID!
        );
        setStudentsCount(studentsRes.documents.length);
 

        // Fetch counselors
        const counselorsRes = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          process.env.NEXT_PUBLIC_COUNSELOR_COLLECTION_ID!
        );
        setCounselorsCount(counselorsRes.documents.length);

        // Fetch appointments
        const appointmentsRes = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          "6734ba2700064c66818e" // Appointment collection ID
        );
        setAppointmentsCount(appointmentsRes.documents.length);
        
        // Get upcoming appointments (next 7 days)
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const upcoming = appointmentsRes.documents.filter((appt: any) => {
          const apptDate = new Date(appt.date);
          return apptDate >= today && apptDate <= nextWeek;
        }).slice(0, 3); // Only show 3 upcoming
        
        setUpcomingAppointments(upcoming);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <SideBar />
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-blue-700">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage counseling system and student well-being</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Students</p>
                  <p className="text-2xl font-bold mt-1 text-indigo-600">{studentsCount}</p>
                </div>
                <div className="p-3 rounded-lg bg-indigo-50">
                  <UserRound className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Counselors</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{counselorsCount}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <Stethoscope className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Appointments</p>
                  <p className="text-2xl font-bold mt-1 text-purple-600">{appointmentsCount}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end mb-6 space-x-4">
            <Button
              onClick={() => router.push("/admin/counselors/register")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Create Counselor
            </Button>
            <Button
              onClick={() => router.push("/admin/counselors/login")}
              variant="outline"
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              Counselor Login
            </Button>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                Upcoming Appointments (Next 7 Days)
              </h2>
              <Button 
                variant="outline"
                className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                onClick={() => router.push("/admin/appointments")}
              >
                View All
              </Button>
            </div>

            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.$id} className="border-b border-gray-100 last:border-0 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{appointment.patientName}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        appointment.concernType === 'Academic' ? 'bg-blue-100 text-blue-800' :
                        appointment.concernType === 'Career' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {appointment.concernType || 'General'}
                      </span>
                    </div>
                    {appointment.sessionNotes && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{appointment.sessionNotes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No upcoming appointments</p>
              </div>
            )}
          </div>

          {/* Student List */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <UserRound className="w-5 h-5 mr-2 text-indigo-600" />
              Recent Students
            </h2>
            <StudentList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;