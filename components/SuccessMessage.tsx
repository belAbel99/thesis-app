"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const SuccessMessage = ({ message }: { message: string }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 5000); // Auto-hide after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!show || !message) return null;

  return (
    <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center z-50 animate-fade-in">
      <CheckCircle2 className="mr-2 h-5 w-5" />
      <span className="flex-1">{message}</span>
      <Button 
        className="ml-4 p-1 h-auto" 
        variant="ghost" 
        onClick={() => setShow(false)}
        aria-label="Close message"
      >
        ✖
      </Button>
    </div>
  );
};

export default SuccessMessage;