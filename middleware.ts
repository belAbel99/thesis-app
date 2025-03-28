import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose"; // Import jwtVerify from jose
import { databases } from "@/lib/appwrite.config";

export async function middleware(request: NextRequest) {
  const publicRoutes = [
    "/admin/counselors/login",
    "/admin/counselors/register",
    "/admin/counselors/setup-password",
  ];
  const pathname = request.nextUrl.pathname;

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  try {
    // Get the JWT token from cookies
    const token = request.cookies.get("counselorToken")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/admin/counselors/login", request.url));
    }

    // Verify the JWT token using jose
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    // Debugging: Log the JWT payload
    console.log("JWT Payload:", payload);

    // Extract the sessionId from the JWT payload
    const sessionId = payload.sessionId as string;

    if (!sessionId) {
      console.error("Session ID not found in JWT payload.");
      return NextResponse.redirect(new URL("/admin/counselors/login", request.url));
    }

    // Debugging: Log the sessionId
    console.log("Session ID extracted from JWT:", sessionId);

    // Check if the session exists in the `sessions` collection
    const session = await databases.getDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      "67daacd40035af7560b5", // Replace with your sessions collection ID
      sessionId
    );

    if (!session || new Date(session.expiresAt) < new Date()) {
      return NextResponse.redirect(new URL("/admin/counselors/login", request.url));
    }

    // Allow the request to proceed
    return NextResponse.next();
  } catch (error) {
    console.error("Error validating session:", error);
    return NextResponse.redirect(new URL("/admin/counselors/login", request.url));
  }
}

export const config = {
  matcher: ["/admin/counselors/:path*"], // Protect all routes under /admin/counselors
};