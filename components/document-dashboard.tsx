"use client";

import { useState, useEffect, useRef } from "react";
import { useDocuments } from "@/hooks/use-documents";
import { DocumentBox } from "@/components/document-box";
import { UploadModal } from "@/components/upload-modal";
import { DocumentPreviewModal } from "@/components/document-preview-modal";
import { toast } from "sonner";
import { Extraction } from "@/lib/types";

export function DocumentDashboard() {
  const { documents, uploadDocument, getExtractions, getDocumentFileUrl } =
    useDocuments();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );
  const [documentFileUrl, setDocumentFileUrl] = useState<string | null>(null);
  const uploadedFileRef = useRef<File | null>(null);
  const [extractions, setExtractions] = useState<Extraction[]>([]);

  // Handle document upload
  const handleUploadClick = (id: string) => {
    setSelectedDocumentId(id);
    setUploadModalOpen(true);
  };

  // Handle document preview
  const handlePreviewClick = (id: string) => {
    // Ensure we have the latest document data
    const document = documents[id];

    if (document) {
      // Pre-generate the URL to ensure it's ready when the modal opens
      const url = getDocumentFileUrl(id);
      setDocumentFileUrl(url);

      // Get the latest extractions for this document
      const documentExtractions = getExtractions(id);

      setExtractions(documentExtractions);
    }

    setSelectedDocumentId(id);
    setPreviewModalOpen(true);
  };

  // Handle file upload
  const handleFileUpload = async (file: File, pageCount: number) => {
    if (!selectedDocumentId) return;

    try {
      // Store the file reference for direct URL creation
      uploadedFileRef.current = file;

      // Create a direct URL for the file
      const directFileUrl = URL.createObjectURL(file);
      setDocumentFileUrl(directFileUrl);

      // Show loading toast
      const loadingToast = toast.loading(
        "Processing document and extracting content..."
      );

      // uploadDocument now returns a Promise
      await uploadDocument(selectedDocumentId, file, pageCount);

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Document uploaded and processed successfully");

      // Get the updated extractions for the document
      const updatedExtractions = getExtractions(selectedDocumentId);
      setExtractions(updatedExtractions);

      // Close the upload modal
      setUploadModalOpen(false);

      // Open the preview modal immediately with the direct file URL
      setPreviewModalOpen(true);
    } catch (error) {
      toast.error("Failed to upload document", {
        description:
          "There was an error processing your document. Please try again.",
      });
      console.error("Document upload error:", error);
    }
  };

  // Get the selected document
  const selectedDocument = selectedDocumentId
    ? documents[selectedDocumentId]
    : null;

  // Update extractions when selectedDocumentId changes
  useEffect(() => {
    if (selectedDocumentId) {
      const documentExtractions = getExtractions(selectedDocumentId);

      setExtractions(documentExtractions);
    } else {
      setExtractions([]);
    }
  }, [selectedDocumentId]);

  // Generate document boxes
  const documentBoxes = [];
  for (let i = 1; i <= 9; i++) {
    const id = `doc-${i}`;
    const title = `Legal Document ${i}`;
    documentBoxes.push(
      <DocumentBox
        key={id}
        id={id}
        title={title}
        document={documents[id] || null}
        onUploadClick={handleUploadClick}
        onPreviewClick={handlePreviewClick}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-lg shadow-sm">
        <div className="flex items-center">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg mr-3 shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
              <path d="M10 9H8" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Legal Document Management
            </h1>
            <p className="text-sm text-slate-500">
              Manage and organize your legal documents
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap -mx-3">
        {documentBoxes.map((box, index) => (
          <div
            key={`box-wrapper-${index}`}
            className="w-full sm:w-1/2 md:w-1/3 p-3 transition-all"
          >
            {box}
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleFileUpload}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        document={selectedDocument}
        extractions={extractions}
        fileUrl={documentFileUrl}
      />
    </div>
  );
}
