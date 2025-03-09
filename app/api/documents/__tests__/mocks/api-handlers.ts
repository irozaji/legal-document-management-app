import { http, HttpResponse } from "msw";

// Mock document data
const mockDocuments = [
  {
    id: "doc-uuid-1",
    name: "Contract Agreement.pdf",
    uploadDate: new Date().toISOString(),
    fileUrl: "https://example-bucket.s3.amazonaws.com/documents/doc1.pdf",
    fileKey: "documents/doc1.pdf",
    fileSize: 1024 * 1024, // 1MB
    mimeType: "application/pdf",
    slotId: "doc-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "doc-uuid-2",
    name: "Legal Brief.pdf",
    uploadDate: new Date().toISOString(),
    fileUrl: "https://example-bucket.s3.amazonaws.com/documents/doc2.pdf",
    fileKey: "documents/doc2.pdf",
    fileSize: 2 * 1024 * 1024, // 2MB
    mimeType: "application/pdf",
    slotId: "doc-2",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock extractions data
const mockExtractions: Record<
  string,
  Array<{
    id: string;
    text: string;
    pageNumber: number;
    documentId: string;
    createdAt: string;
    updatedAt: string;
  }>
> = {
  "doc-uuid-1": [
    {
      id: "extract-uuid-1",
      text: "This agreement is made on the 1st day of January, 2025",
      pageNumber: 1,
      documentId: "doc-uuid-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "extract-uuid-2",
      text: "The parties agree to the following terms and conditions",
      pageNumber: 1,
      documentId: "doc-uuid-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  "doc-uuid-2": [],
};

// Define API handlers
export const handlers = [
  // GET /api/documents - Get all documents
  http.get("http://localhost/api/documents", () => {
    return HttpResponse.json(mockDocuments);
  }),

  // GET /api/documents/:id - Get a specific document
  http.get("http://localhost/api/documents/:id", ({ params }) => {
    const { id } = params;
    const document = mockDocuments.find((doc) => doc.id === id);

    if (!document) {
      return HttpResponse.json(
        {
          error: {
            type: "NOT_FOUND",
            message: `Document with ID ${id} not found`,
          },
        },
        { status: 404 }
      );
    }

    return HttpResponse.json(document);
  }),

  // POST /api/documents - Create a document
  http.post("http://localhost/api/documents", async ({ request }) => {
    const body = await request.json();
    const { name, fileKey, fileSize, mimeType, slotId } = body as {
      name?: string;
      fileKey?: string;
      fileSize?: number;
      mimeType?: string;
      slotId?: string;
    };

    // Validate required fields
    const missingFields = [];
    if (!name) missingFields.push("name");
    if (!fileKey) missingFields.push("fileKey");
    if (!fileSize) missingFields.push("fileSize");
    if (!mimeType) missingFields.push("mimeType");
    if (!slotId) missingFields.push("slotId");

    if (missingFields.length > 0) {
      return HttpResponse.json(
        {
          error: {
            type: "VALIDATION_ERROR",
            message: "Missing required fields",
            details: { missingFields },
          },
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (mimeType !== "application/pdf") {
      return HttpResponse.json(
        {
          error: {
            type: "VALIDATION_ERROR",
            message: "Invalid file type",
            details: {
              allowedTypes: ["application/pdf"],
              receivedType: mimeType,
            },
          },
        },
        { status: 400 }
      );
    }

    // Create new document
    const newDocument = {
      id: `doc-uuid-${Date.now()}`,
      name,
      uploadDate: new Date().toISOString(),
      fileUrl: `https://example-bucket.s3.amazonaws.com/${fileKey}`,
      fileKey,
      fileSize,
      mimeType,
      slotId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(newDocument);
  }),

  // POST /api/documents/upload-url - Get upload URL
  http.post(
    "http://localhost/api/documents/upload-url",
    async ({ request }) => {
      const body = await request.json();
      const {
        fileName,
        contentType,
        expiresIn = 300,
      } = body as {
        fileName?: string;
        contentType?: string;
        expiresIn?: number;
      };

      // Validate required fields
      const missingFields = [];
      if (!fileName) missingFields.push("fileName");
      if (!contentType) missingFields.push("contentType");

      if (missingFields.length > 0) {
        return HttpResponse.json(
          {
            error: {
              type: "VALIDATION_ERROR",
              message: "Missing required fields",
              details: { missingFields },
            },
          },
          { status: 400 }
        );
      }

      // Validate file extension
      // We've already checked that fileName exists in the missingFields check above
      const fileExtension = fileName!.split(".").pop()?.toLowerCase();
      if (fileExtension !== "pdf") {
        return HttpResponse.json(
          {
            error: {
              type: "VALIDATION_ERROR",
              message: "Invalid file extension",
              details: {
                received: fileExtension,
                allowedExtensions: ["pdf"],
                reason: "Only PDF files are allowed",
              },
            },
          },
          { status: 400 }
        );
      }

      // Validate content type
      if (contentType !== "application/pdf") {
        return HttpResponse.json(
          {
            error: {
              type: "VALIDATION_ERROR",
              message: "Invalid contentType",
              details: {
                received: contentType,
                allowedTypes: ["application/pdf"],
                reason: "Only PDF files are allowed",
              },
            },
          },
          { status: 400 }
        );
      }

      // Generate mock pre-signed URL
      const key = `documents/${Date.now()}-${fileName}`;
      const url = `https://example-bucket.s3.amazonaws.com/${key}`;

      return HttpResponse.json({
        url,
        key,
        expires: new Date(Date.now() + expiresIn * 1000).toISOString(),
        maxFileSize: 10 * 1024 * 1024, // 10MB
      });
    }
  ),

  // GET /api/documents/:id/download-url - Get download URL
  http.get(
    "http://localhost/api/documents/:id/download-url",
    ({ params, request }) => {
      const { id } = params;
      const document = mockDocuments.find((doc) => doc.id === id);

      if (!document) {
        return HttpResponse.json(
          {
            error: {
              type: "NOT_FOUND",
              message: `Document with ID ${id} not found`,
            },
          },
          { status: 404 }
        );
      }

      // Get expiration time from query params
      const url = new URL(request.url);
      const expiresIn = parseInt(url.searchParams.get("expiresIn") || "3600");
      const wantsDetailedResponse = url.searchParams.has("detailed");

      // Generate mock pre-signed URL
      const presignedUrl = `https://example-bucket.s3.amazonaws.com/${document.fileKey}?token=mock-token`;

      if (wantsDetailedResponse) {
        return HttpResponse.json({
          url: presignedUrl,
          expires: new Date(Date.now() + expiresIn * 1000).toISOString(),
          documentId: document.id,
          documentName: document.name,
        });
      } else {
        return HttpResponse.json({ url: presignedUrl });
      }
    }
  ),

  // GET /api/documents/:id/extractions - Get extractions
  http.get("http://localhost/api/documents/:id/extractions", ({ params }) => {
    const { id } = params;
    const document = mockDocuments.find((doc) => doc.id === id);

    if (!document) {
      return HttpResponse.json(
        {
          error: {
            type: "NOT_FOUND",
            message: `Document with ID ${id} not found`,
          },
        },
        { status: 404 }
      );
    }

    const extractions = mockExtractions[id as string] || [];

    return HttpResponse.json(extractions);
  }),

  // POST /api/documents/:id/extractions - Create extractions
  http.post(
    "http://localhost/api/documents/:id/extractions",
    async ({ params, request }) => {
      const { id } = params;
      const document = mockDocuments.find((doc) => doc.id === id);

      if (!document) {
        return HttpResponse.json(
          {
            error: {
              type: "NOT_FOUND",
              message: `Document with ID ${id} not found`,
            },
          },
          { status: 404 }
        );
      }

      const body = await request.json();
      const { extractions } = body as { extractions?: any[] };

      if (!extractions || !Array.isArray(extractions)) {
        return HttpResponse.json(
          {
            error: {
              type: "VALIDATION_ERROR",
              message: "Invalid extractions format",
              details: {
                received: typeof extractions,
                expected: "array",
              },
            },
          },
          { status: 400 }
        );
      }

      if (extractions.length === 0) {
        return HttpResponse.json(
          {
            error: {
              type: "VALIDATION_ERROR",
              message: "Empty extractions array",
              details: {
                reason: "At least one extraction is required",
              },
            },
          },
          { status: 400 }
        );
      }

      // Validate each extraction
      const validationErrors = extractions
        .map((extraction, index) => {
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
        })
        .flat()
        .filter((error) => error.length > 0);

      if (validationErrors.length > 0) {
        return HttpResponse.json(
          {
            error: {
              type: "VALIDATION_ERROR",
              message: "Invalid extraction objects",
              details: { errors: validationErrors },
            },
          },
          { status: 400 }
        );
      }

      // Create new extractions
      const newExtractions = extractions.map((extraction, index) => ({
        id: `extract-uuid-${Date.now()}-${index}`,
        text: extraction.text,
        pageNumber: extraction.pageNumber,
        documentId: id as string,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      // Update mock extractions
      mockExtractions[id as string] = newExtractions;

      return HttpResponse.json({
        success: true,
        count: newExtractions.length,
        message: `Successfully created ${newExtractions.length} extractions for document ${id}`,
      });
    }
  ),
];
