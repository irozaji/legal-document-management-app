/**
 * Document Box Component
 *
 * This component displays a document box in the dashboard grid.
 * It shows document information if a document exists, or an empty state if not.
 *
 * @module components/document-box
 */

import { Document } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { memo } from "react";

/**
 * Props for the DocumentBox component
 */
interface DocumentBoxProps {
  /** Unique identifier for the document box */
  id: string;
  /** Document data, or null if no document is uploaded */
  document: Document | null;
  /** Optional title for the document box */
  title?: string;
  /** Whether the document box is in a loading state */
  isLoading?: boolean;
  /** Callback for when the upload button is clicked */
  onUploadClick: (id: string) => void;
  /** Callback for when the preview button is clicked */
  onPreviewClick: (id: string) => void;
  /** Optional callback for when the delete button is clicked */
  onDeleteClick?: (id: string) => void;
}

/**
 * DocumentBox component displays a card for a document in the dashboard
 */
function DocumentBoxComponent({
  id,
  document,
  title,
  isLoading = false,
  onUploadClick,
  onPreviewClick,
  onDeleteClick,
}: DocumentBoxProps) {
  /**
   * Handles click on the document box
   * Opens preview modal if document exists, upload modal if not
   */
  const handleClick = () => {
    if (isLoading) return; // Prevent clicks while loading

    if (document) {
      onPreviewClick(id);
    } else {
      onUploadClick(id);
    }
  };

  /**
   * Handles click on the delete button
   * @param e - The mouse event
   */
  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent the card click event from firing
    if (isLoading || !document || !onDeleteClick) return;
    onDeleteClick(id);
  };

  /**
   * Formats a date string to a readable format
   * @param dateString - The date string to format
   * @returns Formatted date string
   */
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Always use the title or generate one from the id
  const boxTitle = title || `Legal Document ${id.split("-")[1]}`;

  return (
    <Card
      className={`w-full h-48 flex flex-col cursor-pointer transition-all relative overflow-hidden ${
        isLoading
          ? "opacity-70 pointer-events-none"
          : "hover:shadow-md hover:border-blue-400 hover:scale-[1.02]"
      }`}
      onClick={handleClick}
    >
      {/* Deleting overlay - only shown when isLoading and document exists */}
      {isLoading && document && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center">
          <svg
            className="animate-spin h-6 w-6 text-blue-500 mb-2"
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
          <p className="text-sm text-blue-600 font-medium">
            Deleting document...
          </p>
        </div>
      )}

      {document && onDeleteClick && (
        <button
          onClick={handleDeleteClick}
          disabled={isLoading}
          className={`absolute top-2 right-2 z-20 rounded-full p-1.5 shadow-sm transition-colors border ${
            isLoading
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-0"
              : "bg-white hover:bg-red-50 text-red-500 hover:text-red-600 border-gray-200 hover:border-red-200"
          }`}
          aria-label={isLoading ? "Deleting document..." : "Delete document"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18"></path>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
          </svg>
        </button>
      )}
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-base font-medium text-center">
          {boxTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center items-center p-4">
        {isLoading && !document ? (
          <>
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full mb-2"></div>
              <div className="h-2 w-24 bg-gray-200 rounded mt-2"></div>
              <div className="h-2 w-16 bg-gray-200 rounded mt-2"></div>
              <div className="mt-3 text-xs text-gray-400">Loading...</div>
            </div>
          </>
        ) : document ? (
          <>
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-2 text-blue-600"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <p className="text-sm text-center line-clamp-1 text-blue-700 mt-1">
              {document.name}
            </p>
            <p className="text-xs text-center text-gray-500 mt-1">
              Uploaded: {formatDate(document.uploadDate)}
            </p>
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-2 text-gray-400"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="12" x2="12" y2="16" />
              <line x1="10" y1="14" x2="14" y2="14" />
            </svg>
            <p className="text-sm text-center text-gray-500 mt-1">
              No file uploaded
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Memoized version of the DocumentBox component for better performance
 */
export const DocumentBox = memo(DocumentBoxComponent);
