//not used
import { Databases } from "appwrite";
import { Client } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!) 
  .setProject(process.env.PROJECT_ID!);

const databases = new Databases(client);

export const fetchStudent = async (userId: string) => {
  try {
    const response = await databases.getDocument(
      process.env.DATABASE_ID!, 
      process.env.PATIENT_COLLECTION_ID!, 
      userId 
    );
    return response;
  } catch (error) {
    console.error("Error fetching student details:", error);
    return null;
  }
};
