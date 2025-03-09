import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  handleApiError,
  createNotFoundError,
  createValidationError,
  ErrorType,
  ApiError,
} from "@/lib/api-error";
import { deleteObject } from "@/lib/s3-service";

// Simple logging function for audit purposes
const logOperation = (operation: string, details: Record<string, any>) => {
  console.log(
    `[${new Date().toISOString()}] ${operation}:`,
    JSON.stringify(details)
  );
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const documentId = id;

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

    return NextResponse.json(document);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const documentId = id;

    // Log the delete request for audit purposes
    logOperation("DELETE_DOCUMENT_REQUEST", {
      documentId,
      ip: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    // Validate request
    if (!documentId || documentId.trim() === "") {
      throw createValidationError("Invalid document ID", {
        received: documentId,
        reason: "Document ID cannot be empty",
      });
    }

    // Get document to check if it exists and to get the S3 key
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw createNotFoundError("Document", documentId);
    }

    // Use a transaction to ensure all operations succeed or fail together
    try {
      await prisma.$transaction(async (tx) => {
        // Delete related extractions first (foreign key constraint)
        await tx.extraction.deleteMany({
          where: { documentId },
        });

        // Delete document from database
        await tx.document.delete({
          where: { id: documentId },
        });

        // Delete document from S3
        await deleteObject(document.fileKey);
      });
    } catch (error) {
      if (error instanceof Error) {
        // Provide more detailed error information
        const errorDetails: Record<string, boolean | string> = {
          reason: error.message,
        };

        // Check if it's an S3 error
        if (error.message.includes("S3") || error.message.includes("storage")) {
          errorDetails.databaseDeleted = false;
          errorDetails.extractionsDeleted = false;
          errorDetails.s3Deleted = false;
          errorDetails.s3Error = true;
        } else {
          // Assume database error
          errorDetails.databaseDeleted = false;
          errorDetails.extractionsDeleted = false;
          errorDetails.s3Deleted = false;
          errorDetails.databaseError = true;
        }

        throw new ApiError(
          ErrorType.INTERNAL_SERVER_ERROR,
          "Failed to delete document completely",
          errorDetails,
          error
        );
      }
      throw error;
    }

    // Log successful deletion
    logOperation("DELETE_DOCUMENT_SUCCESS", { documentId });

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
      documentId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
