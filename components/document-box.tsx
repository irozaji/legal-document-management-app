import { Document } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface DocumentBoxProps {
  id: string;
  document: Document | null;
  title?: string;
  onUploadClick: (id: string) => void;
  onPreviewClick: (id: string) => void;
}

export function DocumentBox({
  id,
  document,
  title,
  onUploadClick,
  onPreviewClick,
}: DocumentBoxProps) {
  const handleClick = () => {
    if (document) {
      onPreviewClick(id);
    } else {
      onUploadClick(id);
    }
  };

  const formatDate = (dateString: string) => {
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
      className="w-full h-48 flex flex-col cursor-pointer transition-all hover:shadow-md hover:border-blue-400 hover:scale-[1.02]"
      onClick={handleClick}
    >
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-base font-medium text-center">
          {boxTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center items-center p-4">
        {document ? (
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
