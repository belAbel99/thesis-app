"use client";

import { useEffect, useState } from "react";
import { Client, Databases } from "appwrite";
import { useParams } from "next/navigation";
import StudentSideBar from "@/components/StudentSideBar";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProfileBadge } from "@/components/ProfileBadge";

interface Appointment {
  $id: string;
  patientName: string;
  date: string;
  time: string;
  reason: string;
  status: "Scheduled" | "Completed" | "Cancelled";
  userid: string;
  program: string;
  concernType: "Academic" | "Career" | "Personal" | "Crisis";
  followUpRequired: boolean;
  sessionNotes: string;
  counselorNotes?: string;
  duration: number;
  cancellationReason?: string;
  diagnosis?: string;
}

const StudentAppointmentsPage = () => {
  const params = useParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedAppointments, setExpandedAppointments] = useState<Set<string>>(new Set());

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);
  
  const databases = new Databases(client);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e"
      );
      const userAppointments = response.documents
        .filter((doc: any) => doc.userid === params.userId)
        .map((doc: any) => ({
          ...doc,
          sessionNotes: doc.sessionNotes || doc.reason || '',
          concernType: doc.concernType || 'Academic',
          duration: doc.duration || 30,
          followUpRequired: doc.followUpRequired || false
        }));
      setAppointments(userAppointments as Appointment[]);
      setFilteredAppointments(userAppointments as Appointment[]);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  useEffect(() => {
    const filtered = appointments.filter(appointment =>
      appointment.sessionNotes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.date.includes(searchTerm) ||
      appointment.concernType.toLowerCase().includes(searchTerm.toLowerCase()
    ));
      
    setFilteredAppointments(filtered);
  }, [searchTerm, appointments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-100 text-blue-700";
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getConcernColor = (concernType: string) => {
    switch (concernType) {
      case "Academic": return "bg-blue-100 text-blue-700";
      case "Career": return "bg-purple-100 text-purple-700";
      case "Personal": return "bg-green-100 text-green-700";
      case "Crisis": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const toggleAppointmentExpansion = (id: string) => {
    const newSet = new Set(expandedAppointments);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedAppointments(newSet);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <StudentSideBar userId={params.userId as string} />
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-blue-700">My Appointments</h1>
            <p className="text-gray-600 mt-2">View and manage all your counseling appointments</p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by notes, date, or concern type..."
                  className="pl-10 pr-4 py-2 w-full"
                />
              </div>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 text-black">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concern</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <>
                      <tr 
                        key={appointment.$id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleAppointmentExpansion(appointment.$id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-dark">
                          {new Date(appointment.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-dark">{appointment.time}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{appointment.duration} mins</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${getConcernColor(appointment.concernType)}`}>
                            {appointment.concernType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                          {appointment.followUpRequired && (
                            <span className="ml-2 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                              Follow-up
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            className="text-indigo-600 hover:text-indigo-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAppointmentExpansion(appointment.$id);
                            }}
                          >
                            {expandedAppointments.has(appointment.$id) ? 'Hide' : 'View'} details
                          </button>
                        </td>
                      </tr>
                      {expandedAppointments.has(appointment.$id) && (
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Session Notes</h4>
                                <p className="mt-1 text-sm text-gray-800">{appointment.sessionNotes}</p>
                              </div>
                              {appointment.status === "Completed" && appointment.counselorNotes && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">Counselor Notes</h4>
                                  <p className="mt-1 text-sm text-gray-800">{appointment.counselorNotes}</p>
                                </div>
                              )}
                              {appointment.status === "Cancelled" && appointment.cancellationReason && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500">Cancellation Reason</h4>
                                  <p className="mt-1 text-sm text-gray-800">{appointment.cancellationReason}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
              {filteredAppointments.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>No appointments found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAppointmentsPage;