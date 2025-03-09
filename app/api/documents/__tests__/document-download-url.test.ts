import { server } from "./mocks/server";
import { http, HttpResponse } from "msw";

describe("Document Download URL", () => {
  it("should generate a valid download URL for an existing document", async () => {
    // First get all documents to find an ID
    const allDocsResponse = await fetch("http://localhost/api/documents");
    const documents = await allDocsResponse.json();

    // Skip test if no documents exist
    if (documents.length === 0) {
      console.log("No documents found, skipping test");
      return;
    }

    const docId = documents[0].id;
    const response = await fetch(
      `http://localhost/api/documents/${docId}/download-url`
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.url).toBeDefined();
    expect(data.url).toContain("https://");
  });

  it("should include additional details when requested", async () => {
    // First get all documents to find an ID
    const allDocsResponse = await fetch("http://localhost/api/documents");
    const documents = await allDocsResponse.json();

    // Skip test if no documents exist
    if (documents.length === 0) {
      console.log("No documents found, skipping test");
      return;
    }

    const docId = documents[0].id;
    const response = await fetch(
      `http://localhost/api/documents/${docId}/download-url?detailed=true`
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.url).toBeDefined();
    expect(data.expires).toBeDefined();
    expect(data.documentId).toBe(docId);
    expect(data.documentName).toBeDefined();
  });

  it("should return 404 for non-existent document ID", async () => {
    const nonExistentId = "non-existent-id";
    const response = await fetch(
      `http://localhost/api/documents/${nonExistentId}/download-url`
    );

    expect(response.status).toBe(404);
    const errorData = await response.json();
    expect(errorData.error.type).toBe("NOT_FOUND");
    expect(errorData.error.message).toContain(nonExistentId);
  });
});
