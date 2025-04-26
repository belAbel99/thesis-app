"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ComboBox from "@/components/ComboBox";
import StudentListPrintButton from "./StudentListButton";
import { FiMail, FiEye, FiMoreVertical } from "react-icons/fi";
import EmailForm from "@/components/EmailForm";
import { SimpleDropdown, DropdownItem } from "@/components/ui/simpleDropdown";

const CounselorList = () => {
  const [counselors, setCounselors] = useState<any[]>([]);
  const [filteredCounselors, setFilteredCounselors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emailModalData, setEmailModalData] = useState<{email: string, isOpen: boolean}>({email: "", isOpen: false});
  const counselorsPerPage = 10;
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
    setCurrentPage(0);
  }, [counselors, searchQuery, filterType]);

  const startIndex = currentPage * counselorsPerPage;
  const paginatedCounselors = filteredCounselors.slice(startIndex, startIndex + counselorsPerPage);
  const totalPages = Math.ceil(filteredCounselors.length / counselorsPerPage);

  const handleCounselorClick = (counselorId: string) => {
    setLoadingId(counselorId);
    router.push(`/admin/counselors/${counselorId}`);
  };

  const handleEmailClick = (email: string) => {
    setEmailModalData({email, isOpen: true});
  };

  const emails = filteredCounselors.map((counselor) => counselor.email).filter(Boolean);

  return (
    <section className="counselor-list w-full px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Counselor Management</h2>
          <p className="text-gray-600">View and manage all counselor records</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by</label>
              <ComboBox filterType={filterType} setFilterType={setFilterType} view="counselors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search counselors..."
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <StudentListPrintButton 
                filteredStudents={filteredCounselors} 
                filterType={filterType} 
                view="employee" 
              />
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="text-sm font-medium text-blue-800">Total Counselors</h3>
            <p className="text-2xl font-bold text-blue-600">{counselors.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="text-sm font-medium text-green-800">Active</h3>
            <p className="text-2xl font-bold text-green-600">
              {counselors.filter(c => c.isActive).length}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <h3 className="text-sm font-medium text-yellow-800">Inactive</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {counselors.filter(c => !c.isActive).length}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h3 className="text-sm font-medium text-purple-800">Filtered</h3>
            <p className="text-2xl font-bold text-purple-600">{filteredCounselors.length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredCounselors.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No counselors found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">College</th>
                      <th className="px-6 py-3">Expertise</th>
                      <th className="px-6 py-3">Status</th>
                      {filterType && <th className="px-6 py-3">{filterType.replace(/([A-Z])/g, " $1")}</th>}
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedCounselors.map((counselor) => (
                      <tr key={counselor.$id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            onClick={() => handleCounselorClick(counselor.$id)} 
                            className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                          >
                            {counselor.name}
                            {loadingId === counselor.$id && (
                              <span className="ml-2 inline-block animate-spin">↻</span>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{counselor.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{counselor.program}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{counselor.areaOfExpertise}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            counselor.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {counselor.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        {filterType && <td className="px-6 py-4 whitespace-nowrap text-gray-600">{counselor[filterType] ?? "N/A"}</td>}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <SimpleDropdown
                            trigger={
                              <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700">
                                <FiMoreVertical />
                              </button>
                            }
                            align="right"
                          >
                            <DropdownItem 
                              onClick={() => handleCounselorClick(counselor.$id)}
                              icon={<FiEye className="text-gray-500" />}
                            >
                              View Details
                            </DropdownItem>
                            <DropdownItem 
                              onClick={() => handleEmailClick(counselor.email)}
                              icon={<FiMail className="text-gray-500" />}
                              disabled={!counselor.email}
                            >
                              Send Email
                            </DropdownItem>
                          </SimpleDropdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(startIndex + counselorsPerPage, filteredCounselors.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredCounselors.length}</span> results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                    disabled={currentPage === 0}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => (prev + 1 < totalPages ? prev + 1 : prev))}
                    disabled={currentPage >= totalPages - 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bulk Email Button */}
        {emails.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition"
            >
              <FiMail /> Send Email to All
            </button>
          </div>
        )}
      </div>

      {/* Bulk Email Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <EmailForm 
            studentEmail={emails.join(",")} 
            onClose={() => setIsModalOpen(false)}
          />
        </div>
      )}

      {/* Single Email Modal */}
      {emailModalData.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <EmailForm 
            studentEmail={emailModalData.email} 
            onClose={() => setEmailModalData({email: "", isOpen: false})}
            isSingleEmail={true}
          />
        </div>
      )}
    </section>
  );
};

export default CounselorList;