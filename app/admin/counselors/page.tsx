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
import { Search } from "lucide-react";

const CounselorDashboardPage = () => {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch session and students assigned to the counselor
  useEffect(() => {
    const fetchSessionAndStudents = async () => {
      const token = Cookies.get("counselorToken");

      if (!token) {
        console.error("No token found in cookies.");
        router.push("/admin/counselors/login");
        return;
      }

      try {
        // Decode the JWT token to extract the sessionId
        const { sessionId } = decodeJwt(token) as { sessionId: string };

        if (!sessionId) {
          console.error("No session ID found in the token.");
          router.push("/admin/counselors/login");
          return;
        }

        // Fetch the counselor session
        const user = await getCounselorSession(sessionId);

        if (!user) {
          console.error("No user found for the session.");
          router.push("/admin/counselors/login");
          return;
        }

        // Fetch students assigned to the counselor based on their program
      // Fetch students assigned to the counselor based on their program
      const students = await getStudentsByCounselorId(user.counselorId, user.program, 10, 0); // Example: limit = 10, offset = 0
      setStudents(students);

      } catch (error) {
        console.error("Error decoding token or fetching students:", error);
        router.push("/admin/counselors/login");
      }
    };

    fetchSessionAndStudents();
  }, [router]);

  // Handle logout
  const handleLogout = async () => {
    const response = await logoutCounselor();
    if (response.success) {
      router.push("/admin/counselors/login");
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.yearLevel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <CounselorSideBar />

      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold text-blue-700 mb-6">Counselor Dashboard</h1>
            <p className="text-gray-700">Welcome to your dashboard!</p>

            {/* Search Bar */}
            <div className="mt-6">
              <div className="relative flex-1 max-w-xl mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students..."
                  className="pl-10 pr-4 py-2 w-full bg-white border-2 border-blue-700 text-black focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-blue-700 mb-4">Students Assigned to You</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-700 text-white">
                      <th className="px-6 py-3 text-left">Name</th>
                      <th className="px-6 py-3 text-left">Program</th>
                      <th className="px-6 py-3 text-left">Year Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                          No students found.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr key={student.$id} className="hover:bg-gray-100">
                          <td className="px-6 py-4 text-black">{student.name}</td>
                          <td className="px-6 py-4 text-black">{student.program}</td>
                          <td className="px-6 py-4 text-black">{student.yearLevel}</td>
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