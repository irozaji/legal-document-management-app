import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getPdfPageCount } from "@/lib/pdf-utils";
import { Progress } from "@/components/ui/progress";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, pageCount: number) => void;
}

export function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal is opened or closed
  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setTimeout(() => {
        setFile(null);
        setIsDragging(false);
        setIsLoading(false);
        setUploadProgress(0);
      }, 300); // Small delay to ensure animations complete
    }
  }, [isOpen]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      validateAndSetFile(droppedFiles[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Invalid file type", {
        description: "Only PDF files are allowed",
      });
      return;
    }

    setFile(file);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX - faster progression
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          // Faster progress increments
          const newProgress = prev + Math.random() * 10;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);

      // Add shorter artificial delay to simulate processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Get the actual page count from the PDF using our utility function
      const pageCount = await getPdfPageCount(file);

      // Complete the progress
      clearInterval(progressInterval);
      setUploadProgress(95);

      // Brief delay before completing
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Set progress to 100% and immediately process the upload
      setUploadProgress(100);

      // Process the upload immediately
      onUpload(file, pageCount);

      // Close the modal after a very brief delay to show 100%
      setTimeout(() => {
        setFile(null);
        setUploadProgress(0);
        onClose();
      }, 200);
    } catch (error) {
      console.error("Error processing PDF:", error);
      toast.error("Upload failed", {
        description: "There was an error processing your PDF file",
      });
      setUploadProgress(0);
    } finally {
      // We don't reset isLoading here because we want the button to stay disabled
      // until the modal is closed. This prevents clicking the button again.
      // setIsLoading will be reset when the modal is reopened.
    }
  };

  const handleCancel = () => {
    setFile(null);
    setUploadProgress(0);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        if (!isLoading) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl">Upload Legal Document</DialogTitle>
          <DialogDescription>
            Upload a PDF document to analyze and extract information. Only PDF
            files are supported.
          </DialogDescription>
        </DialogHeader>

        <div
          className={`
            mt-6 border-2 border-dashed rounded-lg p-10 text-center transition-all duration-200 ease-in-out
            ${
              isDragging
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-muted"
            }
            ${file ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}
            cursor-pointer hover:border-primary hover:bg-primary/5
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="hidden"
          />

          {file ? (
            <div className="py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
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
                  className="text-green-600 dark:text-green-400"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="m9 15 3 3 3-3" />
                  <path d="M12 12v6" />
                </svg>
              </div>
              <p className="text-lg font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {formatFileSize(file.size)} • PDF Document
              </p>
              <p className="text-sm mt-4 text-green-600 dark:text-green-400">
                File ready for upload. Click upload to continue.
              </p>
            </div>
          ) : (
            <div className="py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
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
                  className="text-primary"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M12 18v-6" />
                  <path d="M9 15l3-3 3 3" />
                </svg>
              </div>
              <p className="text-lg font-medium">
                Drag and drop your PDF file here
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                or click to browse your files
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 bg-muted rounded-full">
                  PDF files only
                </span>
                <span className="px-2 py-1 bg-muted rounded-full">
                  Max 10MB
                </span>
                <span className="px-2 py-1 bg-muted rounded-full">
                  Legal documents
                </span>
              </div>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-primary">
                Processing document...
              </span>
              <span className="font-medium">{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {uploadProgress < 40
                  ? "Analyzing document..."
                  : uploadProgress < 80
                  ? "Processing pages..."
                  : "Finalizing..."}
              </span>
              <span>{file && formatFileSize(file.size)}</span>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between sm:justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="px-6"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || isLoading}
            className="px-6 min-w-[120px]"
          >
            {isLoading
              ? uploadProgress >= 80
                ? "Finalizing..."
                : "Processing..."
              : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
