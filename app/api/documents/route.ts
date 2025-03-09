import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { handleApiError, createValidationError } from "@/lib/api-error";

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

    const { name, fileKey, fileSize, mimeType, slotId } = body;

    // Validate required fields
    const missingFields = [];
    if (!name) missingFields.push("name");
    if (!fileKey) missingFields.push("fileKey");
    if (!fileSize) missingFields.push("fileSize");
    if (!mimeType) missingFields.push("mimeType");
    if (!slotId) missingFields.push("slotId");

    if (missingFields.length > 0) {
      throw createValidationError("Missing required fields", { missingFields });
    }

    // Validate file type (only allow PDFs)
    if (mimeType !== "application/pdf") {
      throw createValidationError("Invalid file type", {
        allowedTypes: ["application/pdf"],
        receivedType: mimeType,
      });
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (fileSize > MAX_FILE_SIZE) {
      throw createValidationError("File too large", {
        received: `${(fileSize / (1024 * 1024)).toFixed(2)}MB`,
        maxSize: "10MB",
        reason: "Maximum file size is 10MB",
      });
    }

    // Check if a document already exists for this slot
    const existingDocument = await prisma.document.findUnique({
      where: { slotId },
    });

    // If a document exists, update it
    if (existingDocument) {
      const updatedDocument = await prisma.document.update({
        where: { id: existingDocument.id },
        data: {
          name,
          fileUrl: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
          fileKey,
          fileSize,
          mimeType,
          uploadDate: new Date(),
        },
      });

      return NextResponse.json(updatedDocument);
    }

    // Create a new document record
    const document = await prisma.document.create({
      data: {
        id: uuidv4(),
        name,
        fileUrl: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
        fileKey,
        fileSize,
        mimeType,
        slotId,
        uploadDate: new Date(),
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    // Get all documents ordered by upload date
    const documents = await prisma.document.findMany({
      orderBy: { uploadDate: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    return handleApiError(error);
  }
}
