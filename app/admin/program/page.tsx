"use client";

import { useEffect, useState } from "react";
import { Client, Databases, ID } from "appwrite";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash, Edit, CheckCircle, Search, XCircle, Plus, Loader2 } from "lucide-react";
import SideBar from "@/components/SideBar";

interface ProgramType {
  $id: string;
  name: string;
}

const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID!;
const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID!;
const PROGRAMTYPES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROGRAMTYPES_COLLECTION_ID!;
const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT!;

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
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProgramTypes();
  }, []);

  const fetchProgramTypes = async () => {
    setLoading(true);
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
      showMessage("Failed to fetch program types.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFilteredProgramTypes(
      searchTerm
        ? programTypes.filter((programType) =>
            programType.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : programTypes
    );
  }, [searchTerm, programTypes]);

  const showMessage = (msg: string, type: string) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  };

  const addProgramType = async () => {
    if (!newProgramType.trim()) return showMessage("Program type name cannot be empty.", "error");
    setActionLoading(true);

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
      showMessage("Program type added successfully!", "success");
    } catch (error) {
      console.error("Error adding program type:", error);
      showMessage("Failed to add program type.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const updateProgramType = async ($id: string) => {
    if (!updatedProgramType.trim()) return showMessage("Program type name cannot be empty.", "error");
    setActionLoading(true);

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
      showMessage("Program type updated successfully!", "success");
    } catch (error) {
      console.error("Error updating program type:", error);
      showMessage("Failed to update program type.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteProgramType = async ($id: string) => {
    setActionLoading(true);
    try {
      await databases.deleteDocument(DATABASE_ID, PROGRAMTYPES_COLLECTION_ID, $id);
      const updatedList = programTypes.filter((programType) => programType.$id !== $id);
      setProgramTypes(updatedList);
      setFilteredProgramTypes(updatedList);
      showMessage("Program type deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting program type:", error);
      showMessage("Failed to delete program type.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideBar />
      <div className="flex-1 p-8 ml-20 md:ml-64">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Program Types Management</h1>
            <p className="text-gray-600">Add, edit, or remove academic programs</p>
          </div>

          {/* Message Alert */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-md border ${
                messageType === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <div className="flex items-center">
                {messageType === "success" ? (
                  <CheckCircle className="mr-2 h-5 w-5" />
                ) : (
                  <XCircle className="mr-2 h-5 w-5" />
                )}
                <span>{message}</span>
              </div>
            </div>
          )}

          {/* Search and Add Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search program types..."
                  className="pl-10 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Add Program Type */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newProgramType}
                  onChange={(e) => setNewProgramType(e.target.value)}
                  placeholder="New program name"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === "Enter" && addProgramType()}
                />
                <Button
                  onClick={addProgramType}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Program Types List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="px-6 py-3 bg-gray-50 flex justify-between items-center">
                <h3 className="font-medium text-gray-700">Program Types</h3>
                <span className="text-sm text-gray-500">
                  {filteredProgramTypes.length} {filteredProgramTypes.length === 1 ? "item" : "items"}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : filteredProgramTypes.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {filteredProgramTypes.map((programType) => (
                  <li key={programType.$id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      {editingId === programType.$id ? (
                        <Input
                          type="text"
                          value={updatedProgramType}
                          onChange={(e) => setUpdatedProgramType(e.target.value)}
                          className="mr-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          autoFocus
                          onKeyDown={(e) => e.key === "Enter" && updateProgramType(programType.$id)}
                        />
                      ) : (
                        <span className="font-medium text-gray-800">{programType.name}</span>
                      )}

                      <div className="flex gap-2">
                        {editingId === programType.$id ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-gray-500"
                              onClick={() => {
                                setEditingId(null);
                                setUpdatedProgramType("");
                              }}
                              disabled={actionLoading}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-blue-600 text-white"
                              onClick={() => updateProgramType(programType.$id)}
                              disabled={actionLoading}
                            >
                              {actionLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                "Save"
                              )}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600"
                              onClick={() => {
                                setEditingId(programType.$id);
                                setUpdatedProgramType(programType.name);
                              }}
                              disabled={actionLoading}
                            >
                              <Edit className="h-4 w-4 mr-2 text-black" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                              onClick={() => deleteProgramType(programType.$id)}
                              disabled={actionLoading}
                            >
                              <Trash className="h-4 w-4 mr-2 text-red-500" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">
                  {searchTerm ? "No matching program types found" : "No program types available"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramTypesManagement;