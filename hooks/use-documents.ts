import { useState, useEffect } from "react";
import { Document, DocumentMap, Extraction } from "@/lib/types";
import { useCallback } from "react";
import {
  getDocuments,
  saveDocument,
  getDocumentExtractions,
  generateMockExtractions,
  saveExtractions,
} from "@/lib/storage";

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentMap>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load documents from localStorage on component mount
  useEffect(() => {
    const loadedDocuments = getDocuments();
    setDocuments(loadedDocuments);
    setIsLoaded(true);
  }, []);

  // Upload a document to a specific slot
  const uploadDocument = (slotId: string, file: File, pageCount: number) => {
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

    // Update state with temporary document
    setDocuments((prev) => ({
      ...prev,
      [slotId]: tempDocument,
    }));

    // Create a promise that resolves when the file is read
    return new Promise<Document>((resolve) => {
      // Read the file as base64 and store it
      const reader = new FileReader();

      reader.onload = (e) => {
        const base64Content = e.target?.result as string;

        // Create final document object with base64 content
        const finalDocument: Document = {
          ...tempDocument,
          fileContent: base64Content,
        };

        console.log("File read complete, updating document with content");

        // Update state with final document
        setDocuments((prev) => {
          const updatedDocuments = {
            ...prev,
            [slotId]: finalDocument,
          };
          console.log("Updated documents state:", updatedDocuments);
          return updatedDocuments;
        });

        // Save to localStorage
        saveDocument(slotId, finalDocument);

        // Generate and save mock extractions
        const extractions = generateMockExtractions(slotId, pageCount);
        saveExtractions(slotId, extractions);

        console.log("Document fully processed with content:", finalDocument);

        // Resolve the promise with the final document
        resolve(finalDocument);
      };

      reader.readAsDataURL(file);
    });
  };

  // Get a valid file URL for a document
  const getDocumentFileUrl = useCallback(
    (documentId: string): string | null => {
      const document = documents[documentId];
      console.log("Getting URL for document:", documentId, document);

      if (!document) {
        console.log("Document not found");
        return null;
      }

      if (!document.fileContent) {
        console.log(
          "Document has no fileContent, using existing fileUrl:",
          document.fileUrl
        );
        return document.fileUrl;
      }

      // Convert base64 content back to blob and create URL
      try {
        // For PDF files stored as base64 data URLs
        const base64Response = document.fileContent;
        const contentType = base64Response.split(";")[0].split(":")[1];
        const base64Data = base64Response.split(",")[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: contentType });
        const url = URL.createObjectURL(blob);
        console.log("Created new blob URL:", url);
        return url;
      } catch (error) {
        console.error("Error creating blob URL:", error);
        // Fallback to the original fileUrl if available
        console.log("Falling back to original fileUrl:", document.fileUrl);
        return document.fileUrl;
      }
    },
    [documents]
  );

  // Get extractions for a document
  const getExtractions = (documentId: string): Extraction[] => {
    return getDocumentExtractions(documentId);
  };

  return {
    documents,
    isLoaded,
    uploadDocument,
    getExtractions,
    getDocumentFileUrl,
  };
}
