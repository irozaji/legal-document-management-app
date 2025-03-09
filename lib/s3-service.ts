import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "";

/**
 * Generate a pre-signed URL for uploading a file directly to S3 from the client
 * @param fileName Original file name
 * @param contentType MIME type of the file
 * @param expiresIn Expiration time in seconds (default: 5 minutes)
 * @returns Object containing the pre-signed URL and the S3 key
 */
export const getPresignedUploadUrl = async (
  fileName: string,
  contentType: string,
  expiresIn = 300
): Promise<{ url: string; key: string }> => {
  // Generate a unique key for the file
  const fileExtension = fileName.split(".").pop();
  const key = `documents/${uuidv4()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return { url, key };
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    throw new Error("Failed to generate pre-signed URL");
  }
};

/**
 * Generate a pre-signed URL for downloading/viewing a file from S3
 * @param key S3 key of the object to download/view
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 * @returns Pre-signed URL for downloading/viewing the file
 */
export const getPresignedDownloadUrl = async (
  key: string,
  expiresIn = 3600
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error("Error generating pre-signed download URL:", error);
    throw new Error("Failed to generate pre-signed download URL");
  }
};

/**
 * Delete an object from S3
 * @param key S3 key of the object to delete
 */
export const deleteObject = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting object from S3:", error);
    throw new Error("Failed to delete object from S3");
  }
};
