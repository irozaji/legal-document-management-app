import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import {
  handleApiError,
  createNotFoundError,
  createValidationError,
  ApiError,
  ErrorType,
} from "@/lib/api-error";

// Validate extraction object
function validateExtraction(extraction: any, index: number) {
  const errors = [];

  if (!extraction.text || typeof extraction.text !== "string") {
    errors.push(
      `Extraction at index ${index}: text is required and must be a string`
    );
  }

  if (
    extraction.pageNumber === undefined ||
    typeof extraction.pageNumber !== "number" ||
    extraction.pageNumber < 1
  ) {
    errors.push(
      `Extraction at index ${index}: pageNumber is required and must be a positive number`
    );
  }

  return errors;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const documentId = id;

    // Validate document ID
    if (!documentId || documentId.trim() === "") {
      throw createValidationError("Invalid document ID", {
        received: documentId,
        reason: "Document ID cannot be empty",
      });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      throw createValidationError("Invalid JSON in request body", {
        cause: "JSON parse error",
      });
    }

    const { extractions } = body;

    // Validate extractions array
    if (!extractions) {
      throw createValidationError("Missing extractions", {
        reason: "The extractions field is required",
      });
    }

    if (!Array.isArray(extractions)) {
      throw createValidationError("Invalid extractions format", {
        received: typeof extractions,
        expected: "array",
      });
    }

    if (extractions.length === 0) {
      throw createValidationError("Empty extractions array", {
        reason: "At least one extraction is required",
      });
    }

    // Validate each extraction object
    const validationErrors = extractions.flatMap((extraction, index) =>
      validateExtraction(extraction, index)
    );

    if (validationErrors.length > 0) {
      throw createValidationError("Invalid extraction objects", {
        errors: validationErrors,
      });
    }

    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw createNotFoundError("Document", documentId);
    }

    // Use transaction to ensure atomicity
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Delete existing extractions for this document
        await tx.extraction.deleteMany({
          where: { documentId },
        });

        // Create new extractions
        const createdExtractions = await tx.extraction.createMany({
          data: extractions.map((extraction: any) => ({
            id: uuidv4(),
            text: extraction.text,
            pageNumber: extraction.pageNumber,
            documentId,
          })),
        });

        return createdExtractions;
      });

      return NextResponse.json({
        success: true,
        count: result.count,
        message: `Successfully created ${result.count} extractions for document ${documentId}`,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError(
          ErrorType.INTERNAL_SERVER_ERROR,
          "Failed to update extractions",
          {
            reason: error.message,
          },
          error
        );
      }
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const { id } = await params

    const documentId = id;

    // Validate document ID
    if (!documentId || documentId.trim() === "") {
      throw createValidationError("Invalid document ID", {
        received: documentId,
        reason: "Document ID cannot be empty",
      });
    }

    // Check if document exists first
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw createNotFoundError("Document", documentId);
    }

    // Get page filter if provided
    const extractions = await prisma.extraction.findMany({
      where: { documentId },
      orderBy: { pageNumber: "asc" },
    });

    return NextResponse.json(extractions);
  } catch (error) {
    return handleApiError(error);
  }
}
