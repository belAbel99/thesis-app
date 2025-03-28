"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginCounselor } from "@/lib/actions/counselor.actions";
import { Label } from "@/components/ui/label";

const CounselorLoginPage = () => {
  const [email, setEmail] = useState("");
  const [passkey, setPasskey] = useState("");
  const [message, setMessage] = useState<{text: string; type: "success" | "error"} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
  
    try {
      const response = await loginCounselor({ email, password: passkey });
  
      if (response.success) {
        document.cookie = `counselorToken=${response.token}; path=/;`;
        
        if (response.redirectToSetup) {
          router.push(`/admin/counselors/setup-password?email=${encodeURIComponent(email)}`);
        } else {
          router.push("/admin/counselors");
        }
      } else {
        setMessage({ text: response.message || "Invalid email or passkey", type: "error" });
      }
    } catch (error) {
      console.error("Error logging in:", error);
      setMessage({ text: "An error occurred. Please try again.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm border border-gray-200">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-blue-700">Counselor Portal</h1>
          <p className="text-gray-600 mt-2">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-black">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="counselor@gmail.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passkey" className="text-black">Passkey</Label>
            <Input
              id="passkey"
              type="password"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              placeholder="Enter your passkey/password"
              required
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
                Signing in...
              </span>
            ) : (
              "Sign In"
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

export default CounselorLoginPage;