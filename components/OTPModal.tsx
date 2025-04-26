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
import { Mail, Clock, AlertCircle, X, Loader2 } from 'lucide-react';

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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

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
        await onVerify(inputOtp);
      } else {
        setError(data.error || "Verification failed.");
        // Shake animation on error
        const otpGroup = document.querySelector('.otp-group');
        if (otpGroup) {
          otpGroup.classList.add('animate-shake');
          setTimeout(() => otpGroup.classList.remove('animate-shake'), 500);
        }
      }
    } catch (err) {
      setError("Failed to verify OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent className={`max-w-md p-8 rounded-2xl border-0 shadow-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-300 ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <AlertDialogHeader className="relative">
          <div className="absolute -top-14 left-1/2 transform -translate-x-1/2">
            <div className="bg-blue-600 p-3 rounded-full shadow-lg border-4 border-white dark:border-gray-800 transition-all duration-300 animate-pop-in">
              <Mail className="w-6 h-6 text-white" />
            </div>
          </div>
          <AlertDialogTitle className="text-center pt-4 text-2xl font-bold text-gray-900 dark:text-white animate-fade-in">
            OTP Verification
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-gray-600 dark:text-gray-300 animate-fade-in">
            Enter the 6-digit code sent to <span className="font-semibold text-gray-800 dark:text-gray-200">{email}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className={`mt-6 transition-all duration-300 delay-100 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <div className={`text-center mb-4 font-medium ${
            isExpired ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
          }`}>
            {isExpired ? (
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                OTP expired. Please request a new one.
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Expires in: {formatTime(timeLeft)}
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <InputOTP 
              maxLength={6} 
              value={inputOtp} 
              onChange={(value) => {
                setInputOtp(value);
                setError('');
              }}
              disabled={isExpired}
              className="focus:outline-none"
            >
              <InputOTPGroup className="otp-group space-x-2">
                {[...Array(6)].map((_, index) => (
                  <InputOTPSlot 
                    key={index}
                    index={index}
                    className={`w-12 h-14 text-xl font-bold border-2 rounded-lg transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:border-blue-500 dark:focus:ring-blue-900 ${
                      isExpired 
                        ? 'border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800 cursor-not-allowed'
                        : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && (
            <div className="mt-4 text-center text-sm text-red-600 dark:text-red-400 flex items-center justify-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            <p>For security, this code will expire after 15 minutes.</p>
          </div>
        </div>

        <AlertDialogFooter className={`mt-6 transition-all duration-300 delay-150 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <button
            onClick={handleVerify}
            disabled={isLoading || isExpired || inputOtp.length !== 6}
            className={`w-full py-3 rounded-lg font-medium transition-all duration-300 ${
              !isExpired && inputOtp.length === 6
                ? 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg text-white'
                : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400'
            } ${isLoading ? 'opacity-80' : ''}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </span>
            ) : (
              'Verify OTP'
            )}
          </button>
        </AlertDialogFooter>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 opacity-70 hover:opacity-100 transition-opacity" />
        </button>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default OTPModal;