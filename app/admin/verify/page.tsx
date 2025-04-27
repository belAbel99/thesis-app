"use client";
import PasskeyModal from "@/components/PasskeyModal";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function VerifyAdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated
    if (localStorage.getItem('admin') === 'true') {
      router.push('/admin');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <PasskeyModal 
        onClose={() => router.push('/')}
        onSuccess={() => router.push('/admin')}
      />
    </div>
  );
}