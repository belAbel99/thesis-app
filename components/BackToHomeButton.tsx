"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react"; // Import loading spinner icon

const BackToHomeButton = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true); // Show loading animation
    router.push("/"); // Navigate to home
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading} // Disable button while loading
      className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-900 transition disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin w-5 h-5" /> Redirecting...
        </>
      ) : (
        "Back to Home"
      )}
    </button>
  );
};

export default BackToHomeButton;
