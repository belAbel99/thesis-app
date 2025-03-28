"use client";

import { useState, useEffect } from "react";
import { Client, Databases, ID } from "appwrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash, Edit, CheckCircle, XCircle } from "lucide-react";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);

const databases = new Databases(client);

interface Counselor {
  $id: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  areaOfExpertise: string;
  role: string;
  isActive: boolean;
}

const CounselorList = () => {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updatedName, setUpdatedName] = useState("");
  const [updatedPhone, setUpdatedPhone] = useState("");
  const [updatedProgram, setUpdatedProgram] = useState("");
  const [updatedAreaOfExpertise, setUpdatedAreaOfExpertise] = useState("");
  const [updatedRole, setUpdatedRole] = useState("");
  const [updatedIsActive, setUpdatedIsActive] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCounselors();
  }, []);

  const fetchCounselors = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_COUNSELOR_COLLECTION_ID!
      );
      setCounselors(response.documents as Counselor[]);
    } catch (error) {
      console.error("Error fetching counselors:", error);
      setMessage("❌ Failed to fetch counselors.");
    }
  };

  const handleEdit = (counselor: Counselor) => {
    setEditingId(counselor.$id);
    setUpdatedName(counselor.name);
    setUpdatedPhone(counselor.phone);
    setUpdatedProgram(counselor.program);
    setUpdatedAreaOfExpertise(counselor.areaOfExpertise);
    setUpdatedRole(counselor.role);
    setUpdatedIsActive(counselor.isActive);
  };

  const handleUpdate = async (counselorId: string) => {
    try {
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_COUNSELOR_COLLECTION_ID!,
        counselorId,
        {
          name: updatedName,
          phone: updatedPhone,
          program: updatedProgram,
          areaOfExpertise: updatedAreaOfExpertise,
          role: updatedRole,
          isActive: updatedIsActive,
        }
      );
      setEditingId(null);
      fetchCounselors();
      setMessage("✅ Counselor updated successfully!");
    } catch (error) {
      console.error("Error updating counselor:", error);
      setMessage("❌ Failed to update counselor.");
    }
  };

  const handleDelete = async (counselorId: string) => {
    if (confirm("Are you sure you want to delete this counselor?")) {
      try {
        await databases.deleteDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          process.env.NEXT_PUBLIC_COUNSELOR_COLLECTION_ID!,
          counselorId
        );
        fetchCounselors();
        setMessage("✅ Counselor deleted successfully!");
      } catch (error) {
        console.error("Error deleting counselor:", error);
        setMessage("❌ Failed to delete counselor.");
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Counselors</h1>
      {message && <p className="mb-4">{message}</p>}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Phone</th>
            <th className="p-2 border">Program</th>
            <th className="p-2 border">Area of Expertise</th>
            <th className="p-2 border">Role</th>
            <th className="p-2 border">Active</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {counselors.map((counselor) => (
            <tr key={counselor.$id} className="border">
              <td className="p-2 border">
                {editingId === counselor.$id ? (
                  <Input
                    type="text"
                    value={updatedName}
                    onChange={(e) => setUpdatedName(e.target.value)}
                  />
                ) : (
                  counselor.name
                )}
              </td>
              <td className="p-2 border">{counselor.email}</td>
              <td className="p-2 border">
                {editingId === counselor.$id ? (
                  <Input
                    type="text"
                    value={updatedPhone}
                    onChange={(e) => setUpdatedPhone(e.target.value)}
                  />
                ) : (
                  counselor.phone
                )}
              </td>
              <td className="p-2 border">
                {editingId === counselor.$id ? (
                  <Input
                    type="text"
                    value={updatedProgram}
                    onChange={(e) => setUpdatedProgram(e.target.value)}
                  />
                ) : (
                  counselor.program
                )}
              </td>
              <td className="p-2 border">
                {editingId === counselor.$id ? (
                  <Input
                    type="text"
                    value={updatedAreaOfExpertise}
                    onChange={(e) => setUpdatedAreaOfExpertise(e.target.value)}
                  />
                ) : (
                  counselor.areaOfExpertise
                )}
              </td>
              <td className="p-2 border">
                {editingId === counselor.$id ? (
                  <select
                    value={updatedRole}
                    onChange={(e) => setUpdatedRole(e.target.value)}
                  >
                    <option value="superAdmin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="counselor">Counselor</option>
                  </select>
                ) : (
                  counselor.role
                )}
              </td>
              <td className="p-2 border">
                {editingId === counselor.$id ? (
                  <input
                    type="checkbox"
                    checked={updatedIsActive}
                    onChange={(e) => setUpdatedIsActive(e.target.checked)}
                  />
                ) : (
                  counselor.isActive ? "Yes" : "No"
                )}
              </td>
              <td className="p-2 border">
                {editingId === counselor.$id ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdate(counselor.$id)}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <CheckCircle size={16} />
                    </Button>
                    <Button
                      onClick={() => setEditingId(null)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      <XCircle size={16} />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(counselor)}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      onClick={() => handleDelete(counselor.$id)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CounselorList;