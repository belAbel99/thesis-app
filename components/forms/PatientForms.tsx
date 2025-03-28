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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const [showAccountDialog, setShowAccountDialog] = useState(false); // New state for account selection dialog
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null); // New state to store userId

  const form = useForm<z.infer<typeof UserFormValidation>>({
    resolver: zodResolver(UserFormValidation),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (formData: z.infer<typeof UserFormValidation>) => {
    setIsLoading(true);
    setEmail(formData.email);

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
          // Redirect to student page directly if the user is already a student
          router.push(`/patients/${userId}/student`);
        } else if (checkData.userId) {
          // Store the userId in state and show account selection dialog
          setUserId(checkData.userId);
          setShowAccountDialog(true);
        }
      }
    } catch (err) {
      console.error("Error verifying user:", err);
      alert("Failed to verify user.");
    }
  };

  const handleAccountSelection = (accountType: "student" | "counselor") => {
    setShowAccountDialog(false); // Close the dialog
    if (userId) {
      if (accountType === "student") {
        router.push(`/patients/${userId}/register?email=${encodeURIComponent(email)}`);
      } else if (accountType === "counselor") {
        router.push(`/counselors/${userId}/register?email=${encodeURIComponent(email)}`);
      }
    } else {
      alert("User ID is missing. Please try again.");
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-1">
          <section className="mb-12 space-y-4">
            <h1 className="header text-green-400">Hi There! 👋</h1>
            <p className="text-dark-700">Schedule your First Appointment</p>
          </section>

          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="email"
            label="Email"
            placeholder="JohnDoe@gmail.com"
            iconSrc="/assets/icons/email.svg"
            iconAlt="email"
          />

          <SubmitButton isLoading={isLoading}>Get Started</SubmitButton>
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

      {/* Account Selection Dialog */}
      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Account Type</DialogTitle>
            <DialogDescription>
              Please select the type of account you want to create.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            <Button
              onClick={() => handleAccountSelection("student")}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Create Student Account
            </Button>
            <Button
              onClick={() => handleAccountSelection("counselor")}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Create Counselor Account
            </Button>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowAccountDialog(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PatientForms;