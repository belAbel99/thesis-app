import { NextRequest, NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { databases } from "@/lib/appwrite.config";

const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID as string;
const PATIENT_COLLECTION_ID = process.env.NEXT_PUBLIC_PATIENT_COLLECTION_ID as string;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const patientQuery = await databases.listDocuments(
      DATABASE_ID,
      PATIENT_COLLECTION_ID,
      [`equal("email", "${email}")`]
    );

    if (patientQuery.total > 0) {
      const patient = patientQuery.documents[0];
      return NextResponse.json({ patient }, { status: 200 });
    } else {
      const newUserId = ID.unique(); // Generate a new user ID for new patients
      return NextResponse.json({ userId: newUserId }, { status: 200 });
    }
  } catch (error: any) {
    console.error("Error checking patient:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
