import { ListRowSkeleton, PageHeaderSkeleton } from "@/components/page-loading";

export default function SheetSelectorLoading() {
  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      <PageHeaderSkeleton actionWidth="w-16" subtitleWidth="w-36" titleWidth="w-36" />

      <div className="space-y-4">
        {Array.from({ length: 4 }, (_, idx) => (
          <ListRowSkeleton key={idx} />
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <div className="rounded-md border-2 bg-card px-4 py-2 shadow-hard-sm animate-pulse">
          <div className="h-4 w-28 rounded-md bg-foreground/10" />
        </div>
      </div>
    </div>
  );
}
