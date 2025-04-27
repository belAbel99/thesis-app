"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generatePasskey } from "@/lib/utils";
import { sendEmail } from "@/lib/emailService";
import { useRouter } from "next/navigation";
import { registerCounselor } from "@/lib/actions/counselor.actions";
import { Client, Databases } from "appwrite";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const CreateCounselorForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    countryCode: "+63",
    program: "",
    areaOfExpertise: "",
    role: "counselor",
    isActive: true
  });
  const [message, setMessage] = useState<{text: string; type: "success" | "error"} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [programOptions, setProgramOptions] = useState<string[]>([]);
  const router = useRouter();

  const expertiseOptions = [
    "Academic Advising",
    "Career Counseling",
    "Mental Health Support",
    "Personal Development",
    "Student Wellness",
    "Crisis Intervention",
  ];

  useEffect(() => {
    const fetchPrograms = async () => {
      const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);

      const databases = new Databases(client);

      try {
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          process.env.NEXT_PUBLIC_PROGRAMTYPES_COLLECTION_ID!
        );
        setProgramOptions(response.documents.map(doc => doc.name));
      } catch (error) {
        console.error("Error fetching programs:", error);
      }
    };

    fetchPrograms();
  }, []);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({ ...prev, phone: value.replace(/\D/g, '') }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const passkey = generatePasskey();

    try {
      await registerCounselor({
        ...formData,
        phone: `${formData.countryCode}${formData.phone}`,
        passkey
      });

      await sendEmail({
        to: formData.email,
        subject: "Your Counselor Account Passkey",
        text: `Hi ${formData.name}, Your passkey for the Guidance Counseling System is: ${passkey}`
      });

      setMessage({ text: "Counselor account created successfully!", type: "success" });
      setTimeout(() => router.push("/admin/counselors/login"), 1500);
    } catch (error) {
      console.error("Error creating counselor:", error);
      setMessage({ 
        text: "Failed to create counselor account. Please try again.", 
        type: "error" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="w-full max-w-2xl mx-auto">
        {/* Form Container - Replaces Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header - Replaces CardHeader */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-blue-700">
              Create New Counselor
            </h1>
            <p className="text-gray-600 mt-1">
              Register a new counselor with their details and assigned college
            </p>
          </div>
          
          {/* Form Content - Replaces CardContent */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2 text-black bg-gray-50 p-4 rounded-md">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    className="text-white"  
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="John Abel Silmaro"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2 text-black bg-gray-50 p-4 rounded-md">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    className="text-white"
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2 text-black bg-gray-50 p-4 rounded-md">
                  <Label>Phone Number</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={formData.countryCode} 
                      onValueChange={(value) => handleChange("countryCode", value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-black">
                        <SelectItem value="+63">+63 (PH)</SelectItem>
                        <SelectItem value="+1">+1 (US)</SelectItem>
                        <SelectItem value="+44">+44 (UK)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="text-white"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="9123456789"
                      required
                    />
                  </div>
                </div>

                {/* Program */}
                <div className="space-y-2 text-black bg-gray-50 p-4 rounded-md">
                  <Label>Assigned Program</Label>
                  <Select 
                    value={formData.program} 
                    onValueChange={(value) => handleChange("program", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent className="text-black bg-gray-50">
                      {programOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Area of Expertise */}
                <div className="space-y-2 text-black bg-gray-50 p-4 rounded-md">
                  <Label>Area of Expertise</Label>
                  <Select 
                    value={formData.areaOfExpertise} 
                    onValueChange={(value) => handleChange("areaOfExpertise", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select expertise" />
                    </SelectTrigger>
                    <SelectContent className="text-black bg-gray-50">
                      {expertiseOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Role */}
                <div className="space-y-2 text-black bg-gray-50 p-4 rounded-md">
                  <Label>System Role</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => handleChange("role", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="text-black">
                      <SelectItem value="superAdmin">Super Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="counselor">Counselor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2 pt-2 text-black">
                <Checkbox
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleChange("isActive", checked)}
                />
                <Label htmlFor="active" className="font-normal text-black">
                  Active Account
                </Label>
              </div>

              {/* Form Actions */}
              <div className="pt-4">
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
                      Creating...
                    </span>
                  ) : (
                    "Create Counselor Account"
                  )}
                </Button>

                {message && (
                  <div className={`mt-4 p-3 rounded-md text-center ${
                    message.type === "success" 
                      ? "bg-green-100 text-green-700 border border-green-200" 
                      : "bg-red-100 text-red-700 border border-red-200"
                  }`}>
                    {message.text}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCounselorForm;