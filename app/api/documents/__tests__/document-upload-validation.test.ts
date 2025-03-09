import { server } from "./mocks/server";
import { http, HttpResponse } from "msw";

describe("Document Upload Validation", () => {
  it("should reject invalid file types", async () => {
    // Test with invalid file type (image/jpeg)
    const invalidTypeResponse = await fetch(
      "http://localhost/api/documents/upload-url",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: "invalid.jpg",
          contentType: "image/jpeg",
        }),
      }
    );

    expect(invalidTypeResponse.status).toBe(400);
    const invalidTypeError = await invalidTypeResponse.json();
    expect(invalidTypeError.error.type).toBe("VALIDATION_ERROR");
    expect(invalidTypeError.error.details.received).toBe("jpg");
    expect(invalidTypeError.error.details.allowedExtensions).toContain("pdf");
  });

  it("should reject missing required fields", async () => {
    // Test with missing required fields
    const missingFieldsResponse = await fetch(
      "http://localhost/api/documents/upload-url",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Missing fileName and contentType
        }),
      }
    );

    expect(missingFieldsResponse.status).toBe(400);
    const missingFieldsError = await missingFieldsResponse.json();
    expect(missingFieldsError.error.type).toBe("VALIDATION_ERROR");
    expect(missingFieldsError.error.details.missingFields).toBeDefined();
    expect(missingFieldsError.error.details.missingFields).toContain(
      "fileName"
    );
    expect(missingFieldsError.error.details.missingFields).toContain(
      "contentType"
    );
  });

  it("should accept valid PDF files", async () => {
    // Test with valid PDF file
    const validResponse = await fetch(
      "http://localhost/api/documents/upload-url",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: "valid.pdf",
          contentType: "application/pdf",
        }),
      }
    );

    expect(validResponse.status).toBe(200);
    const validData = await validResponse.json();
    expect(validData.url).toBeDefined();
    expect(validData.key).toBeDefined();
    expect(validData.expires).toBeDefined();
    expect(validData.maxFileSize).toBeDefined();
  });

  it("should handle custom expiration time", async () => {
    // Test with custom expiration time
    const customExpiryResponse = await fetch(
      "http://localhost/api/documents/upload-url",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: "valid.pdf",
          contentType: "application/pdf",
          expiresIn: 600, // 10 minutes
        }),
      }
    );

    expect(customExpiryResponse.status).toBe(200);
    const customExpiryData = await customExpiryResponse.json();

    // Get the expiration time as a Date object
    const expiresDate = new Date(customExpiryData.expires);
    const now = new Date();

    // Calculate the difference in seconds
    const diffSeconds = Math.round(
      (expiresDate.getTime() - now.getTime()) / 1000
    );

    // Should be close to 600 seconds (10 minutes)
    // Allow for a small margin of error due to test execution time
    expect(diffSeconds).toBeGreaterThan(590);
    expect(diffSeconds).toBeLessThan(610);
  });
});
