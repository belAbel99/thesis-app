"use client";

import { useEffect, useState } from "react";
import SideBar from "@/components/SideBar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { UserRound, Calendar, BookOpenText, Stethoscope, CheckCircle, XCircle, Clock } from "lucide-react";
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
  const [completedAppointments, setCompletedAppointments] = useState(0);
  const [cancelledAppointments, setCancelledAppointments] = useState(0);
  const [scheduledAppointments, setScheduledAppointments] = useState(0);
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
        
        const allAppointments = appointmentsRes.documents;
        setAppointmentsCount(allAppointments.length);
        
        // Count appointments by status
        const completed = allAppointments.filter((appt: any) => appt.status === "Completed").length;
        const cancelled = allAppointments.filter((appt: any) => appt.status === "Cancelled").length;
        const scheduled = allAppointments.filter((appt: any) => appt.status === "Scheduled").length;
        
        setCompletedAppointments(completed);
        setCancelledAppointments(cancelled);
        setScheduledAppointments(scheduled);
        
        // Get upcoming appointments (next 7 days)
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const upcoming = allAppointments.filter((appt: any) => {
          const apptDate = new Date(appt.date);
          return appt.status === "Scheduled" && apptDate >= today && apptDate <= nextWeek;
        }).slice(0, 3); // Only show 3 upcoming
        
        setUpcomingAppointments(upcoming);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  // Calculate completion rate (completed vs cancelled)
  const completionRate = cancelledAppointments > 0 
    ? Math.round((completedAppointments / (completedAppointments + cancelledAppointments)) * 100)
    : completedAppointments > 0 ? 100 : 0;

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Students Card */}
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

            {/* Active Counselors Card */}
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

            {/* Total Appointments Card */}
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

            {/* Completion Rate Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{completionRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {completedAppointments} completed / {cancelledAppointments} cancelled
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Second Row of Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Completed Appointments Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{completedAppointments}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Cancelled Appointments Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Cancelled</p>
                  <p className="text-2xl font-bold mt-1 text-red-600">{cancelledAppointments}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-50">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            {/* Scheduled Appointments Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Scheduled</p>
                  <p className="text-2xl font-bold mt-1 text-yellow-600">{scheduledAppointments}</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-50">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Rest of your existing content... */}
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
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;