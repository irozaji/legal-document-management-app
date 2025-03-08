import { useState, useEffect } from "react";
import { Document, DocumentMap, Extraction } from "@/lib/types";
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
    // Create a URL for the file
    const fileUrl = URL.createObjectURL(file);

    // Create document object
    const document: Document = {
      id: slotId,
      name: file.name,
      uploadDate: new Date().toISOString(),
      fileUrl,
    };

    // Update state
    setDocuments((prev) => ({
      ...prev,
      [slotId]: document,
    }));

    // Save to localStorage
    saveDocument(slotId, document);

    // Generate and save mock extractions
    const extractions = generateMockExtractions(slotId, pageCount);
    saveExtractions(slotId, extractions);

    return document;
  };

  // Get extractions for a document
  const getExtractions = (documentId: string): Extraction[] => {
    return getDocumentExtractions(documentId);
  };

  return {
    documents,
    isLoaded,
    uploadDocument,
    getExtractions,
  };
}
