"use client";

import { useState } from "react";
import { Databases, Client } from "appwrite";
import { FaPen, FaSave, FaSpinner } from "react-icons/fa";
import SuccessMessage from "@/components/SuccessMessage"; // Import the success message component

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);

const databases = new Databases(client);

interface EditableFieldProps {
  label?: string;
  value: string;
  userId: string;
  fieldName: string;
  onUpdate: (fieldName: string, newValue: string) => void;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  userId,
  fieldName,
  onUpdate,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    try {
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID!,
        process.env.NEXT_PUBLIC_PATIENT_COLLECTION_ID!,
        userId,
        { [fieldName]: inputValue }
      );
      onUpdate(fieldName, inputValue);
      setIsEditing(false);
      setSuccessMessage(`${label} updated successfully!`); // Set success message
      setTimeout(() => setSuccessMessage(null), 3000); // Auto-hide after 3 seconds
    } catch (error) {
      console.error(`Error updating ${fieldName}:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <strong>{label}:</strong>
      {isEditing ? (
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="border border-gray-600 bg-gray-700 text-white p-1 rounded"
        />
      ) : (
        <span>{value || "N/A"}</span>
      )}
      {isEditing ? (
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded"
        >
          {loading ? (
            <FaSpinner className="text-sm animate-spin" />
          ) : (
            <FaSave className="text-sm" />
          )}
        </button>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="px-2 py-1 hover:bg-blue-600 text-white rounded flex items-center gap-1"
        >
          <FaPen className="text-sm" />
        </button>
      )}

      {successMessage && <SuccessMessage message={successMessage} />}
    </div>
  );
};

export default EditableField;
