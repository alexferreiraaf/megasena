import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full max-w-6xl relative animate-pulse">
      <Card>
        <CardHeader className="border-b pb-4 mb-8">
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center pb-4 mb-6">
            <Skeleton className="h-10 w-full sm:w-60 mb-4 sm:mb-0" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-4 mb-8 p-4 border rounded-lg bg-secondary/50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>

          <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <div className="space-y-2 p-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-24" />
                  <div className="flex items-center space-x-2">
                    {Array.from({ length: 6 }).map((_, j) => <Skeleton key={j} className="size-8 rounded-full" />)}
                  </div>
                  <Skeleton className="h-8 flex-1" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
