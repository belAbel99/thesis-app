"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ComboBox from "@/components/ComboBox";
import StudentListPrintButton from "./StudentListButton";
import { FaEnvelope } from "react-icons/fa";
import EmailForm from "@/components/EmailForm";

const StudentList = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [emails, setEmails] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const studentsPerPage = 5;
  const router = useRouter();

  // Fetch students when the component mounts
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch("/api/students/");
        if (!res.ok) throw new Error("Failed to fetch students");

        const data = await res.json();
        setStudents(data);
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };

    fetchStudents();
  }, []);

  // Filter students whenever dependencies change
  useEffect(() => {
    let filtered = students;

    if (filterType) {
      filtered = filtered.filter((student) =>
        student[filterType]?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.name?.toLowerCase().includes(query) ||
          student.idNumber?.toLowerCase().includes(query) ||
          student.program?.toLowerCase().includes(query) ||
          student.yearLevel?.toLowerCase().includes(query)
      );
    }

    setFilteredStudents(filtered);
    setEmails(filtered.map((student) => student.email));
    setCurrentPage(0);
  }, [students, searchQuery, filterType]);

  const startIndex = currentPage * studentsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + studentsPerPage);

  const handleStudentClick = (studentId: string) => {
    setLoadingId(studentId);
    router.push(`/patients/${studentId}/studentDetailAdmin`);
  };

  return (
    <section className="student-list w-full px-6">
      <h2 className="text-2xl font-semibold mb-4 text-blue-700 text-center">Student List</h2>

      {/* Filters */}
      <div className="flex flex-col items-center mb-4">
        <StudentListPrintButton filteredStudents={filteredStudents} filterType={filterType} view="student" />
        <div className="w-96 mt-2">
          <ComboBox filterType={filterType} setFilterType={setFilterType} view="students" />
        </div>
        <input
          type="text"
          placeholder="Search..."
          className="w-96 p-3 border-2 border-blue-700 rounded-xl bg-white text-black shadow-sm mt-2 focus:outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      {filteredStudents.length === 0 ? (
        <p className="text-gray-400 text-center">No students found.</p>
      ) : (
        <div className="w-full overflow-x-auto rounded-lg border-2 border-blue-700">
          <table className="w-full text-white shadow-lg">
            <thead>
              <tr className="bg-blue-700 text-left text-sm uppercase">
                <th className="py-3 px-6">Name</th>
                <th className="py-3 px-6">ID Number</th>
                <th className="py-3 px-6">Program</th>
                <th className="py-3 px-6">Year Level</th>
                {filterType && <th className="py-3 px-6">{filterType.replace(/([A-Z])/g, " $1")}</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((student) => (
                <tr key={student.$id} className="bg-white text-black hover:bg-blue-400 hover:text-white transition">
                  <td className="py-3 px-6">
                    <button onClick={() => handleStudentClick(student.$id)} className="text-blue-700 hover:text-white">
                      {student.name}
                      {loadingId === student.$id && <span className="ml-2 animate-spin">🔄</span>}
                    </button>
                  </td>
                  <td className="py-3 px-6">{student.idNumber}</td>
                  <td className="py-3 px-6">{student.program}</td>
                  <td className="py-3 px-6">{student.yearLevel}</td>
                  {filterType && <td className="py-3 px-6">{student[filterType] ?? "N/A"}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Email Modal */}
      {emails.length > 0 && (
        <div className="mt-4 flex justify-center">
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2">
            <FaEnvelope /> Send Email to All
          </button>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
          <div className="bg-gray-800 p-6 rounded-lg shadow-md max-w-md w-full">
            <EmailForm studentEmail={emails.join(",")} />
            <button onClick={() => setIsModalOpen(false)} className="mt-4 w-full bg-red-500 text-white py-2 rounded-lg">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
          className="px-4 py-2 mx-2 bg-gray-700 text-white rounded disabled:opacity-50"
          disabled={currentPage === 0}
        >
          ← Prev
        </button>
        <button
          onClick={() => setCurrentPage((prev) => (startIndex + studentsPerPage < filteredStudents.length ? prev + 1 : prev))}
          className="px-4 py-2 mx-2 bg-green-400 text-white rounded disabled:opacity-50"
          disabled={startIndex + studentsPerPage >= filteredStudents.length}
        >
          Next →
        </button>
      </div>
    </section>
  );
};

export default StudentList;