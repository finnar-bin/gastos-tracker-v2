import {
  ListRowSkeleton,
  PageHeaderSkeleton,
  SelectGridSkeleton,
} from "@/components/page-loading";

export default function HistoryLoading() {
  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 min-h-screen">
      <PageHeaderSkeleton backButton subtitleWidth="w-28" titleWidth="w-28" />
      <div className="space-y-3 animate-pulse">
        <div className="h-4 w-12 rounded-md bg-foreground/10" />
        <SelectGridSkeleton fields={4} />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, idx) => (
          <ListRowSkeleton key={idx} meta trailingDetail />
        ))}
      </div>
    </div>
  );
}
