import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl } from "@/lib/s3-service";
import {
  handleApiError,
  createValidationError,
  createServiceError,
} from "@/lib/api-error";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      throw createValidationError("Invalid JSON in request body", {
        cause: "JSON parse error",
      });
    }

    const { fileName, contentType, expiresIn } = body;

    // Validate request parameters
    const missingFields = [];
    if (!fileName) missingFields.push("fileName");
    if (!contentType) missingFields.push("contentType");

    if (missingFields.length > 0) {
      throw createValidationError("Missing required fields", { missingFields });
    }

    // Validate file name
    if (typeof fileName !== "string" || fileName.trim() === "") {
      throw createValidationError("Invalid fileName", {
        received: fileName,
        reason: "fileName must be a non-empty string",
      });
    }

    // Validate file extension
    const fileExtension = fileName.split(".").pop()?.toLowerCase();
    if (fileExtension !== "pdf") {
      throw createValidationError("Invalid file extension", {
        received: fileExtension,
        allowedExtensions: ["pdf"],
        reason: "Only PDF files are allowed",
      });
    }

    // Validate content type
    if (contentType !== "application/pdf") {
      throw createValidationError("Invalid contentType", {
        received: contentType,
        allowedTypes: ["application/pdf"],
        reason: "Only PDF files are allowed",
      });
    }

    // Validate expiresIn if provided
    let validatedExpiresIn = 300; // Default 5 minutes
    if (expiresIn !== undefined) {
      if (typeof expiresIn !== "number" || expiresIn < 60 || expiresIn > 3600) {
        throw createValidationError("Invalid expiresIn parameter", {
          received: expiresIn,
          allowedRange: "60-3600 seconds (1-60 minutes)",
        });
      }
      validatedExpiresIn = expiresIn;
    }

    // Check if fileSize is provided in the request
    const { fileSize } = body;

    // Validate file size if provided
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (fileSize && typeof fileSize === "number" && fileSize > MAX_FILE_SIZE) {
      throw createValidationError("File too large", {
        received: `${(fileSize / (1024 * 1024)).toFixed(2)}MB`,
        maxSize: "10MB",
        reason: "Maximum file size is 10MB",
      });
    }

    try {
      // Generate a pre-signed URL for the file upload
      const { url, key } = await getPresignedUploadUrl(
        fileName,
        contentType,
        validatedExpiresIn
      );

      // Return the pre-signed URL and key to the client
      return NextResponse.json({
        url,
        key,
        expires: new Date(Date.now() + validatedExpiresIn * 1000).toISOString(),
        maxFileSize: MAX_FILE_SIZE, // 10MB limit (enforced)
      });
    } catch (error) {
      if (error instanceof Error) {
        throw createServiceError("S3", "generating upload URL", error);
      }
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
