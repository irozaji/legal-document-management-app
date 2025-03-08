import { Document } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { format } from "date-fns";

interface DocumentBoxProps {
  id: string;
  document: Document | null;
  onUploadClick: (id: string) => void;
  onPreviewClick: (id: string) => void;
}

export function DocumentBox({
  id,
  document,
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
      return "Invalid date";
    }
  };

  return (
    <Card
      className="w-full h-48 flex flex-col cursor-pointer transition-all hover:shadow-md"
      onClick={handleClick}
    >
      <CardContent className="flex-1 flex flex-col justify-center items-center p-6">
        {document ? (
          <>
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
              className="mb-2"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <h3 className="font-medium text-center line-clamp-1">
              {document.name}
            </h3>
          </>
        ) : (
          <>
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
              className="mb-2"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="12" x2="12" y2="16" />
              <line x1="10" y1="14" x2="14" y2="14" />
            </svg>
            <h3 className="font-medium text-center">
              Legal Document {id.split("-")[1]}
            </h3>
          </>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
        {document ? (
          <p>Uploaded: {formatDate(document.uploadDate)}</p>
        ) : (
          <p>No document uploaded</p>
        )}
      </CardFooter>
    </Card>
  );
}
