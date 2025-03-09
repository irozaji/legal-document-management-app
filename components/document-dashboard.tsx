/**
 * Document Dashboard Component
 *
 * This is the main component for the document management dashboard.
 * It displays a grid of document boxes and handles document operations
 * like upload, preview, and deletion.
 *
 * @module components/document-dashboard
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useDocuments } from "@/hooks/use-documents";
import { DocumentBox } from "@/components/document-box";
import { UploadModal } from "@/components/upload-modal";
import { DocumentPreviewModal } from "@/components/document-preview-modal";
import { toast } from "sonner";
import { Document, Extraction } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Interface for the document dashboard state
 */
interface DocumentDashboardState {
  uploadModalOpen: boolean;
  previewModalOpen: boolean;
  deleteDialogOpen: boolean;
  selectedDocumentId: string | null;
  documentFileUrl: string | null;
  extractions: Extraction[];
  isLoadingExtractions: boolean;
  isLoadingDocument: boolean;
  deletingDocumentId: string | null;
}

export function DocumentDashboard() {
  const {
    documents,
    isLoading,
    uploadDocument,
    getExtractions,
    getDocumentFileUrl,
    deleteDocument,
  } = useDocuments();

  // State management using a more organized approach
  const [state, setState] = useState<DocumentDashboardState>({
    uploadModalOpen: false,
    previewModalOpen: false,
    deleteDialogOpen: false,
    selectedDocumentId: null,
    documentFileUrl: null,
    extractions: [],
    isLoadingExtractions: false,
    isLoadingDocument: false,
    deletingDocumentId: null,
  });

  /**
   * Updates a specific field in the state
   * @param field - The field to update
   * @param value - The new value
   */
  const updateState = <K extends keyof DocumentDashboardState>(
    field: K,
    value: DocumentDashboardState[K]
  ) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Updates multiple fields in the state
   * @param updates - Object containing the fields to update
   */
  const updateMultipleState = (updates: Partial<DocumentDashboardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  /**
   * Handles clicking on an empty document box to open the upload modal
   * @param id - The document ID
   */
  const handleUploadClick = useCallback((id: string) => {
    updateMultipleState({
      selectedDocumentId: id,
      uploadModalOpen: true,
    });
  }, []);

  /**
   * Handles clicking the delete button on a document box
   * @param id - The document ID
   */
  const handleDeleteClick = useCallback((id: string) => {
    updateMultipleState({
      selectedDocumentId: id,
      deleteDialogOpen: true,
    });
  }, []);

  /**
   * Confirms document deletion and handles the delete process
   */
  const confirmDelete = useCallback(async () => {
    const { selectedDocumentId } = state;
    if (!selectedDocumentId) return;

    try {
      // Set the deleting document ID to show loading state in the UI
      updateState("deletingDocumentId", selectedDocumentId);

      // Delete the document
      const success = await deleteDocument(selectedDocumentId);

      if (success) {
        toast.success("Document deleted successfully");
      } else {
        toast.error("Failed to delete document");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document", {
        description:
          "There was an error deleting your document. Please try again.",
      });
    } finally {
      // Clear the deleting document ID and close the dialog
      updateMultipleState({
        deletingDocumentId: null,
        deleteDialogOpen: false,
      });
    }
  }, [state.selectedDocumentId, deleteDocument]);

  /**
   * Handles clicking on a document box to preview the document
   * @param id - The document ID
   */
  const handlePreviewClick = useCallback(
    async (id: string) => {
      // Ensure we have the latest document data
      const document = documents[id];

      // Set the selected document ID and open the modal regardless
      // This allows the modal to show even for empty slots
      updateMultipleState({
        selectedDocumentId: id,
        previewModalOpen: true,
        isLoadingDocument: !!document,
        isLoadingExtractions: !!document,
      });

      if (document) {
        try {
          // Pre-generate the URL to ensure it's ready when the modal opens
          const url = await getDocumentFileUrl(id);
          updateState("documentFileUrl", url);
        } catch (error) {
          console.error("Error getting document URL:", error);
          toast.error("Failed to load document");
        } finally {
          updateState("isLoadingDocument", false);
        }

        try {
          // Get the latest extractions for this document
          const documentExtractions = await getExtractions(id);
          updateState("extractions", documentExtractions);
        } catch (error) {
          console.error("Error fetching extractions:", error);
          toast.error("Failed to load document extractions");
          updateState("extractions", []);
        } finally {
          updateState("isLoadingExtractions", false);
        }
      } else {
        // Clear extractions and document URL for empty slots
        updateMultipleState({
          extractions: [],
          documentFileUrl: null,
        });
      }
    },
    [documents, getDocumentFileUrl, getExtractions]
  );

  /**
   * Handles file upload and processes the document
   * @param file - The file to upload
   * @param pageCount - The number of pages in the document
   */
  const handleFileUpload = useCallback(
    async (file: File, pageCount: number) => {
      const { selectedDocumentId } = state;
      if (!selectedDocumentId) return;

      try {
        // Create a direct URL for the file for immediate preview
        const directFileUrl = URL.createObjectURL(file);
        updateState("documentFileUrl", directFileUrl);

        // Show loading toast
        const loadingToast = toast.loading(
          "Uploading and processing document..."
        );

        // Upload document to S3 and create database record
        const uploadedDocument = await uploadDocument(
          selectedDocumentId,
          file,
          pageCount
        );

        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success("Document uploaded and processed successfully");

        // Update state for document preview
        updateMultipleState({
          uploadModalOpen: false,
          isLoadingDocument: true,
          isLoadingExtractions: true,
        });

        // Process document URL
        await processDocumentUrl(selectedDocumentId);

        // Process document extractions
        await processDocumentExtractions(uploadedDocument);

        // Open the preview modal immediately
        updateState("previewModalOpen", true);
      } catch (error) {
        toast.error("Failed to upload document", {
          description:
            "There was an error processing your document. Please try again.",
        });
        console.error("Document upload error:", error);
      }
    },
    [state.selectedDocumentId, uploadDocument]
  );

  /**
   * Processes the document URL after upload
   * @param documentId - The document ID
   */
  const processDocumentUrl = async (documentId: string) => {
    try {
      const presignedUrl = await getDocumentFileUrl(documentId);

      if (presignedUrl) {
        updateState("documentFileUrl", presignedUrl);
      } else {
        // If we couldn't get a pre-signed URL, keep using the direct URL as a fallback
        console.warn(
          "Could not get pre-signed URL, using direct URL as fallback"
        );
      }
    } catch (error) {
      console.error("Error getting document URL:", error);
      // Keep using the direct URL as a fallback
    } finally {
      updateState("isLoadingDocument", false);
    }
  };

  /**
   * Processes document extractions after upload
   * @param uploadedDocument - The uploaded document
   */
  const processDocumentExtractions = async (
    uploadedDocument: Document | null
  ) => {
    try {
      if (uploadedDocument && uploadedDocument.id) {
        console.log(
          `Fetching extractions for uploaded document with ID: ${uploadedDocument.id}`
        );

        // Fetch extractions directly using the document ID from the database
        const extractionsResponse = await fetch(
          `/api/documents/${uploadedDocument.id}/extractions`
        );

        if (!extractionsResponse.ok) {
          throw new Error("Failed to fetch extractions for uploaded document");
        }

        const updatedExtractions = await extractionsResponse.json();
        updateState("extractions", updatedExtractions);
      } else {
        console.log(
          `No valid document ID available after upload, skipping extraction fetch`
        );
        updateState("extractions", []);
      }
    } catch (error) {
      console.error("Error fetching extractions:", error);
      toast.error("Failed to load document extractions");
      updateState("extractions", []);
    } finally {
      updateState("isLoadingExtractions", false);
    }
  };

  // Get the selected document from the current state
  const selectedDocument = state.selectedDocumentId
    ? documents[state.selectedDocumentId]
    : null;

  // Update extractions when selectedDocumentId changes
  useEffect(() => {
    // Only fetch extractions when preview modal is open, not when delete dialog is open
    if (state.deleteDialogOpen) {
      return;
    }

    const fetchExtractions = async () => {
      if (state.selectedDocumentId) {
        updateState("isLoadingExtractions", true);
        try {
          // Check if there's a document at this slot before trying to fetch extractions
          const document = documents[state.selectedDocumentId];
          if (!document) {
            console.log(
              `No document at slot ${state.selectedDocumentId}, skipping extraction fetch`
            );
            updateState("extractions", []);
            return;
          }

          const documentExtractions = await getExtractions(
            state.selectedDocumentId
          );
          updateState("extractions", documentExtractions);
        } catch (error) {
          console.error("Error fetching extractions:", error);
          toast.error("Failed to load document extractions");
          updateState("extractions", []);
        } finally {
          updateState("isLoadingExtractions", false);
        }
      } else {
        updateState("extractions", []);
      }
    };

    fetchExtractions();
  }, [
    state.selectedDocumentId,
    state.deleteDialogOpen,
    documents,
    getExtractions,
  ]);

  /**
   * Generates document boxes for the dashboard
   * @returns Array of DocumentBox components
   */
  const generateDocumentBoxes = useCallback(() => {
    const boxes = [];
    for (let i = 1; i <= 9; i++) {
      const id = `doc-${i}`;
      const title = `Legal Document ${i}`;
      boxes.push(
        <DocumentBox
          key={id}
          id={id}
          title={title}
          document={documents[id] || null}
          onUploadClick={handleUploadClick}
          onPreviewClick={handlePreviewClick}
          onDeleteClick={handleDeleteClick}
          isLoading={isLoading || state.deletingDocumentId === id}
        />
      );
    }
    return boxes;
  }, [
    documents,
    isLoading,
    state.deletingDocumentId,
    handleUploadClick,
    handlePreviewClick,
    handleDeleteClick,
  ]);

  // Generate document boxes
  const documentBoxes = generateDocumentBoxes();

  /**
   * Renders the dashboard header with logo and title
   * @returns Header component
   */
  const renderHeader = () => (
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
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {renderHeader()}

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
        isOpen={state.uploadModalOpen}
        onClose={() => updateState("uploadModalOpen", false)}
        onUpload={handleFileUpload}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={state.previewModalOpen}
        onClose={() => updateState("previewModalOpen", false)}
        document={selectedDocument}
        extractions={state.extractions}
        fileUrl={state.documentFileUrl}
        isLoadingExtractions={state.isLoadingExtractions}
        isLoadingDocument={state.isLoadingDocument}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={state.deleteDialogOpen}
        onOpenChange={(open) => updateState("deleteDialogOpen", open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              document and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
