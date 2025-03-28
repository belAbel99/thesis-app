"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BackButton = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBack = () => {
    setLoading(true);
    router.push("/admin");
  };

  return (
    <button
      onClick={handleBack}
      disabled={loading}
      className={`px-4 py-2 font-semibold rounded-lg shadow-md text-white ${
        loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
      }`}
    >
      {loading ? (
        <div className="flex items-center">
          <svg
            className="animate-spin h-5 w-5 mr-2 text-white"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4l-3 3-3-3h4z"
            />
          </svg>
          Loading...
        </div>
      ) : (
        "← Back to Admin"
      )}
    </button>
  );
};

export default BackButton;
