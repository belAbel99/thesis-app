"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Databases, Client } from "appwrite";
import { Button } from "@/components/ui/button";
import StudentSideBar from "@/components/StudentSideBar";
import { UserRound, Calendar, BookOpenText, Stethoscope, ClipboardList } from "lucide-react";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);

const databases = new Databases(client);

const StudentPage = () => {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [student, setStudent] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [counselor, setCounselor] = useState<any>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const data = await databases.getDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          process.env.NEXT_PUBLIC_PATIENT_COLLECTION_ID!,
          userId
        );
        setStudent(data);

        // Fetch counselor details if counselorId is set
        if (data.counselorId) {
          const counselorData = await databases.getDocument(
            process.env.NEXT_PUBLIC_DATABASE_ID!,
            process.env.NEXT_PUBLIC_COUNSELOR_COLLECTION_ID!,
            data.counselorId
          );
          setCounselor(counselorData);
        }
      } catch (error) {
        console.error("Error fetching student:", error);
      }
    };

    const fetchAppointments = async () => {
      try {
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          "6734ba2700064c66818e" // Replace with your appointment collection ID
        );
        const userAppointments = response.documents.filter(
          (doc: any) => doc.userid === userId
        );
        setAppointments(userAppointments);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };

    fetchStudent();
    fetchAppointments();
  }, [userId]);

  if (!student) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <StudentSideBar userId={userId} />
      
      <div className="flex-1 p-6">
        {/* Header with Profile */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
            <p className="text-gray-600">Overview of your counseling information</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <UserRound className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <p className="font-medium text-gray-800">{student.name}</p>
              <p className="text-xs text-gray-500">{student.program}</p>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Upcoming Appointments</p>
                <p className="text-2xl font-bold mt-1 text-indigo-600">
                  {appointments.filter(a => a.status === "Scheduled").length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-indigo-50">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Sessions</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {appointments.filter(a => a.status === "Completed").length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <ClipboardList className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Assigned Counselor</p>
                <p className="text-lg font-semibold mt-1 text-gray-800">
                  {counselor ? counselor.name : "Not assigned"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Stethoscope className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <UserRound className="w-5 h-5 mr-2 text-indigo-600" />
              Student Information
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Program</p>
                <p className="text-gray-800">{student.program}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Year Level</p>
                <p className="text-gray-800">{student.yearLevel}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Student ID</p>
                <p className="text-gray-800">{student.idNumber || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <BookOpenText className="w-5 h-5 mr-2 text-indigo-600" />
                Recent Counseling Sessions
              </h2>
              <Button 
                variant="outline"
                className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                onClick={() => router.push(`/patients/${userId}/student/myAppointments`)}
              >
                View All
              </Button>
            </div>

            {appointments
              .filter((appointment) => appointment.status === "Completed")
              .slice(0, 3)
              .map((appointment) => (
                <div key={appointment.$id} className="border-b border-gray-100 last:border-0 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{new Date(appointment.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">{appointment.time}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      appointment.concernType === 'Academic' ? 'bg-blue-100 text-blue-800' :
                      appointment.concernType === 'Career' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {appointment.concernType || 'General'}
                    </span>
                  </div>
                  {appointment.counselorNotes && (
                    <p className="mt-2 text-gray-600 line-clamp-2">{appointment.counselorNotes}</p>
                  )}
                </div>
              ))}
            
            {appointments.filter(a => a.status === "Completed").length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>No completed sessions yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Counselor Section */}
        {counselor && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Counselor</h2>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <UserRound className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">{counselor.name}</h3>
                <p className="text-sm text-gray-500">{counselor.email}</p>
                <p className="text-sm text-gray-500 mt-1">{counselor.phone}</p>
                <Button 
                  variant="outline"
                  size="sm"
                  className="mt-3 text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                  onClick={() => router.push(`/patients/${userId}/student/calendar`)}
                >
                  Schedule Appointment
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPage;