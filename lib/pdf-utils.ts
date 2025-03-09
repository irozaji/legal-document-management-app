/**
 * PDF Utilities Module
 *
 * This module provides utilities for working with PDF files using PDF.js.
 * It centralizes PDF.js configuration to ensure consistent worker versions
 * across the application and provides helper functions for common PDF operations.
 *
 * @module lib/pdf-utils
 */

import { pdfjs } from "react-pdf";

/**
 * The version of PDF.js being used (from react-pdf)
 * This ensures we use a consistent version throughout the application
 */
export const PDFJS_VERSION = pdfjs.version;

/**
 * Sets up the PDF.js worker with a consistent version
 * This must be called before using any PDF.js functionality
 *
 * @returns The pdfjs instance if setup was successful, undefined if running on server
 */
export const setupPdfWorker = async (): Promise<typeof pdfjs | undefined> => {
  // Skip setup if running on the server
  if (typeof window === "undefined") return;

  try {
    // Use the pdfjs instance from react-pdf
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
    return pdfjs;
  } catch (error) {
    console.error("Error setting up PDF.js worker:", error);
    throw new Error("Failed to set up PDF.js worker");
  }
};

/**
 * Gets the page count from a PDF file
 *
 * @param file - The PDF file to get the page count from
 * @returns A promise that resolves to the number of pages in the PDF
 * @throws Error if the PDF cannot be loaded or processed
 */
export const getPdfPageCount = async (file: File): Promise<number> => {
  try {
    await setupPdfWorker();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    return pdf.numPages;
  } catch (error) {
    console.error("Error getting PDF page count:", error);
    throw new Error("Failed to get PDF page count");
  }
};
