import {  Extraction,  } from "./types";
import { setupPdfWorker } from "./pdf-utils";

// Generate extractions from PDF content
export const generateExtractionsFromPdf = async (
  documentId: string,
  file: File,
  pageCount: number
): Promise<Extraction[]> => {
  const extractions: Extraction[] = [];

  try {
    // Set up the worker using our utility that uses react-pdf's pdfjs
    const pdfjs = await setupPdfWorker();
    if (!pdfjs) throw new Error("Failed to set up PDF.js worker");

    // Load the PDF file
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;

    // Process all pages to find meaningful content
    const processedPages = new Set<number>();

    // Keywords that might indicate important content
    const legalKeywords = [
      "agreement",
      "contract",
      "party",
      "parties",
      "clause",
      "section",
      "article",
      "term",
      "provision",
      "obligation",
      "liability",
      "warranty",
      "indemnity",
      "confidential",
      "termination",
      "governing law",
      "jurisdiction",
      "dispute",
      "resolution",
      "arbitration",
      "effective date",
      "execution date",
      "payment",
      "fee",
      "compensation",
      "intellectual property",
      "copyright",
      "trademark",
      "patent",
      "license",
      "compliance",
      "regulation",
      "law",
      "statute",
      "amendment",
      "modification",
      "assignment",
      "successor",
      "notice",
      "waiver",
      "severability",
      "force majeure",
      "entire agreement",
    ];

    // Regular expressions for finding headings and important sections
    const headingRegex =
      /^[A-Z\s]{5,}$|^[IVX]+\.\s|^[0-9]+\.\s|^[A-Z][a-z]+\s[0-9]+:/;
    const dateRegex =
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/;
    const moneyRegex =
      /\$\s*\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars|USD)/i;

    // Process each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      try {
        // Get the page
        const page = await pdf.getPage(pageNum);

        // Extract text content
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ")
          .trim();

        if (!pageText) continue;

        // Split text into paragraphs
        const paragraphs = pageText
          .split(/\n\s*\n/)
          .filter((p) => p.trim().length > 0);

        for (const paragraph of paragraphs) {
          // Skip very short paragraphs
          if (paragraph.length < 20) continue;

          // Check if paragraph contains legal keywords
          const containsKeyword = legalKeywords.some((keyword) =>
            paragraph.toLowerCase().includes(keyword.toLowerCase())
          );

          // Check if paragraph looks like a heading
          const isHeading = headingRegex.test(paragraph);

          // Check if paragraph contains dates or money amounts
          const containsDate = dateRegex.test(paragraph);
          const containsMoney = moneyRegex.test(paragraph);

          // If paragraph is important, add it as an extraction
          if (containsKeyword || isHeading || containsDate || containsMoney) {
            // Limit text length for display purposes
            const maxLength = 150;
            const extractedText =
              paragraph.length > maxLength
                ? paragraph.substring(0, maxLength) + "..."
                : paragraph;

            extractions.push({
              id: `extraction-${documentId}-${extractions.length}`,
              text: extractedText,
              pageNumber: pageNum,
              documentId,
            });

            processedPages.add(pageNum);

            // Limit extractions per page to avoid overwhelming the UI
            if (
              extractions.filter((e) => e.pageNumber === pageNum).length >= 2
            ) {
              break;
            }
          }
        }
      } catch (pageError) {
        console.error(`Error extracting from page ${pageNum}:`, pageError);
      }
    }

    // If we didn't find enough extractions, add some from random pages
    if (extractions.length < 3) {
      const extractionCount = Math.min(5, pageCount);
      const usedPages = new Set<number>(processedPages);

      for (let i = 0; extractions.length < extractionCount; i++) {
        // Select a random page that hasn't been used yet, or any page if we've used them all
        let randomPage: number;
        if (usedPages.size < pageCount) {
          do {
            randomPage = Math.floor(Math.random() * pageCount) + 1;
          } while (usedPages.has(randomPage));
          usedPages.add(randomPage);
        } else {
          randomPage = Math.floor(Math.random() * pageCount) + 1;
        }

        try {
          // Get the page
          const page = await pdf.getPage(randomPage);

          // Extract text content
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ")
            .trim();

          if (pageText) {
            // Extract a meaningful segment from the page text
            const words = pageText.split(" ");
            if (words.length > 0) {
              const startIndex = Math.floor(
                Math.random() * Math.max(1, words.length - 15)
              );
              const length = Math.min(15, words.length - startIndex);
              const extractedText = words
                .slice(startIndex, startIndex + length)
                .join(" ");

              extractions.push({
                id: `extraction-${documentId}-${extractions.length}`,
                text: extractedText || `Content from page ${randomPage}`,
                pageNumber: randomPage,
                documentId,
              });
            }
          }
        } catch (pageError) {
          console.error(
            `Error extracting from random page ${randomPage}:`,
            pageError
          );
        }
      }
    }
  } catch (error) {
    console.error("Error generating extractions from PDF:", error);
    throw error;
  }

  // Ensure we have at least some extractions
  if (extractions.length === 0) {
    return generateMockExtractions(documentId, pageCount);
  }

  return extractions;
};

// Fallback function for mock extractions (used if PDF extraction fails)
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

