"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setupCounselorPassword } from "@/lib/actions/counselor.actions";
import { Label } from "@/components/ui/label";

const SetupPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{text: string; type: "success" | "error"} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  useEffect(() => {
    if (!email) {
      setMessage({text: "Email not found. Please log in again.", type: "error"});
      router.push("/admin/counselors/login");
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage({text: "Passwords do not match.", type: "error"});
      return;
    }

    try {
      if (!email) {
        setMessage({text: "Email not found. Please log in again.", type: "error"});
        return;
      }

      setIsLoading(true);
      const response = await setupCounselorPassword({ password, email });

      if (response.success) {
        setMessage({text: "Password set successfully! Redirecting...", type: "success"});
        setTimeout(() => router.push("/admin/counselors"), 1500);
      } else {
        setMessage({text: response.message || "Failed to set up password.", type: "error"});
      }
    } catch (error) {
      console.error("Error setting up password:", error);
      setMessage({text: "An error occurred. Please try again.", type: "error"});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm border border-gray-200">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-blue-700">Setup Your Password</h1>
          <p className="text-gray-600 mt-2">Create a secure password for your account</p>
          {email && <p className="text-sm text-gray-500 mt-1">For: {email}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-black">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your new password"
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-black">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              required
              minLength={8}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Setting Password...
              </span>
            ) : (
              "Set Password"
            )}
          </Button>

          {message && (
            <div className={`p-3 rounded-md text-center ${
              message.type === "success" 
                ? "bg-green-100 text-green-700 border border-green-200" 
                : "bg-red-100 text-red-700 border border-red-200"
            }`}>
              {message.text}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SetupPasswordPage;