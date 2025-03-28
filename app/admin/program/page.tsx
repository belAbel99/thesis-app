"use client";

import { useEffect, useState } from "react";
import { Client, Databases, ID } from "appwrite";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash, Edit, CheckCircle, Search, XCircle } from "lucide-react";
import SideBar from "@/components/SideBar";

// Program Type Interface
interface ProgramType {
  $id: string;
  name: string;
}

// Environment Variables
const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID!;
const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID!;
const PROGRAMTYPES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROGRAMTYPES_COLLECTION_ID!;
const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT!;

// Appwrite Client & Database
const client = new Client();
client.setEndpoint(ENDPOINT).setProject(PROJECT_ID);
const databases = new Databases(client);

const ProgramTypesManagement = () => {
  const [programTypes, setProgramTypes] = useState<ProgramType[]>([]);
  const [filteredProgramTypes, setFilteredProgramTypes] = useState<ProgramType[]>([]);
  const [newProgramType, setNewProgramType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updatedProgramType, setUpdatedProgramType] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    fetchProgramTypes();
  }, []);

  // Fetch Program Types
  const fetchProgramTypes = async () => {
    try {
      const response = await databases.listDocuments(DATABASE_ID, PROGRAMTYPES_COLLECTION_ID);
      const formattedProgramTypes: ProgramType[] = response.documents.map((doc) => ({
        $id: doc.$id,
        name: doc.name,
      }));
      setProgramTypes(formattedProgramTypes);
      setFilteredProgramTypes(formattedProgramTypes);
    } catch (error) {
      console.error("Error fetching program types:", error);
      setMessage("Failed to fetch program types.");
    }
  };

  // Search Filter
  useEffect(() => {
    setFilteredProgramTypes(
      searchTerm
        ? programTypes.filter((programType) =>
            programType.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : programTypes
    );
  }, [searchTerm, programTypes]);

  // Add Program Type
  const addProgramType = async () => {
    if (!newProgramType.trim()) return setMessage("Program type name cannot be empty.");

    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        PROGRAMTYPES_COLLECTION_ID,
        ID.unique(),
        { name: newProgramType.trim() }
      );

      const newEntry = { $id: response.$id, name: response.name };
      setProgramTypes([...programTypes, newEntry]);
      setFilteredProgramTypes([...programTypes, newEntry]);
      setNewProgramType("");
      setMessage("✅ Program type added successfully!");
      setMessageType("success");
    } catch (error) {
      console.error("Error adding program type:", error);
      setMessage("❌ Failed to add program type.");
      setMessageType("error");
    }
  };

  // Update Program Type
  const updateProgramType = async ($id: string) => {
    if (!updatedProgramType.trim()) return setMessage("Program type name cannot be empty.");

    try {
      await databases.updateDocument(DATABASE_ID, PROGRAMTYPES_COLLECTION_ID, $id, {
        name: updatedProgramType.trim(),
      });

      const updatedList = programTypes.map((programType) =>
        programType.$id === $id ? { ...programType, name: updatedProgramType.trim() } : programType
      );
      setProgramTypes(updatedList);
      setFilteredProgramTypes(updatedList);
      setEditingId(null);
      setUpdatedProgramType("");
      setMessage("✅ Program type updated successfully! ");
      setMessageType("success");
    } catch (error) {
      console.error("Error updating program type:", error);
      setMessage("❌ Failed to update program type.");
      setMessageType("error");
    }
  };

  // Delete Program Type
  const deleteProgramType = async ($id: string) => {
    try {
      await databases.deleteDocument(DATABASE_ID, PROGRAMTYPES_COLLECTION_ID, $id);
      const updatedList = programTypes.filter((programType) => programType.$id !== $id);
      setProgramTypes(updatedList);
      setFilteredProgramTypes(updatedList);
      setMessage("✅ Program type deleted successfully! ");
      setMessageType("success");
    } catch (error) {
      console.error("Error deleting program type:", error);
      setMessage("❌ Failed to delete program type.");
      setMessageType("error");
    }
  };

  return (
    <div className="flex">
      <SideBar />
      <div className="flex flex-col items-center justify-center w-full min-h-screen p-6 bg-gray-50">
        <h2 className="text-2xl font-bold mb-6 text-blue-700">Manage Program Types</h2>

        {message && (
          <div className="flex relative w-full items-center justify-center">
          <div
            className={`flex px-4 py-3 rounded absolute my-4 border top-28 items-center justify-center${
              messageType === "success"
                ? "bg-green-100 border-green-400 text-green-700"
                : "bg-red-100 border-red-400 text-red-700"
            }`}
          >
            {message}
          </div>
        </div>
      )}

        {/* Search Input */}
        <div className="relative flex items-center gap-2 mb-4 w-full max-w-lg">
          <Search size={20} className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search program types..."
            className="bg-white border-2 border-blue-700 pl-9 w-full text-black"
          />
        </div>

        {/* Add Program Type */}
        <div className="flex gap-2 w-full max-w-lg mb-4">
          <Input
            type="text"
            value={newProgramType}
            onChange={(e) => setNewProgramType(e.target.value)}
            placeholder="Enter program type name"
            className="border-blue-700 bg-white text-black"
          />
          <Button onClick={addProgramType} className="bg-blue-700 hover:bg-blue-900">
            Add
          </Button>
        </div>

        {/* Program Type List */}
        <ul className="mt-14 w-full max-w-lg">
          {filteredProgramTypes.length > 0 ? (
            filteredProgramTypes.map((programType) => (
              <li
                key={programType.$id}
                className="flex justify-between items-center p-2 border-b border-blue-700"
              >
                {editingId === programType.$id ? (
                  <input
                    type="text"
                    value={updatedProgramType}
                    onChange={(e) => setUpdatedProgramType(e.target.value)}
                    className="bg-blue-200 text-black px-2 py-1 rounded-md border border-gray-600"
                  />
                ) : (
                  <span className="text-lg text-black">{programType.name}</span>
                )}

                <div className="flex gap-2">
                  {editingId === programType.$id ? (
                    <Button
                      variant="ghost"
                      onClick={() => updateProgramType(programType.$id)}
                      className="text-green-400 hover:text-green-500"
                    >
                      <CheckCircle size={16} />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingId(programType.$id);
                        setUpdatedProgramType(programType.name);
                      }}
                      className="text-yellow-400 hover:text-yellow-500"
                    >
                      <Edit size={16} />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => deleteProgramType(programType.$id)}
                    className="text-red-400 hover:text-red-500"
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </li>
            ))
          ) : (
            <p className="text-gray-400 text-center mt-4">No program types found.</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ProgramTypesManagement;