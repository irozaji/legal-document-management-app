import { http, HttpResponse } from "msw";
import { server } from "./mocks/server";

describe("Document Creation", () => {
  it("should create a new document with valid data", async () => {
    // Mock file data
    const mockFile = {
      name: "test.pdf",
      type: "application/pdf",
      size: 1024 * 1024, // 1MB
    };
    const mockSlotId = "doc-1";

    // Step 1: Get upload URL
    const uploadUrlResponse = await fetch(
      "http://localhost/api/documents/upload-url",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: mockFile.name,
          contentType: mockFile.type,
        }),
      }
    );

    expect(uploadUrlResponse.status).toBe(200);
    const uploadUrlData = await uploadUrlResponse.json();
    expect(uploadUrlData.url).toBeDefined();
    expect(uploadUrlData.key).toBeDefined();

    // Step 2: Create document record
    const createDocResponse = await fetch("http://localhost/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: mockFile.name,
        fileKey: uploadUrlData.key,
        fileSize: mockFile.size,
        mimeType: mockFile.type,
        slotId: mockSlotId,
      }),
    });

    expect(createDocResponse.status).toBe(200);
    const document = await createDocResponse.json();
    expect(document.id).toBeDefined();
    expect(document.slotId).toBe(mockSlotId);
    expect(document.name).toBe(mockFile.name);
    expect(document.fileKey).toBe(uploadUrlData.key);
  });

  it("should reject document creation with missing required fields", async () => {
    // Missing fileKey and mimeType
    const createDocResponse = await fetch("http://localhost/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "test.pdf",
        fileSize: 1024,
        slotId: "doc-1",
      }),
    });

    expect(createDocResponse.status).toBe(400);
    const errorData = await createDocResponse.json();
    expect(errorData.error.type).toBe("VALIDATION_ERROR");
    expect(errorData.error.details.missingFields).toContain("fileKey");
    expect(errorData.error.details.missingFields).toContain("mimeType");
  });
});
