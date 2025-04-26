"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Databases, Client } from "appwrite";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import BackToStudentButton from "@/components/BackToStudentButton";
import { Check, X, Calendar } from "lucide-react";

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

  if (loading) return <div className="text-black text-center">Loading...</div>;

  const renderConsentValue = (value: boolean) => (
    <span className="flex items-center gap-1">
      {value ? (
        <>
          <Check className="text-green-600" /> Yes
        </>
      ) : (
        <>
          <X className="text-red-600" /> No
        </>
      )}
    </span>
  );

  const sections = [
    {
      title: "Personal Information",
      data: [
        ["Email", student.email],
        ["Phone", student.phone],
        ["Gender", student.gender],
        ["Birth Date", student.birthDate],
        ["Age", student.age],
        ["Suffix", student.suffix],
        ["Civil Status", student.civilStatus],
        ["Address", student.address],
        ["ID Number", student.idNumber],
        ["College", student.program],
        ["Year Level", student.yearLevel],
        ["Scholarship", student.scholarship || "N/A"],
      ],
    },
    {
      title: "Emergency Contact",
      data: [
        ["Emergency Contact Name", student.emergencyContactName],
        ["Emergency Contact Number", student.emergencyContactNumber],
      ],
    },
    {
      title: "Identification",
      data: [
        ["Identification Type", student.identificationType],
        ["Identification Number", student.identificationNumber],
        [
          "Identification Document",
          student.identificationDocumentUrl ? (
            <a
              key="identification-document"
              href={student.identificationDocumentUrl}
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              View Document
            </a>
          ) : (
            "N/A"
          ),
        ],
      ],
    },
    {
      title: "Academic Information",
      data: [
        ["Program", student.program],
        ["Year Level", student.yearLevel],
        ["Academic Performance", student.academicPerformance],
        ["Scholarship", student.scholarship],
      ],
    },
    {
      title: "Medical Information",
      data: [
        ["Counseling Preference", student.counselingPreferences],
        ["Mental Health History", student.mentalHealthHistory],
        ["Consent to Treatment", renderConsentValue(student.treatmentConsent)],
      ],
    },
    {
      title: "Consent & Agreements",
      data: [
        ["Privacy Consent", renderConsentValue(student.privacyConsent)],
        ["Disclosure Consent", renderConsentValue(student.disclosureConsent)],
        [
          "Consent Signed On",
          student.signatureDate
            ? new Date(student.signatureDate).toLocaleDateString()
            : "N/A",
        ],
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 bg-white text-black">
      <div className="flex justify-between items-center">
        <BackToStudentButton userId={userId} />
        <PrintButton student={student} />
      </div>

      <h1 className="text-3xl font-semibold text-black">{student.name}s Details</h1>

      {/* Student Information Sections */}
      {sections.map((section, index) => (
        <div
          key={index}
          className="bg-gray-50 p-6 rounded-lg shadow-md border-2 border-blue-700"
        >
          <h2 className="text-xl font-semibold mb-4 text-blue-700">
            {section.title}
          </h2>
          <table className="w-full border-collapse border border-gray-700">
            <tbody>
              {section.data.map(([label, value], i) => (
                <tr key={i} className="border border-gray-700">
                  <td className="p-2 font-bold w-1/2 bg-blue-100">{label}</td>
                  <td className="p-2">{value || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Appointments Section */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-md border-2 border-blue-700">
        <h2 className="text-xl font-semibold mb-4 text-blue-700 flex items-center gap-2">
          <Calendar className="text-blue-700" />
          Appointments ({appointments.length})
        </h2>
        {appointments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No appointments found</p>
        ) : (
          <table className="w-full border-collapse border border-gray-700">
            <thead>
              <tr className="bg-blue-100">
                <th className="p-2 font-bold border border-gray-700">Date</th>
                <th className="p-2 font-bold border border-gray-700">Status</th>
                <th className="p-2 font-bold border border-gray-700">Reason</th>
                <th className="p-2 font-bold border border-gray-700">Follow Up</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.$id} className="border border-gray-700">
                  <td className="p-2 border border-gray-700">
                    {appointment.date && new Date(appointment.date).toLocaleDateString()}
                    {appointment.time && ` at ${appointment.time}`}
                  </td>
                  <td className="p-2 border border-gray-700">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        appointment.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : appointment.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </td>
                  <td className="p-2 border border-gray-700">
                    {appointment.reason || "N/A"}
                  </td>
                  <td className="p-2 border border-gray-700 text-center">
                    {appointment.followUpRequired ? (
                      <Check className="text-green-600 mx-auto" />
                    ) : (
                      <X className="text-red-600 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentDetail;