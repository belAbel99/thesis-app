"use client";

import { useEffect, useState } from "react";
import { Client, Databases, ID } from "appwrite";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash, Edit, CheckCircle, Search, RefreshCcw } from "lucide-react";
import SideBar from "@/components/SideBar";

interface MedicalHistory {
  $id: string;
  name: string;
}

const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID!;
const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID!;
const FAMILY_MEDICAL_HISTORY_COLLECTION_ID = process.env.NEXT_PUBLIC_FAMILYMEDICALHISTORY_COLLECTION_ID!;
const PAST_MEDICAL_HISTORY_COLLECTION_ID = process.env.NEXT_PUBLIC_PASTMEDICALHISTORY_COLLECTION_ID!;
const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT!;

const MedicalHistoryManagement = () => {
  const [histories, setHistories] = useState<MedicalHistory[]>([]);
  const [filteredHistories, setFilteredHistories] = useState<MedicalHistory[]>([]);
  const [newHistory, setNewHistory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updatedHistory, setUpdatedHistory] = useState("");
  const [message, setMessage] = useState("");
  const [isFamilyHistory, setIsFamilyHistory] = useState(true);
  const [messageType, setMessageType] = useState("");

  const client = new Client();
  client.setEndpoint(ENDPOINT).setProject(PROJECT_ID);
  const databases = new Databases(client);

  useEffect(() => {
    fetchHistories();
  }, [isFamilyHistory]);

  const fetchHistories = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        isFamilyHistory ? FAMILY_MEDICAL_HISTORY_COLLECTION_ID : PAST_MEDICAL_HISTORY_COLLECTION_ID
      );

      const formattedHistories = response.documents.map((doc) => ({
        $id: doc.$id,
        name: doc.name,
      }));

      setHistories(formattedHistories);
      setFilteredHistories(formattedHistories);
    } catch (error) {
      console.error("Error fetching medical histories:", error);
      setMessage("❌ Failed to fetch medical histories.");
      setMessageType("error");
    }
  };

  useEffect(() => {
    setFilteredHistories(
      searchTerm
        ? histories.filter((history) =>
            history.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : histories
    );
  }, [searchTerm, histories]);

  const addHistory = async () => {
    if (!newHistory.trim()) return setMessage("⚠️ Medical history cannot be empty.");

    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        isFamilyHistory ? FAMILY_MEDICAL_HISTORY_COLLECTION_ID : PAST_MEDICAL_HISTORY_COLLECTION_ID,
        ID.unique(),
        { name: newHistory.trim() }
      );

      const newEntry = { $id: response.$id, name: response.name };
      setHistories((prev) => [...prev, newEntry]);
      setFilteredHistories((prev) => [...prev, newEntry]);
      setNewHistory("");
      setMessage("✅ Medical history added successfully!");
      setMessageType("success");
    } catch (error) {
      console.error("Error adding medical history:", error);
      setMessage("❌ Failed to add medical history.");
      setMessageType("error");
    }
  };

  const updateHistory = async ($id: string) => {
    if (!updatedHistory.trim()) return setMessage("⚠️ Medical history cannot be empty.");

    try {
      await databases.updateDocument(
        DATABASE_ID,
        isFamilyHistory ? FAMILY_MEDICAL_HISTORY_COLLECTION_ID : PAST_MEDICAL_HISTORY_COLLECTION_ID,
        $id,
        { name: updatedHistory.trim() }
      );

      setHistories((prev) =>
        prev.map((history) =>
          history.$id === $id ? { ...history, name: updatedHistory.trim() } : history
        )
      );
      setFilteredHistories((prev) =>
        prev.map((history) =>
          history.$id === $id ? { ...history, name: updatedHistory.trim() } : history
        )
      );

      setEditingId(null);
      setUpdatedHistory("");
      setMessage("✅ Medical history updated successfully!");
      setMessageType("success");
    } catch (error) {
      console.error("Error updating medical history:", error);
      setMessage("❌ Failed to update medical history.");
      setMessageType("error");
    }
  };

  const deleteHistory = async ($id: string) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        isFamilyHistory ? FAMILY_MEDICAL_HISTORY_COLLECTION_ID : PAST_MEDICAL_HISTORY_COLLECTION_ID,
        $id
      );

      setHistories((prev) => prev.filter((history) => history.$id !== $id));
      setFilteredHistories((prev) => prev.filter((history) => history.$id !== $id));
      setMessage("✅ Medical history deleted successfully!");
      setMessageType("success");
    } catch (error) {
      console.error("Error deleting medical history:", error);
      setMessage("❌ Failed to delete medical history.");
      setMessageType("error");
    }
  };

  return (
    <div className="flex">
      <SideBar />
      <div className="flex flex-col items-center justify-center w-full min-h-screen p-6 bg-gray-50">
        <h2 className="text-2xl font-bold mb-4 text-blue-700">
          Manage {isFamilyHistory ? "Family" : "Past"} Medical History
        </h2>

        <Button
          onClick={() => setIsFamilyHistory((prev) => !prev)}
          className="mb-6 bg-blue-700 text-white hover:bg-blue-900 flex items-center gap-2"
        >
          <RefreshCcw size={16} />
          Switch to {isFamilyHistory ? "Past" : "Family"} Medical History
        </Button>

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

        <div className="relative flex items-center gap-2 mb-4 w-full max-w-lg">
          <Search size={20} className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${isFamilyHistory ? "family" : "past"} medical history...`}
            className="bg-white border-2 border-blue-700 pl-9 w-full text-black"
          />
        </div>

        <div className="flex gap-2 w-full max-w-lg mb-4">
          <Input
            type="text"
            value={newHistory}
            onChange={(e) => setNewHistory(e.target.value)}
            placeholder={`Enter ${isFamilyHistory ? "family" : "past"} medical history`}
            className="border-blue-700 bg-white text-black"
          />
          <Button onClick={addHistory} className="bg-blue-700 hover:bg-blue-900">
            Add
          </Button>
        </div>

        <ul className="mt-16 w-full max-w-lg">
          {filteredHistories.length > 0 ? (
            filteredHistories.map((history) => (
              <li
                key={history.$id}
                className="flex justify-between items-center p-2 border-b border-blue-700"
              >
                {editingId === history.$id ? (
                  <input
                    type="text"
                    value={updatedHistory}
                    onChange={(e) => setUpdatedHistory(e.target.value)}
                    className="bg-blue-200 text-black px-2 py-1 rounded-md border border-gray-600"
                  />
                ) : (
                  <span className="text-lg text-black">{history.name}</span>
                )}

                <div className="flex gap-2">
                  {editingId === history.$id ? (
                    <Button
                      variant="ghost"
                      onClick={() => updateHistory(history.$id)}
                      className="text-green-400 hover:text-green-500"
                    >
                      <CheckCircle size={16} />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingId(history.$id);
                        setUpdatedHistory(history.name);
                      }}
                      className="text-yellow-400 hover:text-yellow-500"
                    >
                      <Edit size={16} />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => deleteHistory(history.$id)}
                    className="text-red-400 hover:text-red-500"
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </li>
            ))
          ) : (
            <p className="text-gray-400 text-center mt-4">
              No {isFamilyHistory ? "family" : "past"} medical histories found.
            </p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default MedicalHistoryManagement;
