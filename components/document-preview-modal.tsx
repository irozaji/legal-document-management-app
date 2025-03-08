"use client";

import { useState } from "react";
import { Document as PDFDocument, Page, pdfjs } from "react-pdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Document, Extraction } from "@/lib/types";

// Set up the worker for react-pdf
if (typeof window !== "undefined") {
  // Use a direct import approach
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  extractions: Extraction[];
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  document,
  extractions,
}: DocumentPreviewModalProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= (numPages || 1)) {
      setPageNumber(page);
    }
  };

  console.log("document", document);

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
              {document.fileUrl && (
                <div className="flex justify-center p-4">
                  <PDFDocument
                    file={document.fileUrl}
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
                  >
                    <Page
                      pageNumber={pageNumber}
                      width={600}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </PDFDocument>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Extractions Panel */}
          <div className="w-100 border rounded-md">
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
        <div className="flex items-center justify-between border-t pt-4 mt-auto">
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
