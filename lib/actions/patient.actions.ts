"use server";

import { ID, Query } from "node-appwrite";
import { 
  BUCKET_ID, 
  DATABASE_ID, 
  databases, 
  ENDPOINT, 
  PATIENT_COLLECTION_ID,
  COUNSELOR_COLLECTION_ID,
  PROJECT_ID, 
  storage, 
  users 
} from "../appwrite.config";
import { parseStringify } from "../utils";
import { InputFile } from "node-appwrite/file";

export const createUser = async (user: CreateUserParams) => {
  try {
    const fullName = `${user.firstName} ${user.middleName ? user.middleName + " " : ""}${user.lastName} ${user.suffix ? user.suffix : ""}`.trim();

    const newUser = await users.create(
      ID.unique(),
      user.email,
      user.phone,
      undefined,
      fullName
    );

    return parseStringify(newUser);
  } catch (error: any) {
    if (error?.code === 409) {
      const existingUser = await users.list([
        Query.equal("email", [user.email]),
      ]);
      return existingUser.users[0];
    }
    throw error;
  }
};

// GET USER
export const getUser = async (userId: string) => {
  try {
    const user = await users.get(userId);
    return parseStringify(user);
  } catch (error) {
    console.error("An error occurred while retrieving the user details:", error);
  }
};

export const registerPatient = async ({ 
  identificationDocument, 
  program, 
  signatureData, // This is now the base64 image data
  signatureDate,
  privacyConsent,
  disclosureConsent,
  ...patient 
}: RegisterUserParams & { 
  program: string;
  signatureData: string;
  signatureDate: Date;
  privacyConsent: boolean;
  disclosureConsent: boolean;
}) => {
  try {
    // Handle identification document upload (existing code)
    let file;
    if (identificationDocument) {
      const blobFile = identificationDocument.get("blobFile") as Blob;
      const fileName = identificationDocument.get("fileName") as string;

      if (!blobFile || !fileName) {
        throw new Error("Invalid file input: Missing blob data or file name.");
      }

      const arrayBuffer = await blobFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const inputFile = InputFile.fromBuffer(buffer, fileName);
      file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile);
    }

    // Handle signature upload (new code)
    let signatureFileId = null;
    if (signatureData) {
      // Convert base64 to blob
      const byteString = atob(signatureData.split(',')[1]);
      const mimeString = signatureData.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      const blob = new Blob([ab], { type: mimeString });
      const signatureFile = await storage.createFile(
        BUCKET_ID!,
        ID.unique(),
        InputFile.fromBuffer(Buffer.from(await blob.arrayBuffer()), `signature-${Date.now()}.png`)
      );
      signatureFileId = signatureFile.$id;
    }

    // Construct full name
    const fullName = `${patient.firstName} ${patient.middleName ? patient.middleName + " " : ""}${patient.lastName} ${patient.suffix ? patient.suffix : ""}`.trim();

    // Create patient document
    const newPatient = await databases.createDocument(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      ID.unique(),
      {
        ...patient,
        name: fullName,
        program,
        identificationDocumentId: file?.$id || null,
        identificationDocumentUrl: file
          ? `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view?project=${PROJECT_ID}`
          : null,
        counselorId: patient.counselorId,
        privacyConsent,
        disclosureConsent,
        signatureFileId, // Store the file ID reference
        signatureDate: signatureDate.toISOString(),
      }
    );

    return parseStringify(newPatient);
  } catch (error) {
    console.error("Error in registerPatient:", error);
    throw error;
  }
};

export const getStudentsByCounselorId = async (counselorId: string) => {
  try {
    const students = await databases.listDocuments(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_PATIENT_COLLECTION_ID!,
      [Query.equal("counselorId", [counselorId])]
    );
    return parseStringify(students.documents);
  } catch (error) {
    console.error("Error fetching students by counselor ID:", error);
    throw error;
  }
};
