import { NextApiRequest, NextApiResponse } from "next";
import { Databases, Client } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!);

const databases = new Databases(client);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("Received request:", req.method, req.body);

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { studentIds, dietRecommendation } = req.body;

  if (!studentIds || !dietRecommendation) {
    return res.status(400).json({ message: "Missing studentIds or dietRecommendation" });
  }

  try {
    await Promise.all(
      studentIds.map(async (studentId: string) => {
        await databases.updateDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID!,
          process.env.NEXT_PUBLIC_PATIENT_COLLECTION_ID!,
          studentId,
          { dietRecommendation }
        );
      })
    );

    return res.status(200).json({ message: "Bulk recommendation sent successfully!" });
  } catch (error) {
    console.error("Error sending bulk recommendation:", error);
    return res.status(500).json({ message: "Failed to send bulk recommendation" });
  }
}