import {
  ListRowSkeleton,
  PageHeaderSkeleton,
  SectionTitleSkeleton,
} from "@/components/page-loading";

export default function UsersLoading() {
  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <PageHeaderSkeleton
        backButton
        actionWidth="w-12"
        subtitleWidth="w-24"
        titleWidth="w-36"
      />
      <div className="space-y-2">
        <SectionTitleSkeleton width="w-28" />
        <ListRowSkeleton dashed />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, idx) => (
          <ListRowSkeleton key={idx} meta trailingDetail />
        ))}
      </div>
    </div>
  );
}
