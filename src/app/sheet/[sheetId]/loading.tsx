import { DashboardSkeleton, PageHeaderSkeleton } from "@/components/page-loading";

export default function SheetRouteLoading() {
  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <PageHeaderSkeleton actionWidth="w-20" subtitleWidth="w-24" titleWidth="w-44" />
      <DashboardSkeleton />
    </div>
  );
}
