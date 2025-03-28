import { NextRequest, NextResponse } from "next/server";
import { Client, Databases, ID, Query } from "appwrite";
import { users } from "@/lib/appwrite.config"; // Import the users service

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT as string)
  .setProject(process.env.NEXT_PUBLIC_PROJECT_ID as string);

const databases = new Databases(client);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // Check if the email already exists in the users database
    const existingUsers = await users.list([Query.equal("email", email)]);

    if (existingUsers.total > 0) {
      // If email exists in the users database, check if the student exists in the student collection
      const studentQuery = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID as string,
        process.env.NEXT_PUBLIC_PATIENT_COLLECTION_ID as string,
        [Query.equal("email", [email])]
      );

      if (studentQuery.total > 0) {
        // If student exists in the student collection, return student info
        const student = studentQuery.documents[0];
        return NextResponse.json({
          patient: {
            userId: student.$id,
          },
        });
      } else {
        // If student doesn't exist, return userId and redirect to register page
        const userId = existingUsers.users[0].$id; // Access the correct userId
        return NextResponse.json({ userId }, { status: 200 });
      }
    } else {
      // If email doesn't exist, create a new user
      const newUserId = ID.unique(); // Generate a unique user ID
      await users.create(newUserId, email); // Create the new user with the email

      // Return the userId of the new user
      return NextResponse.json({ userId: newUserId }, { status: 200 });
    }
  } catch (error: any) {
    console.error("Error checking or creating student:", error);

    // Handle specific error if it's related to existing email
    if (error.message.includes("A user with the same email already exists")) {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 });
    }

    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}