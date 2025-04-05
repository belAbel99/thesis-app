"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Databases, Client, Storage } from "appwrite";
import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import EditableField from "@/components/EditableField";
import EmailForm from "@/components/EmailForm";
import PrintButton from "@/components/PrintButton";
import { ChevronDown, ChevronUp } from "lucide-react"; // Icons for expand/collapse
import { Button } from "@/components/ui/button"; // Import the Button component

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!)
  //.setKey(process.env.API_KEY!); // Ensure the API key is set

const databases = new Databases(client);
const storage = new Storage(client);

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
        "67b96b0800349392bb1c" // Replace with your appointment collection ID
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

  if (loading) return <div className="text-white text-center">Loading...</div>;

  const handleUpdate = (fieldName: string, newValue: string) => {
    setStudent((prev: any) => ({
      ...prev,
      [fieldName]: newValue,
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 bg-gray-900 text-white">
      <BackButton />
      <PrintButton student={student} />
      <h1 className="text-3xl font-semibold">{student.name}'s Details</h1>

      {/* Personal Information */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold">Personal Information</h2>
        <hr className="border-gray-700 my-3" />
        <table className="w-full border-collapse">
          <tbody>
            {[
              ["Email", "email"],
              ["Phone", "phone"],
              ["Gender", "gender"],
              ["Birth Date", "birthDate"],
              ["Age", "age"],
              ["Suffix", "suffix"],
              ["Civil Status", "civilStatus"],
              ["Person with Disability", "personWithDisability"],
              ["Address", "address"],
              ["Emergency Contact Name", "emergencyContactName"],
              ["Emergency Contact Number", "emergencyContactNumber"],
            ].map(([label, field]) => (
              <tr key={field} className="border-b border-gray-700 last:border-none">
                <td className="p-3 font-medium w-1/3">{label}</td>
                <td className="p-3">
                  <EditableField
                    label={label}
                    value={student[field]}
                    userId={userId}
                    fieldName={field}
                    onUpdate={handleUpdate}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Identification */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold">Identification</h2>
        <hr className="border-gray-700 my-3" />
        <table className="w-full border-collapse">
          <tbody>
            {[
              ["Identification Type", "identificationType"],
              ["Identification Number", "identificationNumber"],
              ["School ID Number", "idNumber"],
            ].map(([label, field]) => (
              <tr key={field} className="border-b border-gray-700 last:border-none">
                <td className="p-3 font-medium w-1/3">{label}</td>
                <td className="p-3">
                  <EditableField
                    label={label}
                    value={student[field]}
                    userId={userId}
                    fieldName={field}
                    onUpdate={handleUpdate}
                  />
                </td>
              </tr>
            ))}
            <tr className="border-b border-gray-700 last:border-none">
              <td className="p-3 font-medium w-1/3">Identification Document</td>
              <td className="p-3">
                <a href={student.identificationDocumentUrl} target="_blank" className="text-blue-400">
                  View Document
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Health Information */}

      <EmailForm studentEmail={student.email} />
    </div>
  );
};

export default StudentDetail;