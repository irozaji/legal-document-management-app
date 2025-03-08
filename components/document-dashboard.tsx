"use client";

import { useState, useEffect, useRef } from "react";
import { useDocuments } from "@/hooks/use-documents";
import { DocumentBox } from "@/components/document-box";
import { UploadModal } from "@/components/upload-modal";
import { DocumentPreviewModal } from "@/components/document-preview-modal";
import { toast } from "sonner";

export function DocumentDashboard() {
  const {
    documents,
    isLoaded,
    uploadDocument,
    getExtractions,
    getDocumentFileUrl,
  } = useDocuments();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );
  const [documentFileUrl, setDocumentFileUrl] = useState<string | null>(null);
  const uploadedFileRef = useRef<File | null>(null);

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
      console.log("Opening preview for document:", document);

      // Pre-generate the URL to ensure it's ready when the modal opens
      const url = getDocumentFileUrl(id);
      console.log("Pre-generated URL for preview:", url);
      setDocumentFileUrl(url);
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

      console.log("Created direct file URL:", directFileUrl);

      // uploadDocument now returns a Promise
      const document = await uploadDocument(
        selectedDocumentId,
        file,
        pageCount
      );
      console.log("Document uploaded:", document);
      toast.success("Document uploaded successfully");

      // Close the upload modal
      setUploadModalOpen(false);

      // Open the preview modal immediately with the direct file URL
      setPreviewModalOpen(true);
    } catch (error) {
      toast.error("Failed to upload document");
      console.error(error);
    }
  };

  // Get the selected document
  const selectedDocument = selectedDocumentId
    ? documents[selectedDocumentId]
    : null;

  // Get extractions for the selected document
  const extractions = selectedDocumentId
    ? getExtractions(selectedDocumentId)
    : [];

  // Generate document boxes
  const documentBoxes = [];
  for (let i = 1; i <= 9; i++) {
    const id = `doc-${i}`;
    documentBoxes.push(
      <DocumentBox
        key={id}
        id={id}
        document={documents[id] || null}
        onUploadClick={handleUploadClick}
        onPreviewClick={handlePreviewClick}
      />
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex items-center">
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M16 6H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h13" />
            <path d="M18 3v18" />
            <path d="M21 14l-3-3-3 3" />
          </svg>
          <h1 className="text-2xl font-bold">Legal Document Management</h1>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {documentBoxes}
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
