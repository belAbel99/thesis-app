"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ComboBox from "@/components/ComboBox";
import StudentListPrintButton from "./StudentListButton";
import { FaEnvelope } from "react-icons/fa";
import EmailForm from "@/components/EmailForm";

const CounselorList = () => {
  const [counselors, setCounselors] = useState<any[]>([]);
  const [filteredCounselors, setFilteredCounselors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [emails, setEmails] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const counselorsPerPage = 5;
  const router = useRouter();

  useEffect(() => {
    const fetchCounselors = async () => {
      try {
        const response = await fetch("/api/counselors");
        if (!response.ok) throw new Error("Failed to fetch counselors");
        const data = await response.json();
        setCounselors(data);
      } catch (err) {
        console.error("Error fetching counselors:", err);
      }
    };

    fetchCounselors();
  }, []);

  useEffect(() => {
    let filtered = counselors;

    if (filterType) {
      filtered = filtered.filter((counselor) =>
        counselor[filterType]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (counselor) =>
          counselor.name?.toLowerCase().includes(query) ||
          counselor.email?.toLowerCase().includes(query) ||
          counselor.areaOfExpertise?.toLowerCase().includes(query) ||
          counselor.program?.toLowerCase().includes(query)
      );
    }

    setFilteredCounselors(filtered);
    setEmails(filtered.map((counselor) => counselor.email).filter(Boolean));
    setCurrentPage(0);
  }, [counselors, searchQuery, filterType]);

  const startIndex = currentPage * counselorsPerPage;
  const paginatedCounselors = filteredCounselors.slice(startIndex, startIndex + counselorsPerPage);

  const handleCounselorClick = (counselorId: string) => {
    setLoadingId(counselorId);
    router.push(`/admin/counselors/${counselorId}`);
  };

  return (
    <section className="counselor-list w-full px-6">
      {/* Filters */}
      <div className="flex flex-col items-center mb-4">
        <StudentListPrintButton 
          filteredStudents={filteredCounselors} 
          filterType={filterType} 
          view="employee" 
        />
        <div className="w-96 mt-2">
          <ComboBox filterType={filterType} setFilterType={setFilterType} view="counselors" />
        </div>
        <input
          type="text"
          placeholder="Search by name, email, or expertise..."
          className="w-96 p-3 border-2 border-blue-700 rounded-xl bg-white text-black shadow-sm mt-2 focus:outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      {filteredCounselors.length === 0 ? (
        <p className="text-gray-400 text-center">No counselors found.</p>
      ) : (
        <div className="w-full overflow-x-auto rounded-lg border-2 border-blue-700">
          <table className="w-full text-white shadow-lg">
            <thead>
              <tr className="bg-blue-700 text-left text-sm uppercase">
                <th className="py-3 px-6">Name</th>
                <th className="py-3 px-6">Email</th>
                <th className="py-3 px-6">Program</th>
                <th className="py-3 px-6">Expertise</th>
                <th className="py-3 px-6">Status</th>
                {filterType && <th className="py-3 px-6">{filterType.replace(/([A-Z])/g, " $1")}</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedCounselors.map((counselor) => (
                <tr 
                  key={counselor.$id} 
                  className="bg-white text-black hover:bg-blue-400 hover:text-white transition"
                >
                  <td className="py-3 px-6">
                    <button 
                      onClick={() => handleCounselorClick(counselor.$id)} 
                      className="text-blue-700 hover:text-white"
                    >
                      {counselor.name}
                      {loadingId === counselor.$id && <span className="ml-2 animate-spin">🔄</span>}
                    </button>
                  </td>
                  <td className="py-3 px-6">{counselor.email}</td>
                  <td className="py-3 px-6">{counselor.program}</td>
                  <td className="py-3 px-6">{counselor.areaOfExpertise}</td>
                  <td className="py-3 px-6">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      counselor.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {counselor.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {filterType && <td className="py-3 px-6">{counselor[filterType] ?? "N/A"}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Email Modal */}
      {emails.length > 0 && (
        <div className="mt-4 flex justify-center">
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2"
          >
            <FaEnvelope /> Send Email to All
          </button>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
          <div className="bg-gray-800 p-6 rounded-lg shadow-md max-w-md w-full">
            <EmailForm studentEmail={emails.join(",")} />
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="mt-4 w-full bg-red-500 text-white py-2 rounded-lg"
            >
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
          onClick={() => setCurrentPage((prev) => (startIndex + counselorsPerPage < filteredCounselors.length ? prev + 1 : prev))}
          className="px-4 py-2 mx-2 bg-green-400 text-white rounded disabled:opacity-50"
          disabled={startIndex + counselorsPerPage >= filteredCounselors.length}
        >
          Next →
        </button>
      </div>
    </section>
  );
};

export default CounselorList;