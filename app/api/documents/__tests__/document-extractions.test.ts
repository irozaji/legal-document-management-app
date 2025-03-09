import { server } from "./mocks/server";
import { http, HttpResponse } from "msw";

describe("Document Extractions", () => {
  it("should create and retrieve extractions for a document", async () => {
    // First get all documents to find an ID
    const allDocsResponse = await fetch("http://localhost/api/documents");
    const documents = await allDocsResponse.json();

    // Skip test if no documents exist
    if (documents.length === 0) {
      console.log("No documents found, skipping test");
      return;
    }

    const docId = documents[0].id;

    // Create mock extractions
    const mockExtractions = [
      { text: "Sample extraction 1", pageNumber: 1 },
      { text: "Sample extraction 2", pageNumber: 2 },
    ];

    // Post extractions
    const createResponse = await fetch(
      `http://localhost/api/documents/${docId}/extractions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extractions: mockExtractions }),
      }
    );

    expect(createResponse.status).toBe(200);
    const createResult = await createResponse.json();
    expect(createResult.success).toBe(true);
    expect(createResult.count).toBe(2);

    // Get extractions
    const getResponse = await fetch(
      `http://localhost/api/documents/${docId}/extractions`
    );
    expect(getResponse.status).toBe(200);

    const extractions = await getResponse.json();
    expect(Array.isArray(extractions)).toBe(true);
    expect(extractions.length).toBe(2);
    expect(extractions[0].documentId).toBe(docId);
    expect(extractions[0].text).toBeDefined();
    expect(extractions[0].pageNumber).toBeDefined();
  });

  it("should reject invalid extraction objects", async () => {
    // First get all documents to find an ID
    const allDocsResponse = await fetch("http://localhost/api/documents");
    const documents = await allDocsResponse.json();

    // Skip test if no documents exist
    if (documents.length === 0) {
      console.log("No documents found, skipping test");
      return;
    }

    const docId = documents[0].id;

    // Create invalid extractions (missing pageNumber)
    const invalidExtractions = [
      { text: "Sample extraction with missing page number" },
    ];

    // Post invalid extractions
    const createResponse = await fetch(
      `http://localhost/api/documents/${docId}/extractions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extractions: invalidExtractions }),
      }
    );

    expect(createResponse.status).toBe(400);
    const errorData = await createResponse.json();
    expect(errorData.error.type).toBe("VALIDATION_ERROR");
    expect(errorData.error.message).toBe("Invalid extraction objects");
  });

  it("should return 404 for non-existent document ID", async () => {
    const nonExistentId = "non-existent-id";
    const response = await fetch(
      `http://localhost/api/documents/${nonExistentId}/extractions`
    );

    expect(response.status).toBe(404);
    const errorData = await response.json();
    expect(errorData.error.type).toBe("NOT_FOUND");
    expect(errorData.error.message).toContain(nonExistentId);
  });
});
