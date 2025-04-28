"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Databases, Client } from "appwrite";
import { notFound } from "next/navigation";
import BackToStudentButton from "@/components/BackToStudentButton";
import PrintButton from "@/components/PrintButton";
import { ChevronDown, ChevronUp, Calendar, Check, X } from "lucide-react";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);

const databases = new Databases(client);

const StudentDetail = () => {
  const params = useParams();
  const userId = params.userId as string;

  const [student, setStudent] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string[]>(['personal', 'emergency', 'identification', 'academic', 'medical', 'consent', 'appointments']);

  const fetchStudent = async () => {
    try {
      const data = await databases.getDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PATIENT_COLLECTION_ID!,
        userId
      );
      setStudent(data);
    } catch (error) {
      console.error("Error fetching student details:", error);
      notFound();
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        "6734ba2700064c66818e" // Appointment collection ID
      );
      const userAppointments = response.documents.filter(
        (doc: any) => doc.userid === userId
      );
      setAppointments(userAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  useEffect(() => {
    fetchStudent();
    fetchAppointments();
  }, [userId]);

  const toggleSection = (section: string) => {
    setActiveSection(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const renderConsentValue = (value: boolean) => (
    <div className="flex items-center gap-2">
      {value ? (
        <Check className="text-green-500" />
      ) : (
        <X className="text-red-500" />
      )}
      <span>{value ? "Yes" : "No"}</span>
    </div>
  );

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
      <BackToStudentButton userId={userId} />
      <PrintButton 
          student={student} 
          variant="outline" 
          className="border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white"
        >
          Print
        </PrintButton>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-black">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">{student?.name}'s Profile</h1>
          <p className="text-gray-600">Student ID: {student?.idNumber}</p>
          <p className="text-gray-600">College: {student?.program}</p>
        </div>

        {/* Personal Information Section */}
        <div className="border-b border-gray-200 last:border-b-0">
          <button
            onClick={() => toggleSection('personal')}
            className="w-full flex justify-between items-center p-4 hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold text-gray-800">Personal Information</h2>
            {activeSection.includes('personal') ? (
              <ChevronUp className="text-gray-500" />
            ) : (
              <ChevronDown className="text-gray-500" />
            )}
          </button>
          
          {activeSection.includes('personal') && (
            <div className="p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Email", value: student?.email || "N/A" },
                  { label: "Phone", value: student?.phone || "N/A" },
                  { label: "Gender", value: student?.gender || "N/A" },
                  { label: "Birth Date", value: student?.birthDate || "N/A" },
                  { label: "Age", value: student?.age || "N/A" },
                  { label: "Suffix", value: student?.suffix || "N/A" },
                  { label: "Civil Status", value: student?.civilStatus || "N/A" },
                  { label: "Address", value: student?.address || "N/A" },
                ].map(({ label, value }) => (
                  <div key={label} className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    <div className="p-2 border border-gray-300 rounded-md">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Emergency Contact Section */}
        <div className="border-b border-gray-200 last:border-b-0">
          <button
            onClick={() => toggleSection('emergency')}
            className="w-full flex justify-between items-center p-4 hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold text-gray-800">Emergency Contact</h2>
            {activeSection.includes('emergency') ? (
              <ChevronUp className="text-gray-500" />
            ) : (
              <ChevronDown className="text-gray-500" />
            )}
          </button>
          
          {activeSection.includes('emergency') && (
            <div className="p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Emergency Contact Name", value: student?.emergencyContactName || "N/A" },
                  { label: "Emergency Contact Number", value: student?.emergencyContactNumber || "N/A" },
                ].map(({ label, value }) => (
                  <div key={label} className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    <div className="p-2 border border-gray-300 rounded-md">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Identification Section */}
        <div className="border-b border-gray-200 last:border-b-0">
          <button
            onClick={() => toggleSection('identification')}
            className="w-full flex justify-between items-center p-4 hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold text-gray-800">Identification</h2>
            {activeSection.includes('identification') ? (
              <ChevronUp className="text-gray-500" />
            ) : (
              <ChevronDown className="text-gray-500" />
            )}
          </button>
          
          {activeSection.includes('identification') && (
            <div className="p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Identification Type", value: student?.identificationType || "N/A" },
                  { label: "Identification Number", value: student?.identificationNumber || "N/A" },
                  { label: "ID Number", value: student?.idNumber || "N/A" },
                ].map(({ label, value }) => (
                  <div key={label} className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    <div className="p-2 border border-gray-300 rounded-md">
                      {value}
                    </div>
                  </div>
                ))}
                {student?.identificationDocumentUrl && (
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Identification Document</label>
                    <a
                      href={student.identificationDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                    >
                      View Document
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Academic Information Section */}
        <div className="border-b border-gray-200 last:border-b-0">
          <button
            onClick={() => toggleSection('academic')}
            className="w-full flex justify-between items-center p-4 hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold text-gray-800">Academic Information</h2>
            {activeSection.includes('academic') ? (
              <ChevronUp className="text-gray-500" />
            ) : (
              <ChevronDown className="text-gray-500" />
            )}
          </button>
          
          {activeSection.includes('academic') && (
            <div className="p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Program", value: student?.program || "N/A" },
                  { label: "Year Level", value: student?.yearLevel || "N/A" },
                  { label: "Academic Performance", value: student?.academicPerformance || "N/A" },
                  { label: "Scholarship", value: student?.scholarship || "N/A" },
                ].map(({ label, value }) => (
                  <div key={label} className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    <div className="p-2 border border-gray-300 rounded-md">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Medical Information Section */}
        <div className="border-b border-gray-200 last:border-b-0">
          <button
            onClick={() => toggleSection('medical')}
            className="w-full flex justify-between items-center p-4 hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold text-gray-800">Medical Information</h2>
            {activeSection.includes('medical') ? (
              <ChevronUp className="text-gray-500" />
            ) : (
              <ChevronDown className="text-gray-500" />
            )}
          </button>
          
          {activeSection.includes('medical') && (
            <div className="p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Counseling Preference", value: student?.counselingPreferences || "N/A" },
                  { label: "Mental Health History", value: student?.mentalHealthHistory || "N/A" },
                  { label: "Consent to Treatment", value: renderConsentValue(student?.treatmentConsent) },
                ].map(({ label, value }) => (
                  <div key={label} className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    <div className="p-2 border border-gray-300 rounded-md">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Consent Section */}
        <div className="border-b border-gray-200 last:border-b-0">
          <button
            onClick={() => toggleSection('consent')}
            className="w-full flex justify-between items-center p-4 hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold text-gray-800">Consent & Agreements</h2>
            {activeSection.includes('consent') ? (
              <ChevronUp className="text-gray-500" />
            ) : (
              <ChevronDown className="text-gray-500" />
            )}
          </button>
          
          {activeSection.includes('consent') && (
            <div className="p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Privacy Consent", value: renderConsentValue(student?.privacyConsent) },
                  { label: "Disclosure Consent", value: renderConsentValue(student?.disclosureConsent) },
                ].map(({ label, value }) => (
                  <div key={label} className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    <div className="p-2 border border-gray-300 rounded-md">
                      {value}
                    </div>
                  </div>
                ))}
                {student?.signatureDate && (
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Consent Signed On</label>
                    <div className="p-2 border border-gray-300 rounded-md">
                      {new Date(student.signatureDate).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Appointments Section */}
        <div className="border-b border-gray-200 last:border-b-0">
          <button
            onClick={() => toggleSection('appointments')}
            className="w-full flex justify-between items-center p-4 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Calendar className="text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-800">Appointments</h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {appointments.length}
              </span>
            </div>
            {activeSection.includes('appointments') ? (
              <ChevronUp className="text-gray-500" />
            ) : (
              <ChevronDown className="text-gray-500" />
            )}
          </button>
          
          {activeSection.includes('appointments') && (
            <div className="p-6 pt-0">
              {appointments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No appointments found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session Notes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Follow Up</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {appointments.map((appointment) => (
                        <tr key={appointment.$id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {appointment.date && new Date(appointment.date).toLocaleDateString()}
                            {appointment.time && ` at ${appointment.time}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              appointment.status === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : appointment.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {appointment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{appointment.reason || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{appointment.sessionNotes || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {appointment.followUpRequired ? (
                              <Check className="text-green-500" />
                            ) : (
                              <X className="text-red-500" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;