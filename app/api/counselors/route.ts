import { NextResponse } from "next/server";
import databases  from "@/lib/appwrite";
import { Query } from "appwrite";

export const GET = async () => {
  try {
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_COUNSELOR_COLLECTION_ID!,
      [Query.limit(100)] // Adjust limit if necessary
    );
    return NextResponse.json(response.documents, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch counselors" }, { status: 500 });
  }
};
