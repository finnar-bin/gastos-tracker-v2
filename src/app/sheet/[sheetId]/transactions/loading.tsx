import {
  ListRowSkeleton,
  PageHeaderSkeleton,
  SelectGridSkeleton,
  TabsSkeleton,
} from "@/components/page-loading";

export default function TransactionsLoading() {
  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 min-h-screen">
      <PageHeaderSkeleton backButton subtitleWidth="w-28" titleWidth="w-36" />
      <div className="space-y-3">
        <SelectGridSkeleton fields={2} />
        <TabsSkeleton />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, idx) => (
          <ListRowSkeleton key={idx} meta={false} />
        ))}
      </div>
    </div>
  );
}
