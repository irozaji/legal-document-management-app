/**
 * Document Management Hook
 *
 * This hook provides functionality for managing documents in the application.
 * It handles loading, uploading, retrieving, and deleting documents.
 *
 * @module hooks/use-documents
 */

import { useState, useEffect, useCallback } from "react";
import { Document, DocumentMap, Extraction } from "@/lib/types";
import { toast } from "sonner";
import { generateExtractionsFromPdf } from "@/lib/storage";

/**
 * Interface for the return value of the useDocuments hook
 */
interface UseDocumentsReturn {
  documents: DocumentMap;
  isLoaded: boolean;
  isLoading: boolean;
  uploadDocument: (
    slotId: string,
    file: File,
    pageCount: number
  ) => Promise<Document | null>;
  getExtractions: (documentId: string) => Promise<Extraction[]>;
  getDocumentFileUrl: (documentId: string) => Promise<string | null>;
  deleteDocument: (documentId: string) => Promise<boolean>;
}

/**
 * Hook for managing documents in the application
 * @returns Object with document state and methods for document operations
 */
export function useDocuments(): UseDocumentsReturn {
  const [documents, setDocuments] = useState<DocumentMap>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});

  /**
   * Loads documents from the API on component mount
   */
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/documents");

        if (!response.ok) {
          throw new Error("Failed to fetch documents");
        }

        const data = await response.json();

        // Convert array to DocumentMap format
        const documentMap: DocumentMap = {};

        // Initialize with 9 empty document slots
        for (let i = 1; i <= 9; i++) {
          documentMap[`doc-${i}`] = null;
        }

        // Fill in the slots with actual documents
        data.forEach((doc: any) => {
          if (doc.slotId) {
            documentMap[doc.slotId] = {
              id: doc.id,
              name: doc.name,
              uploadDate: doc.uploadDate,
              fileUrl: doc.fileUrl,
              fileContent: null, // We don't store file content anymore
            };
          }
        });

        setDocuments(documentMap);
      } catch (error) {
        console.error("Error fetching documents:", error);
        toast.error("Failed to load documents");
      } finally {
        setIsLoading(false);
        setIsLoaded(true);
      }
    };

    fetchDocuments();
  }, []);

  /**
   * Uploads a document to a specific slot
   * @param slotId - The slot ID to upload the document to
   * @param file - The file to upload
   * @param pageCount - The number of pages in the document
   * @returns The uploaded document or null if upload failed
   */
  const uploadDocument = useCallback(
    async (
      slotId: string,
      file: File,
      pageCount: number
    ): Promise<Document | null> => {
      try {
        // Create a temporary URL for immediate use
        const tempFileUrl = URL.createObjectURL(file);

        // Create a temporary document object for immediate UI update
        const tempDocument: Document = {
          id: slotId,
          name: file.name,
          uploadDate: new Date().toISOString(),
          fileContent: null,
          fileUrl: tempFileUrl,
        };

        // Update state with temporary document for immediate feedback
        setDocuments((prev) => ({
          ...prev,
          [slotId]: tempDocument,
        }));

        // Get a pre-signed URL for S3 upload
        const presignedUrlResponse = await fetch("/api/documents/upload-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size, // Include file size for backend validation
          }),
        });

        if (!presignedUrlResponse.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { url: presignedUrl, key: fileKey } =
          await presignedUrlResponse.json();

        // Upload the file directly to S3 using the pre-signed URL
        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file to S3");
        }

        // Create a document record in the database
        const createDocumentResponse = await fetch("/api/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: file.name,
            fileKey,
            fileSize: file.size,
            mimeType: file.type,
            slotId,
          }),
        });

        if (!createDocumentResponse.ok) {
          throw new Error("Failed to create document record");
        }

        const documentData = await createDocumentResponse.json();

        // Generate extractions from the PDF
        const extractions = await generateExtractionsFromPdf(
          documentData.id,
          file,
          pageCount
        );

        // Save extractions to the database
        const saveExtractionsResponse = await fetch(
          `/api/documents/${documentData.id}/extractions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              extractions,
            }),
          }
        );

        if (!saveExtractionsResponse.ok) {
          throw new Error("Failed to save extractions");
        }

        // Update the documents state with the final document
        const finalDocument: Document = {
          id: documentData.id,
          name: documentData.name,
          uploadDate: documentData.uploadDate,
          fileUrl: documentData.fileUrl,
          fileContent: null,
        };

        // Update the documents state and wait for it to complete
        setDocuments((prev) => {
          const updatedDocs = {
            ...prev,
            [slotId]: finalDocument,
          };

          return updatedDocs;
        });

        // Return the final document with the actual database ID
        return finalDocument;
      } catch (error) {
        console.error("Error uploading document:", error);
        toast.error("Failed to upload document");
        throw error;
      }
    },
    []
  );

  /**
   * Gets a valid file URL for a document
   * @param documentId - The document ID or slot ID
   * @returns The document file URL or null if not found
   */
  const getDocumentFileUrl = useCallback(
    async (documentId: string): Promise<string | null> => {
      try {
        // Check if we already have a cached URL for this document
        if (documentUrls[documentId]) {
          return documentUrls[documentId];
        }

        let actualDocumentId = documentId;
        let cacheKey = documentId;

        // If this is a slot ID (e.g., "doc-1"), find the document and use its actual ID
        if (documentId.startsWith("doc-")) {
          const document = documents[documentId];
          if (!document) {
            console.log(
              `No document found for slot ${documentId}, cannot get URL`
            );
            return null;
          }
          actualDocumentId = document.id;
        } else {
          // If this is not a slot ID, it's likely a direct document ID
          // We need to find which slot contains this document for caching
          let foundSlot = null;
          for (const [slot, doc] of Object.entries(documents)) {
            if (doc && doc.id === documentId) {
              foundSlot = slot;
              break;
            }
          }

          // If we found a slot, use it as the cache key
          if (foundSlot) {
            cacheKey = foundSlot;
          }

          // We found a slot for this document ID
        }

        // Get a pre-signed URL for viewing the document
        const response = await fetch(
          `/api/documents/${actualDocumentId}/download-url`
        );

        if (!response.ok) {
          throw new Error("Failed to get document download URL");
        }

        const { url } = await response.json();

        // Cache the URL
        setDocumentUrls((prev) => ({
          ...prev,
          [cacheKey]: url,
        }));

        return url;
      } catch (error) {
        console.error("Error getting document file URL:", error);
        return null;
      }
    },
    [documents, documentUrls]
  );

  /**
   * Gets extractions for a document
   * @param documentId - The document ID or slot ID
   * @returns Array of extractions for the document
   */
  const getExtractions = useCallback(
    async (documentId: string): Promise<Extraction[]> => {
      try {
        // Find the document in our local state to get the actual document ID
        let actualDocumentId = documentId;

        // If documentId is a slot ID (e.g., "doc-1"), find the actual document ID
        if (documentId.startsWith("doc-")) {
          const document = documents[documentId];
          if (!document) {
            console.log(
              `No document found for slot ${documentId}, returning empty extractions`
            );
            return [];
          }

          // Make sure we're using the actual document ID from the database, not the slot ID
          actualDocumentId = document.id;

          // Additional check to ensure we're not using a slot ID as the actual document ID
          if (actualDocumentId.startsWith("doc-")) {
            console.warn(
              `Document ID still appears to be a slot ID: ${actualDocumentId}. This may indicate a data issue.`
            );
            return [];
          }
        } else {
          // If this is not a slot ID, it's likely a direct document ID
          // Check if this document ID exists in our documents state
          let documentExists = false;
          for (const doc of Object.values(documents)) {
            if (doc && doc.id === documentId) {
              documentExists = true;
              break;
            }
          }

          // Log for debugging
          if (!documentExists) {
            console.log(
              `Using direct document ID: ${actualDocumentId} (not found in documents state)`
            );
          } else {
            console.log(
              `Using direct document ID: ${actualDocumentId} (found in documents state)`
            );
          }
        }

        console.log(
          `Fetching extractions for document ID: ${actualDocumentId}`
        );

        const response = await fetch(
          `/api/documents/${actualDocumentId}/extractions`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch extractions");
        }

        const extractions = await response.json();
        return extractions;
      } catch (error) {
        console.error("Error fetching extractions:", error);
        throw error; // Re-throw to allow proper error handling upstream
      }
    },
    [documents]
  );

  /**
   * Deletes a document
   * @param documentId - The document ID or slot ID
   * @returns True if deletion was successful, false otherwise
   */
  const deleteDocument = useCallback(
    async (documentId: string): Promise<boolean> => {
      try {
        // Find the document in our local state to get the actual document ID
        let actualDocumentId = documentId;
        let slotId = documentId;

        // If documentId is a slot ID (e.g., "doc-1"), find the actual document ID
        if (documentId.startsWith("doc-")) {
          const document = documents[documentId];
          if (!document) {
            console.log(
              `No document found for slot ${documentId}, cannot delete`
            );
            return false;
          }

          // Make sure we're using the actual document ID from the database, not the slot ID
          actualDocumentId = document.id;
        } else {
          // If this is not a slot ID, it's likely a direct document ID
          // We need to find which slot contains this document
          for (const [slot, doc] of Object.entries(documents)) {
            if (doc && doc.id === documentId) {
              slotId = slot;
              break;
            }
          }
        }

        console.log(`Deleting document with ID: ${actualDocumentId}`);

        // Call the delete API endpoint
        const response = await fetch(`/api/documents/${actualDocumentId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete document");
        }

        // Update the documents state to remove the deleted document
        setDocuments((prev) => ({
          ...prev,
          [slotId]: null,
        }));

        // Remove any cached URLs for this document
        setDocumentUrls((prev) => {
          const updated = { ...prev };
          delete updated[slotId];
          return updated;
        });

        return true;
      } catch (error) {
        console.error("Error deleting document:", error);
        throw error;
      }
    },
    [documents]
  );

  return {
    documents,
    isLoaded,
    isLoading,
    uploadDocument,
    getExtractions,
    getDocumentFileUrl,
    deleteDocument,
  };
}
