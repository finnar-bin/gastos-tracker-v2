import { ListRowSkeleton, PageHeaderSkeleton } from "@/components/page-loading";

export default function PaymentTypesSettingsLoading() {
  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <PageHeaderSkeleton
        backButton
        actionWidth="w-12"
        subtitleWidth="w-28"
        titleWidth="w-40"
      />
      <div className="space-y-4">
        {Array.from({ length: 4 }, (_, idx) => (
          <ListRowSkeleton key={idx} trailingDetail={false} />
        ))}
      </div>
    </div>
  );
}
