"use client";

import { useState, useEffect } from "react"; // Add useEffect
import { useRouter, useSearchParams  } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setupCounselorPassword } from "@/lib/actions/counselor.actions";


const SetupPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  useEffect(() => {
    if (!email) {
      setMessage("Email not found. Please log in again.");
      router.push("/admin/counselors/login");
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      if (!email) {
        setMessage("Email not found. Please log in again.");
        return;
      }

      setLoading(true);

      // Update the counselor's password in the counselor collection
      const response = await setupCounselorPassword({ password, email });

      if (response.success) {
        // Redirect to the counselor dashboard
        router.push("/admin/counselors");
      } else {
        setMessage(response.message || "Failed to set up password.");
      }
    } catch (error) {
      console.error("Error setting up password:", error);
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold">Set Up Password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New Password"
            required
          />
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Setting Password..." : "Set Password"}
          </Button>
        </form>
        {message && <p className="mt-4 text-red-500">{message}</p>}
      </div>
    </div>
  );
};

export default SetupPasswordPage;