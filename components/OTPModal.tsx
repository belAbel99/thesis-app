'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import Image from 'next/image';

interface OTPModalProps {
  email: string;
  otp: string;
  onClose: () => void;
  onVerify: (enteredOtp: string) => Promise<void>;
}

const OTPModal: React.FC<OTPModalProps> = ({ email, otp, onClose, onVerify }) => {
  const [inputOtp, setInputOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60 * 1000); // 15 minutes in milliseconds
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVerify = async () => {
    if (isExpired) {
      setError("OTP expired. Please request a new OTP.");
      return;
    }
  
    setIsLoading(true);
    setError('');
  
    try {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, enteredOtp: inputOtp }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        await onVerify(inputOtp); // Call parent function if verification is successful
      } else {
        setError(data.error || "Verification failed.");
      }
    } catch (err) {
      setError("Failed to verify OTP.");
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent className="shad-alert-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-start justify-between">
            OTP Verification
            <Image
              src="/assets/icons/close.svg"
              alt="close"
              width={20}
              height={20}
              onClick={onClose}
              className="cursor-pointer"
            />
          </AlertDialogTitle>
          <AlertDialogDescription>
            Enter the 6-digit OTP sent to <span className="font-medium">{email}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="text-center text-red-500 font-medium">
          {isExpired ? "OTP expired. Login again to verify." : `OTP expires in: ${formatTime(timeLeft)}`}
        </div>

        <div>
          <InputOTP maxLength={6} value={inputOtp} onChange={setInputOtp} disabled={isExpired}>
            <InputOTPGroup className="shad-otp">
              {[...Array(6)].map((_, index) => (
                <InputOTPSlot className="shad-otp-slot" key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>

          {error && (
            <p className="shad-error text-14-regular mt-4 flex justify-center text-red-500">
              {error}
            </p>
          )}
        </div>

        <AlertDialogFooter>
        <button
  onClick={handleVerify}
  disabled={isLoading}
  className={`w-full py-3 text-lg font-semibold rounded-lg transform transition-transform active:scale-95 ${
    isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 text-white'
  }`}
>
  {isLoading ? (
    <div className="flex items-center justify-center">
      <svg
        className="animate-spin h-5 w-5 mr-2 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 01-8 8z"
        ></path>
      </svg>
      Verifying...
    </div>
  ) : (
    "Verify OTP"
  )}
</button>

        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default OTPModal;
