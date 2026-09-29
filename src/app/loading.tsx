import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-dvh px-5 py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full max-w-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      </div>
    </div>
  );
}
