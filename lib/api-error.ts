import { NextResponse } from "next/server";

// Define error types
export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  CONFLICT = "CONFLICT",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  BAD_REQUEST = "BAD_REQUEST",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

// Map error types to HTTP status codes
const errorStatusMap: Record<ErrorType, number> = {
  [ErrorType.VALIDATION_ERROR]: 400,
  [ErrorType.BAD_REQUEST]: 400,
  [ErrorType.UNAUTHORIZED]: 401,
  [ErrorType.FORBIDDEN]: 403,
  [ErrorType.NOT_FOUND]: 404,
  [ErrorType.CONFLICT]: 409,
  [ErrorType.INTERNAL_SERVER_ERROR]: 500,
  [ErrorType.SERVICE_UNAVAILABLE]: 503,
};

// API Error class
export class ApiError extends Error {
  type: ErrorType;
  details?: any;
  cause?: Error;

  constructor(type: ErrorType, message: string, details?: any, cause?: Error) {
    super(message);
    this.name = "ApiError";
    this.type = type;
    this.details = details;
    this.cause = cause;
  }
}

// Function to handle errors and return appropriate NextResponse
export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  // If it's our custom ApiError, use its properties
  if (error instanceof ApiError) {
    const status = errorStatusMap[error.type];
    return NextResponse.json(
      {
        error: {
          type: error.type,
          message: error.message,
          details: error.details,
        },
      },
      { status }
    );
  }

  // Handle Prisma errors
  if (
    error instanceof Error &&
    error.name === "PrismaClientKnownRequestError"
  ) {
    // You can add specific handling for different Prisma error codes here
    return NextResponse.json(
      {
        error: {
          type: ErrorType.INTERNAL_SERVER_ERROR,
          message: "Database operation failed",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }

  // For unknown errors
  const errorMessage =
    error instanceof Error ? error.message : "An unknown error occurred";

  return NextResponse.json(
    {
      error: {
        type: ErrorType.INTERNAL_SERVER_ERROR,
        message: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
    },
    { status: 500 }
  );
}

// Validation error helper
export function createValidationError(message: string, details: any) {
  return new ApiError(ErrorType.VALIDATION_ERROR, message, details);
}

// Not found error helper
export function createNotFoundError(resource: string, id?: string) {
  const message = id
    ? `${resource} with ID ${id} not found`
    : `${resource} not found`;
  return new ApiError(ErrorType.NOT_FOUND, message);
}

// Service error helper
export function createServiceError(
  service: string,
  operation: string,
  error: Error
) {
  return new ApiError(
    ErrorType.SERVICE_UNAVAILABLE,
    `${service} service failed during ${operation}`,
    undefined,
    error
  );
}
