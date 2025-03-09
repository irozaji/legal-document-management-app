/**
 * Types Module
 *
 * This module defines the core types used throughout the application.
 * It includes interfaces for documents, extractions, and related data structures.
 *
 * @module lib/types
 */

/**
 * Represents a document in the system
 */
export interface Document {
  /** Unique identifier for the document */
  id: string;
  /** Name of the document (typically the filename) */
  name: string;
  /** ISO date string of when the document was uploaded */
  uploadDate: string;
  /** URL to access the document file, or null if not available */
  fileUrl: string | null;
  /** Optional document content as a string, typically not used for PDFs */
  fileContent?: string | null;
}

/**
 * Represents a text extraction from a document
 */
export interface Extraction {
  /** Unique identifier for the extraction */
  id: string;
  /** The extracted text content */
  text: string;
  /** The page number where the extraction was found */
  pageNumber: number;
  /** Reference to the parent document ID */
  documentId: string;
}

/**
 * Maps slot IDs to documents
 * Used to track which document is in which slot in the dashboard
 * Keys are slot IDs (e.g., "doc-1"), values are Document objects or null if empty
 */
export type DocumentMap = Record<string, Document | null>;
