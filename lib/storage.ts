import { Document, DocumentMap, Extraction, ExtractionMap } from "./types";

const DOCUMENTS_KEY = "legal-documents";
const EXTRACTIONS_KEY = "document-extractions";

// Initialize documents in localStorage
export const initializeDocuments = (): DocumentMap => {
  if (typeof window === "undefined") return {};

  const storedDocuments = localStorage.getItem(DOCUMENTS_KEY);

  if (storedDocuments) {
    return JSON.parse(storedDocuments);
  }

  // Initialize with 9 empty document slots
  const initialDocuments: DocumentMap = {};
  for (let i = 1; i <= 9; i++) {
    initialDocuments[`doc-${i}`] = null;
  }

  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(initialDocuments));
  return initialDocuments;
};

// Save document to localStorage
export const saveDocument = (slotId: string, document: Document): void => {
  if (typeof window === "undefined") return;

  const documents = getDocuments();
  documents[slotId] = document;
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
};

// Get all documents from localStorage
export const getDocuments = (): DocumentMap => {
  if (typeof window === "undefined") return {};

  const storedDocuments = localStorage.getItem(DOCUMENTS_KEY);
  return storedDocuments ? JSON.parse(storedDocuments) : initializeDocuments();
};

// Generate mock extractions for a document
export const generateMockExtractions = (
  documentId: string,
  pageCount: number
): Extraction[] => {
  const extractionCount = Math.floor(Math.random() * 5) + 3; // 3-7 extractions
  const extractions: Extraction[] = [];

  const extractionTexts = [
    "Contract effective date: January 15, 2025",
    "Party A: Legal Corp International",
    "Party B: Global Enterprises Ltd.",
    "Payment terms: Net 30 days",
    "Jurisdiction: State of New York",
    "Confidentiality clause: Section 12.3",
    "Termination notice: 60 days",
    "Liability cap: $1,000,000",
    "Governing law: United States",
    "Dispute resolution: Arbitration",
    "Intellectual property rights: Section 8",
    "Force majeure clause: Section 15.2",
    "Amendment process: Written consent required",
    "Insurance requirements: $2,000,000 coverage",
    "Warranty period: 12 months",
  ];

  for (let i = 0; i < extractionCount; i++) {
    const randomPage = Math.floor(Math.random() * pageCount) + 1;
    const randomTextIndex = Math.floor(Math.random() * extractionTexts.length);

    extractions.push({
      id: `extraction-${documentId}-${i}`,
      text: extractionTexts[randomTextIndex],
      pageNumber: randomPage,
      documentId,
    });
  }

  return extractions;
};

// Save extractions to localStorage
export const saveExtractions = (
  documentId: string,
  extractions: Extraction[]
): void => {
  if (typeof window === "undefined") return;

  const allExtractions = getExtractions();
  allExtractions[documentId] = extractions;
  localStorage.setItem(EXTRACTIONS_KEY, JSON.stringify(allExtractions));
};

// Get all extractions from localStorage
export const getExtractions = (): ExtractionMap => {
  if (typeof window === "undefined") return {};

  const storedExtractions = localStorage.getItem(EXTRACTIONS_KEY);
  return storedExtractions ? JSON.parse(storedExtractions) : {};
};

// Get extractions for a specific document
export const getDocumentExtractions = (documentId: string): Extraction[] => {
  const allExtractions = getExtractions();
  return allExtractions[documentId] || [];
};
