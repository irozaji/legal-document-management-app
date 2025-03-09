"use client";

import { useState, useEffect } from "react";
import { Document as PDFDocument, Page } from "react-pdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Document, Extraction } from "@/lib/types";
import { useDocuments } from "@/hooks/use-documents";
import { setupPdfWorker } from "@/lib/pdf-utils";
import { toast } from "sonner";

// Set up the worker for react-pdf
if (typeof window !== "undefined") {
  setupPdfWorker();
}

// Component Types
interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  extractions: Extraction[];
  fileUrl?: string | null;
  isLoadingExtractions?: boolean;
  isLoadingDocument?: boolean;
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message: string;
  subMessage?: string;
}

interface ErrorMessageProps {
  message: string;
  subMessage?: string;
}

interface PdfViewerProps {
  documentUrl: string | null;
  pageNumber: number;
  onDocumentLoadSuccess: (data: { numPages: number }) => void;
}

interface ExtractionsListProps {
  extractions: Extraction[];
  isLoading: boolean;
  onGoToPage: (page: number) => void;
}

interface PaginationControlsProps {
  pageNumber: number;
  numPages: number | null;
  isDisabled: boolean;
  onPageChange: (page: number) => void;
}

// Reusable Components
const LoadingSpinner = ({
  size = "md",
  message,
  subMessage,
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
      <div className={`relative ${sizeClasses[size]} mb-4`}>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-muted-foreground/20 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-muted-foreground font-medium">{message}</p>
      {subMessage && (
        <p className="text-xs text-muted-foreground/70 mt-2">{subMessage}</p>
      )}
    </div>
  );
};

const ErrorMessage = ({ message, subMessage }: ErrorMessageProps) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
    <div className="w-16 h-16 mb-4 flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-destructive"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
    <p className="text-destructive font-medium">{message}</p>
    {subMessage && (
      <p className="text-xs text-muted-foreground/70 mt-2 text-center">
        {subMessage}
      </p>
    )}
  </div>
);

const PdfViewer = ({
  documentUrl,
  pageNumber,
  onDocumentLoadSuccess,
}: PdfViewerProps) => {
  if (!documentUrl) return null;

  return (
    <div className="flex justify-center p-4 h-full">
      <PDFDocument
        file={documentUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <LoadingSpinner
            message="Loading document..."
            subMessage={`Preparing page ${pageNumber}`}
          />
        }
        error={
          <ErrorMessage
            message="Error loading document"
            subMessage="The document could not be loaded. Please try again or contact support if the issue persists."
          />
        }
        className="max-h-full"
      >
        <Page
          pageNumber={pageNumber}
          width={800}
          scale={1.2}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="max-w-full"
        />
      </PDFDocument>
    </div>
  );
};

const EmptyExtractions = () => (
  <div className="flex flex-col items-center justify-center h-40 p-4">
    <div className="w-10 h-10 mb-3 flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted-foreground/50"
      >
        <rect width="8" height="14" x="8" y="5" rx="1" />
        <path d="M4 5v14" />
        <path d="M20 5v14" />
      </svg>
    </div>
    <p className="text-sm text-muted-foreground">No extractions found</p>
    <p className="text-xs text-muted-foreground/70 mt-1 text-center">
      This document has no text extractions yet
    </p>
  </div>
);

const ExtractionsList = ({
  extractions,
  isLoading,
  onGoToPage,
}: ExtractionsListProps) => (
  <div className="p-4 space-y-4">
    {isLoading ? (
      <LoadingSpinner size="sm" message="Loading extractions..." />
    ) : extractions.length > 0 ? (
      extractions.map((extraction) => (
        <div key={extraction.id} className="p-3 border rounded-md bg-muted/30">
          <p className="text-sm mb-2">{extraction.text}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Page {extraction.pageNumber}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGoToPage(extraction.pageNumber)}
            >
              Go to Page
            </Button>
          </div>
        </div>
      ))
    ) : (
      <EmptyExtractions />
    )}
  </div>
);

const PaginationControls = ({
  pageNumber,
  numPages,
  isDisabled,
  onPageChange,
}: PaginationControlsProps) => (
  <div className="flex items-center justify-between pt-4 mt-auto">
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(pageNumber - 1)}
        disabled={pageNumber <= 1 || isDisabled}
      >
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(pageNumber + 1)}
        disabled={pageNumber >= (numPages || 1) || isDisabled}
      >
        Next
      </Button>
    </div>
    <p className="text-sm ml-4">
      Page {pageNumber} of {numPages || "?"}
    </p>
  </div>
);

// Custom hook for document URL management
function useDocumentUrl(
  document: Document | null,
  externalFileUrl: string | null | undefined,
  isOpen: boolean
) {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { getDocumentFileUrl } = useDocuments();

  useEffect(() => {
    // Only fetch URL if the modal is open
    if (!isOpen) {
      return;
    }

    if (externalFileUrl) {
      setDocumentUrl(externalFileUrl);
      setIsLoading(false);
      return;
    }

    if (document) {
      setIsLoading(true);

      const fetchDocumentUrl = async () => {
        try {
          const url = await getDocumentFileUrl(document.id);
          if (url) {
            setDocumentUrl(url);
          } else {
            console.error("Failed to get document URL");
          }
        } catch (error) {
          console.error("Error getting document URL:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchDocumentUrl();
    }
  }, [document, getDocumentFileUrl, externalFileUrl, isOpen]);

  return { documentUrl, isLoading };
}

// Main Component
export function DocumentPreviewModal({
  isOpen,
  onClose,
  document,
  extractions,
  fileUrl: externalFileUrl,
  isLoadingExtractions = false,
  isLoadingDocument = false,
}: DocumentPreviewModalProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const { documentUrl, isLoading } = useDocumentUrl(
    document,
    externalFileUrl,
    isOpen
  );

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= (numPages || 1)) {
      setPageNumber(page);
    }
  };

  if (!document) return null;

  const isDocumentLoading = isLoading || isLoadingDocument;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1440px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{document.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 gap-4 mt-4 h-full overflow-hidden">
          {/* PDF Viewer */}
          <div className="flex-grow border rounded-md overflow-hidden">
            <ScrollArea className="h-full w-full">
              {isDocumentLoading ? (
                <LoadingSpinner
                  message="Loading document..."
                  subMessage="This may take a moment depending on file size"
                />
              ) : documentUrl ? (
                <PdfViewer
                  documentUrl={documentUrl}
                  pageNumber={pageNumber}
                  onDocumentLoadSuccess={onDocumentLoadSuccess}
                />
              ) : (
                <ErrorMessage
                  message="Error loading document"
                  subMessage="The document could not be loaded. Please try again or contact support if the issue persists."
                />
              )}
            </ScrollArea>
          </div>

          {/* Extractions Panel */}
          <div className="w-80 border rounded-md">
            <div className="p-4 border-b">
              <h3 className="font-medium">Document Extractions</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isLoadingExtractions
                  ? "Loading extractions..."
                  : `${extractions.length} extractions found`}
              </p>
            </div>
            <ScrollArea className="h-[calc(90vh-12rem)]">
              <ExtractionsList
                extractions={extractions}
                isLoading={isLoadingExtractions}
                onGoToPage={goToPage}
              />
            </ScrollArea>
          </div>
        </div>

        {/* Page Navigation */}
        <div className="flex justify-between items-center">
          <PaginationControls
            pageNumber={pageNumber}
            numPages={numPages}
            isDisabled={isDocumentLoading}
            onPageChange={goToPage}
          />

          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={async () => {
              if (documentUrl) {
                try {
                  // Show loading toast
                  const loadingToast = toast.loading("Preparing download...");
                  console.log("documentUrl", documentUrl);
                  // Fetch the file from the pre-signed URL
                  const response = await fetch(documentUrl);

                  if (!response.ok) {
                    throw new Error(
                      `Failed to download: ${response.statusText}`
                    );
                  }

                  // Get the file as a blob
                  const blob = await response.blob();

                  // Create a blob URL
                  const blobUrl = URL.createObjectURL(blob);

                  // Create a temporary anchor element to trigger the download
                  const link = window.document.createElement("a");
                  link.href = blobUrl;
                  link.download = document?.name || "document.pdf";
                  link.style.display = "none";

                  // Append to the document, click it, and remove it
                  window.document.body.appendChild(link);
                  link.click();
                  window.document.body.removeChild(link);

                  // Clean up the blob URL
                  URL.revokeObjectURL(blobUrl);

                  // Dismiss loading toast and show success
                  toast.dismiss(loadingToast);
                  toast.success("Download complete");
                } catch (error) {
                  console.error("Download error:", error);
                  toast.error("Download failed, please try again");
                }
              } else {
                toast.error("Document not available for download");
              }
            }}
            disabled={isDocumentLoading || !documentUrl}
          >
            {isDocumentLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-muted-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
