/**
 * PDF Utilities
 * 
 * This file centralizes PDF.js configuration to ensure consistent worker versions
 * across the application.
 */

import { pdfjs } from 'react-pdf';

// We're using the version that comes with react-pdf
export const PDFJS_VERSION = pdfjs.version;

/**
 * Sets up the PDF.js worker with a consistent version
 */
export const setupPdfWorker = async () => {
  if (typeof window === "undefined") return;
  
  // Use the pdfjs instance from react-pdf
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
  return pdfjs;
};

/**
 * Gets the page count from a PDF file
 */
export const getPdfPageCount = async (file: File): Promise<number> => {
  await setupPdfWorker();
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument(arrayBuffer).promise;
  return pdf.numPages;
}; 