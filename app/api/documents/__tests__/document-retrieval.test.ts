import { server } from "./mocks/server";
import { http, HttpResponse } from "msw";

describe("Document Retrieval", () => {
  it("should retrieve all documents", async () => {
    const response = await fetch("http://localhost/api/documents");

    expect(response.status).toBe(200);
    const documents = await response.json();
    expect(Array.isArray(documents)).toBe(true);

    // Verify document structure
    if (documents.length > 0) {
      const doc = documents[0];
      expect(doc.id).toBeDefined();
      expect(doc.name).toBeDefined();
      expect(doc.fileUrl).toBeDefined();
      expect(doc.uploadDate).toBeDefined();
      expect(doc.slotId).toBeDefined();
    }
  });

  it("should retrieve a specific document by ID", async () => {
    // First get all documents to find an ID
    const allDocsResponse = await fetch("http://localhost/api/documents");
    const documents = await allDocsResponse.json();

    // Skip test if no documents exist
    if (documents.length === 0) {
      console.log("No documents found, skipping test");
      return;
    }

    const docId = documents[0].id;
    const response = await fetch(`http://localhost/api/documents/${docId}`);

    expect(response.status).toBe(200);
    const document = await response.json();
    expect(document.id).toBe(docId);
    expect(document.name).toBeDefined();
    expect(document.fileUrl).toBeDefined();
  });

  it("should return 404 for non-existent document ID", async () => {
    const nonExistentId = "non-existent-id";
    const response = await fetch(
      `http://localhost/api/documents/${nonExistentId}`
    );

    expect(response.status).toBe(404);
    const errorData = await response.json();
    expect(errorData.error.type).toBe("NOT_FOUND");
    expect(errorData.error.message).toContain(nonExistentId);
  });
});
