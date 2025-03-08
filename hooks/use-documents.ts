import { useState, useEffect, useCallback } from "react";
import { Document, DocumentMap, Extraction } from "@/lib/types";
import {
  getDocuments,
  saveDocument,
  getDocumentExtractions,
  generateMockExtractions,
  generateExtractionsFromPdf,
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

      reader.onload = async (e) => {
        const base64Content = e.target?.result as string;

        // Create final document object with base64 content
        const finalDocument: Document = {
          ...tempDocument,
          fileContent: base64Content,
        };

        // Update state with final document
        setDocuments((prev) => {
          const updatedDocuments = {
            ...prev,
            [slotId]: finalDocument,
          };
          return updatedDocuments;
        });

        // Save to localStorage
        saveDocument(slotId, finalDocument);

        // Generate and save real extractions from the PDF
        try {
          const extractions = await generateExtractionsFromPdf(slotId, file, pageCount);
          saveExtractions(slotId, extractions);
        } catch (error) {
          console.error("Error generating real extractions, falling back to mock data:", error);
          // Fallback to mock extractions if real extraction fails
          const mockExtractions = generateMockExtractions(slotId, pageCount);
          saveExtractions(slotId, mockExtractions);
        }


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

      if (!document) {
        return null;
      }

      if (!document.fileContent) {
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
        return url;
      } catch (error) {
        console.error("Error creating blob URL:", error);
        // Fallback to the original fileUrl if available
        return document.fileUrl;
      }
    },
    [documents]
  );

  // Get extractions for a document
  const getExtractions = useCallback((documentId: string): Extraction[] => {
    const extractions = getDocumentExtractions(documentId);
    return extractions;
  }, []);

  return {
    documents,
    isLoaded,
    uploadDocument,
    getExtractions,
    getDocumentFileUrl,
  };
}
