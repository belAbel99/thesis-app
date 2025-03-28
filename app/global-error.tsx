"use client";

import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    // ✅ You can log the error to the console or a custom logging service
    console.error("Global error caught:", error);
  }, [error]);

  return (
    <html>
      <body>
        {/* Renders a generic error message */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
