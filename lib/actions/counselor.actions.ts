// C:\Users\User_\Desktop\thesis-app\lib\actions\counselor.actions.ts
"use server";

import { ID, Query } from "node-appwrite";
import { account, databases, users} from "../appwrite.config";
import { parseStringify } from "../utils";
import { SignJWT } from "jose"; // Import SignJWT from jose
import Cookies from "js-cookie";

export const registerCounselor = async (counselor: {
  name: string;
  email: string;
  phone: string;
  program: string;
  areaOfExpertise: string;
  passkey: string; // This is the temporary passkey
  isActive: boolean;
  role: string;
}) => {
  try {
    // Create a user in Appwrite's users collection (without phone)
    const newUser = await users.create(
      ID.unique(), // Generate a unique userId
      counselor.email, // Email
      undefined, // Phone is not passed
      counselor.passkey, // Use the passkey as the initial password
      counselor.name // Name
    );

    console.log("User created in users collection:", newUser); // Debugging

    // If the user already exists, retrieve the existing user
    if (newUser?.code === 409) {
      const existingUser = await users.list([
        Query.equal("email", [counselor.email]),
      ]);
      return existingUser.users[0];
    }

    // Create the counselor document in the counselor collection
    const newCounselor = await databases.createDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_COUNSELOR_COLLECTION_ID!,
      ID.unique(),
      {
        userId: newUser.$id, // Link the counselor document to the user
        name: counselor.name,
        email: counselor.email,
        phone: counselor.phone, // Store phone in the counselor document
        program: counselor.program,
        areaOfExpertise: counselor.areaOfExpertise,
        passkey: counselor.passkey, // Store the passkey
        isActive: counselor.isActive,
        role: counselor.role,
        password: "", // Leave the password field empty initially
      }
    );

    console.log("Counselor document created:", newCounselor); // Debugging
    return parseStringify(newCounselor);
  } catch (error) {
    console.error("Error registering counselor:", error);
    throw error;
  }
};

export const loginCounselor = async ({ email, password }: { email: string; password: string }) => {
  try {
    // Validate the counselor's credentials
    const counselor = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_COUNSELOR_COLLECTION_ID!,
      [Query.equal("email", [email])]
    );

    if (counselor.documents.length === 0) {
      return { success: false, message: "Counselor not found." };
    }

    const counselorData = counselor.documents[0];

    // Check if the counselor has already set a password
    if (counselorData.password) {
      // If the counselor has a password, validate the password
      if (counselorData.password !== password) {
        return { success: false, message: "Invalid password." };
      }
    } else {
      // If the counselor has not set a password, validate the passkey
      if (counselorData.passkey !== password) {
        return { success: false, message: "Invalid passkey." };
      }
    }

    // Generate a session ID
    const sessionId = ID.unique();

    // Store the session in the `sessions` collection
    await databases.createDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      "67daacd40035af7560b5", // Replace with your sessions collection ID
      sessionId, // Use the sessionId as the document ID
      {
        userId: counselorData.userId,
        sessionId, // Explicitly set the sessionId field
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      }
    );

    // Generate a JWT token using jose
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const token = await new SignJWT({ userId: counselorData.userId, sessionId })
      .setProtectedHeader({ alg: "HS256" }) // Use HMAC SHA-256 algorithm
      .setExpirationTime("24h") // Token expires in 24 hours
      .sign(secret);

    // Redirect to the setup password page only if the counselor has not set a password
    const redirectToSetup = !counselorData.password;

    return { success: true, token, redirectToSetup };
  } catch (error) {
    console.error("Error logging in:", error);
    return { success: false, message: "An error occurred. Please try again." };
  }
};

export const setupCounselorPassword = async ({ password, email }: { password: string; email: string }) => {
  try {
    // Find the counselor by email
    const counselor = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_COUNSELOR_COLLECTION_ID!,
      [Query.equal("email", [email])]
    );

    // If no counselor is found, return an error
    if (counselor.documents.length === 0) {
      return { success: false, message: "Counselor not found." };
    }

    // Update the counselor's password in the counselor collection
    await databases.updateDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_COUNSELOR_COLLECTION_ID!,
      counselor.documents[0].$id,
      { 
        password, // Update the password field
        passkey: "", // Invalidate the passkey
      }
    );

    // Update the password in the Appwrite users collection
    await users.updatePassword(counselor.documents[0].userId, password);

    return { success: true };
  } catch (error) {
    console.error("Error setting up password:", error);
    return { success: false, message: "Failed to set up password." };
  }
};

export const getCounselorSession = async (sessionId: string) => {
  try {
    if (!sessionId) {
      throw new Error("Session ID is required.");
    }

    console.log("Session ID in getCounselorSession:", sessionId);

    // Check if the session exists in the `sessions` collection
    const session = await databases.getDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_SESSIONS_COLLECTION_ID!,
      sessionId
    );

    if (!session || new Date(session.expiresAt) < new Date()) {
      return null;
    }

    // Get the user associated with the session
    const user = await users.get(session.userId);

    if (!user) {
      return null;
    }

    // Query the counselor collection using the userId field
    const counselor = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_COUNSELOR_COLLECTION_ID!,
      [Query.equal("userId", [session.userId])] // Query by userId field
      
    );

    if (counselor.documents.length === 0) {
      throw new Error("Counselor not found for the given user.");
    }

    // Return the user and counselor data
    return {
      ...user,
      program: counselor.documents[0].program, // Include the counselor's program
      counselorId: counselor.documents[0].$id, // Include the counselor's document ID
    };
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
};

export const logoutCounselor = async () => {
  try {
    // Clear the JWT token from cookies using js-cookie
    Cookies.remove("counselorToken", { path: "/" });
    return { success: true };
  } catch (error) {
    console.error("Error logging out:", error);
    return { success: false, message: "An error occurred. Please try again." };
  }
};

export const getStudentsByCounselorId = async (
  counselorId: string, 
  program: string,
  limit: number,
  offset: number
  ) => {

  try {
    const students = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_PATIENT_COLLECTION_ID!,
      [
        Query.equal("counselorId", [counselorId]),
        Query.equal("program", [program]), // Add this line to filter by program
        Query.limit(10), // Limit the number of results (set to 10 as an example)
        Query.offset(0) // Offset for pagination (default to 0)
      ]
      
    );
    return parseStringify(students.documents);
  } catch (error) {
    console.error("Error fetching students by counselor ID:", error);
    throw error;
  }
};