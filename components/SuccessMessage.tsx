"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const SuccessMessage = ({ message }: { message: string }) => {
  const [show, setShow] = useState(true);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center">
      <span>{message}</span>
      <Button className="ml-4" variant="ghost" onClick={() => setShow(false)}>
        ✖
      </Button>
    </div>
  );
};

export default SuccessMessage;
