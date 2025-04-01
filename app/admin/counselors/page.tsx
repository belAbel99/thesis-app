"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCounselorSession, getStudentsByCounselorId } from "@/lib/actions/counselor.actions";
import Cookies from "js-cookie";
import { decodeJwt } from "jose";
import { logoutCounselor } from "@/lib/actions/counselor.actions";
import CounselorSideBar from "@/components/CounselorSideBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, UserRound, Stethoscope, CheckCircle } from "lucide-react";
import { Client, Databases, Query } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);

const databases = new Databases(client);

const CounselorDashboardPage = () => {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    students: 0,
    upcomingAppointments: 0,
    completedAppointments: 0
  });
  const [counselorProgram, setCounselorProgram] = useState("");

  // Fetch session and data assigned to the counselor
  useEffect(() => {
    const fetchSessionAndData = async () => {
      const token = Cookies.get("counselorToken");

      if (!token) {
        console.error("No token found in cookies.");
        router.push("/admin/counselors/login");
        return;
      }

      try {
        // Get counselor session and program
        const { sessionId } = decodeJwt(token) as { sessionId: string };
        const session = await getCounselorSession(sessionId);

        if (!session) {
          console.error("No session found.");
          router.push("/admin/counselors/login");
          return;
        }

        setCounselorProgram(session.program);

        // Fetch students ONLY for the counselor's program
        const students = await getStudentsByCounselorId(session.counselorId, session.program, 10, 0);
        setStudents(students);

        // Fetch appointment counts ONLY for the counselor's program
        const [upcomingRes, completedRes] = await Promise.all([
          databases.listDocuments(
            process.env.NEXT_PUBLIC_DATABASE_ID!,
            "6734ba2700064c66818e",
            [
              Query.equal("program", [session.program]),
              Query.equal("status", ["Scheduled"]),
              Query.limit(1000) // Adjust based on your needs
            ]
          ),
          databases.listDocuments(
            process.env.NEXT_PUBLIC_DATABASE_ID!,
            "6734ba2700064c66818e",
            [
              Query.equal("program", [session.program]),
              Query.equal("status", ["Completed"]),
              Query.limit(1000) // Adjust based on your needs
            ]
          )
        ]);

        setStats({
          students: students.length,
          upcomingAppointments: upcomingRes.documents.length,
          completedAppointments: completedRes.documents.length
        });

      } catch (error) {
        console.error("Error fetching data:", error);
        router.push("/admin/counselors/login");
      }
    };

    fetchSessionAndData();
  }, [router]);

  // Filter students based on search term
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.yearLevel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <CounselorSideBar />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-blue-700">Counselor Dashboard</h1>
            <p className="text-gray-600 mt-2">Program: {counselorProgram}</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Assigned Students</p>
                  <p className="text-2xl font-bold mt-1 text-indigo-600">{stats.students}</p>
                </div>
                <div className="p-3 rounded-lg bg-indigo-50">
                  <UserRound className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Upcoming Appointments</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{stats.upcomingAppointments}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed Sessions</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{stats.completedAppointments}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Students Section */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-blue-700">Your Assigned Students</h2>
                <div className="relative flex-1 max-w-md ml-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search students..."
                    className="pl-10 pr-4 py-2 w-full"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year Level</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                          No students found.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr key={student.$id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">{student.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">{student.program}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">{student.yearLevel}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounselorDashboardPage;