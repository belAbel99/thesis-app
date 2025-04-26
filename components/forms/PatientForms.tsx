"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import CustomFormField from "../ui/CustomFormField";
import { useState } from "react";
import SubmitButton from "../SubmitButton";
import { UserFormValidation } from "@/lib/validation";
import { useRouter } from "next/navigation";
import OTPModal from "@/components/OTPModal";
import PasskeyModal from "@/components/PasskeyModal";

export enum FormFieldType {
  INPUT = "input",
  PHONE_INPUT = "phoneInput",
  DATE_PICKER = "datePicker",
  TEXTAREA = "textarea",
  SELECT = "select",
  CHECKBOX = "checkbox",
  SKELETON = "skeleton",
}

const PatientForms = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");

  const form = useForm<z.infer<typeof UserFormValidation>>({
    resolver: zodResolver(UserFormValidation),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (formData: z.infer<typeof UserFormValidation>) => {
    setIsLoading(true);
    setEmail(formData.email);

    // Check if the email matches the admin email from environment variables
    if (formData.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      setShowPasskeyModal(true);
      setIsLoading(false);
      return;
    }

    try {
      const otpResponse = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const otpData = await otpResponse.json();

      if (otpResponse.ok) {
        setOtp(otpData.otp);
        setShowModal(true);
      } else {
        alert(otpData.error || "Failed to send OTP.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("Error sending OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async (enteredOtp: string) => {
    try {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, enteredOtp }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Invalid OTP.");
        return;
      }

      // Delete OTP record after successful verification
      await fetch("/api/otp/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // Proceed with user verification after OTP validation
      const checkResponse = await fetch("/api/patient/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const checkData = await checkResponse.json();

      if (checkResponse.ok) {
        if (checkData.patient) {
          const { userId } = checkData.patient;
          router.push(`/patients/${userId}/student`);
        } else if (checkData.userId) {
          router.push(`/patients/${checkData.userId}/register?email=${encodeURIComponent(email)}`);
        }
      }
    } catch (err) {
      console.error("Error verifying user:", err);
      alert("Failed to verify user.");
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full max-w-md mx-auto">
          <section className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-blue-800 mb-2">Welcome to CSU Guidance</h1>
            <p className="text-gray-600">Schedule your first counseling appointment</p>
          </section>

          <div className="bg-black rounded-xl shadow-md p-6 border border-gray-100">
            <CustomFormField
              fieldType={FormFieldType.INPUT}
              control={form.control}
              name="email"
              label="Email"
              placeholder="example@gmail.com"
              required={true}
            />

            <SubmitButton isLoading={isLoading} className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
              Get Started
            </SubmitButton>
          </div>

          <div className="text-center text-sm text-gray-500 mt-4">
            <p>By continuing, you agree to our counseling policies and privacy terms.</p>
          </div>
        </form>
      </Form>

      {/* OTP Verification Modal */}
      {showModal && (
        <OTPModal
          email={email}
          otp={otp}
          onClose={() => setShowModal(false)}
          onVerify={handleOtpVerification}
        />
      )}

      {/* Passkey Modal for Admin */}
      {showPasskeyModal && (
        <PasskeyModal 
          onClose={() => {
            setShowPasskeyModal(false);
            form.reset();
          }}
          onSuccess={() => {
            setShowPasskeyModal(false);
            router.push('/admin');
          }}
        />
      )}
    </>
  );
};

export default PatientForms;