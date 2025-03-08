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

// Set up the worker for react-pdf
if (typeof window !== "undefined") {
  setupPdfWorker();
}

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  extractions: Extraction[];
  fileUrl?: string | null;
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  document,
  extractions,
  fileUrl: externalFileUrl,
}: DocumentPreviewModalProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const { getDocumentFileUrl } = useDocuments();

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= (numPages || 1)) {
      setPageNumber(page);
    }
  };

  // Use external file URL if provided, otherwise generate one
  useEffect(() => {
    if (externalFileUrl) {
      setDocumentUrl(externalFileUrl);
      setIsLoading(false);
      return;
    }

    if (document) {
      setIsLoading(true);

      // If no external URL is provided, try to generate one from the document
      const url = getDocumentFileUrl(document.id);

      if (url) {
        setDocumentUrl(url);
        setIsLoading(false);
      } else {
        console.error("Failed to get document URL");
        setIsLoading(false);
      }
    }
  }, [document, getDocumentFileUrl, externalFileUrl]);

  if (!document) return null;

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
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <p>Loading PDF...</p>
                </div>
              ) : documentUrl ? (
                <div className="flex justify-center p-4 h-full">
                  <PDFDocument
                    file={documentUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                      <div className="flex items-center justify-center h-40">
                        <p>Loading PDF...</p>
                      </div>
                    }
                    error={
                      <div className="flex items-center justify-center h-40">
                        <p className="text-red-500">
                          Error loading PDF. Please try again.
                        </p>
                      </div>
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
              ) : (
                <div className="flex items-center justify-center h-40">
                  <p className="text-red-500">
                    Error loading PDF. Please try again.
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Extractions Panel */}
          <div className="w-80 border rounded-md">
            <div className="p-4 border-b">
              <h3 className="font-medium">Document Extractions</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {extractions.length} extractions found
              </p>
            </div>
            <ScrollArea className="h-[calc(90vh-12rem)]">
              <div className="p-4 space-y-4">
                {extractions.map((extraction) => (
                  <div
                    key={extraction.id}
                    className="p-3 border rounded-md bg-muted/30"
                  >
                    <p className="text-sm mb-2">{extraction.text}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Page {extraction.pageNumber}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(extraction.pageNumber)}
                      >
                        Go to Page
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center justify-between pt-4 mt-auto">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pageNumber - 1)}
              disabled={pageNumber <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pageNumber + 1)}
              disabled={pageNumber >= (numPages || 1)}
            >
              Next
            </Button>
          </div>
          <p className="text-sm">
            Page {pageNumber} of {numPages || "?"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
