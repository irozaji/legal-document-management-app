import { DocumentBoxSkeleton } from "@/components/document-box-skeleton";

export default function DashboardLoadingSkeleton() {
  // Generate skeleton boxes
  const skeletonBoxes = [];
  for (let i = 1; i <= 9; i++) {
    skeletonBoxes.push(<DocumentBoxSkeleton key={`skeleton-${i}`} />);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex items-center">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-200 rounded-md mr-2 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
      </header>

      <div className="flex flex-wrap -mx-3">
        {skeletonBoxes.map((box, index) => (
          <div
            key={`box-skeleton-wrapper-${index}`}
            className="w-full sm:w-1/2 md:w-1/3 p-3 transition-all"
          >
            {box}
          </div>
        ))}
      </div>
    </div>
  );
}
