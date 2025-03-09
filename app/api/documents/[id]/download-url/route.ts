import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getPresignedDownloadUrl } from "@/lib/s3-service";
import {
  handleApiError,
  createNotFoundError,
  createValidationError,
  createServiceError,
} from "@/lib/api-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const documentId = resolvedParams.id;

    // Validate request
    if (!documentId || documentId.trim() === "") {
      throw createValidationError("Invalid document ID", {
        received: documentId,
        reason: "Document ID cannot be empty",
      });
    }

    // Get document by ID
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw createNotFoundError("Document", documentId);
    }

    // Get expiration time from query params (optional)
    const expiresIn = parseInt(
      request.nextUrl.searchParams.get("expiresIn") || "3600"
    );

    // Validate expiresIn parameter
    if (isNaN(expiresIn) || expiresIn < 60 || expiresIn > 604800) {
      // Between 1 minute and 7 days
      throw createValidationError("Invalid expiresIn parameter", {
        received: request.nextUrl.searchParams.get("expiresIn"),
        allowedRange: "60-604800 seconds (1 minute to 7 days)",
      });
    }

    try {
      // Generate a pre-signed URL for downloading/viewing the document
      const presignedUrl = await getPresignedDownloadUrl(
        document.fileKey,
        expiresIn
      );

      // Check if client wants detailed response
      const wantsDetailedResponse =
        request.nextUrl.searchParams.has("detailed");

      if (wantsDetailedResponse) {
        return NextResponse.json({
          url: presignedUrl,
          expires: new Date(Date.now() + expiresIn * 1000).toISOString(),
          documentId: document.id,
          documentName: document.name,
        });
      } else {
        // For backward compatibility with the frontend
        return NextResponse.json({ url: presignedUrl });
      }
    } catch (error) {
      if (error instanceof Error) {
        throw createServiceError("S3", "generating download URL", error);
      }
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
