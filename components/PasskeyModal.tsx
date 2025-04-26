'use client';
import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
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
import { encryptKey } from '@/lib/utils';

interface PasskeyModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PasskeyModal = ({ onClose, onSuccess }: PasskeyModalProps) => {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const validatePasskey = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (passkey === process.env.NEXT_PUBLIC_ADMIN_PASSKEY) {
      const encryptedKey = encryptKey(passkey);
      localStorage.setItem('accessKey', encryptedKey);
      onSuccess();
    } else {
      setError('Invalid passkey. Please try again.');
      // Shake animation on error
      const otpGroup = document.querySelector('.otp-group');
      if (otpGroup) {
        otpGroup.classList.add('animate-shake');
        setTimeout(() => otpGroup.classList.remove('animate-shake'), 500);
      }
    }
    setIsSubmitting(false);
  };

  return (
    <AlertDialog open={true} onOpenChange={onClose}>
      <AlertDialogContent className={`max-w-md p-8 rounded-2xl border-0 shadow-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-300 ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <AlertDialogHeader className="relative">
          <div className="absolute -top-14 left-1/2 transform -translate-x-1/2">
            <div className="bg-blue-600 p-3 rounded-full shadow-lg border-4 border-white dark:border-gray-800 transition-all duration-300 animate-pop-in">
              <Image
                src="/assets/icons/lock.svg"
                alt="Secure"
                width={24}
                height={24}
                className="text-white"
              />
            </div>
          </div>
          <AlertDialogTitle className="text-center pt-4 text-2xl font-bold text-gray-900 dark:text-white animate-fade-in">
            Admin Verification
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-gray-600 dark:text-gray-300 animate-fade-in">
            Enter the 6-digit security passkey to access admin dashboard
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className={`mt-6 transition-all duration-300 delay-100 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <div className="flex justify-center">
            <InputOTP 
              maxLength={6} 
              value={passkey} 
              onChange={(value) => {
                setPasskey(value);
                setError('');
              }}
              className="focus:outline-none"
            >
              <InputOTPGroup className="otp-group space-x-2">
                {[...Array(6)].map((_, index) => (
                  <InputOTPSlot 
                    key={index}
                    index={index}
                    className="w-12 h-14 text-xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:border-blue-500 dark:focus:ring-blue-900 hover:border-gray-400 dark:hover:border-gray-500"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && (
            <div className="mt-4 text-center text-sm text-red-600 dark:text-red-400 flex items-center justify-center gap-2 animate-fade-in">
              <Image
                src="/assets/icons/warning.svg"
                alt="Error"
                width={16}
                height={16}
              />
              {error}
            </div>
          )}

          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            <p>For security reasons, this access is restricted to authorized personnel only.</p>
          </div>
        </div>

        <AlertDialogFooter className={`mt-6 transition-all duration-300 delay-150 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <AlertDialogAction
            onClick={validatePasskey}
            disabled={passkey.length !== 6 || isSubmitting}
            className={`w-full py-3 rounded-lg font-medium transition-all duration-300 ${
              passkey.length === 6 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
            } ${isSubmitting ? 'opacity-80' : ''}`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Verifying...
              </span>
            ) : (
              'Verify Identity'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close"
        >
          <Image
            src="/assets/icons/close.svg"
            alt="Close"
            width={20}
            height={20}
            className="opacity-70 hover:opacity-100 transition-opacity"
          />
        </button>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PasskeyModal;