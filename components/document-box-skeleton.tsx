import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DocumentBoxSkeleton() {
  return (
    <Card className="w-full h-48 flex flex-col animate-pulse">
      <CardHeader className="p-4 pb-0">
        <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto"></div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center items-center p-4">
        <div className="w-8 h-8 bg-gray-200 rounded-md mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mt-1"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
      </CardContent>
    </Card>
  );
}
