import { NextRequest, NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT as string)
      .setProject(process.env.NEXT_PUBLIC_PROJECT_ID as string)
      .setKey(process.env.API_KEY as string);

    const databases = new Databases(client);

    // Find OTP document by email
    const otpDocs = await databases.listDocuments(
      process.env.DATABASE_ID as string,
      process.env.NEXT_PUBLIC_OTP_COLLECTION_ID as string,
      [Query.equal("email", email)]
    );

    if (otpDocs.total === 0) {
      return NextResponse.json({ message: "No OTP found to delete" });
    }

    // Delete all OTPs associated with the email
    await Promise.all(
      otpDocs.documents.map((otp) =>
        databases.deleteDocument(
          process.env.DATABASE_ID as string,
          process.env.NEXT_PUBLIC_OTP_COLLECTION_ID as string,
          otp.$id
        )
      )
    );

    return NextResponse.json({ message: "OTP deleted successfully" });
  } catch (error) {
    console.error("Error deleting OTP:", error);
    return NextResponse.json({ error: "Failed to delete OTP" }, { status: 500 });
  }
}
