"use server";

import { Client, Databases, Storage } from "node-appwrite";
import { ID} from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import QRCode from "qrcode";
import { parseStringify } from "../utils";

export const generateQRCode = async (data: {
  appointmentId: string;
  studentId: string;
  date: string;
  time: string;
}) => {
  try {
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_PROJECT_ID!)
      .setKey(process.env.API_KEY!);

    const storage = new Storage(client);

    // Generate QR code data
    const qrData = JSON.stringify({
      appointmentId: data.appointmentId,
      studentId: data.studentId,
      date: data.date,
      time: data.time,
      hash: generateHash(data.appointmentId)
    });

    // Generate QR code as data URL
    const qrImage = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'M'
    });

    // Convert data URL to buffer
    const base64Data = qrImage.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Create InputFile for Appwrite
    const inputFile = InputFile.fromBuffer(buffer, `qr_${data.appointmentId}.png`);

    // Upload to Appwrite storage
    const file = await storage.createFile(
      process.env.NEXT_PUBLIC_BUCKET_ID!,
      ID.unique(),
      inputFile
    );

    return `${process.env.NEXT_PUBLIC_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_BUCKET_ID}/files/${file.$id}/view?project=${process.env.NEXT_PUBLIC_PROJECT_ID}`;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
};

function generateHash(appointmentId: string): string {
  let hash = 0;
  for (let i = 0; i < appointmentId.length; i++) {
    const char = appointmentId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}