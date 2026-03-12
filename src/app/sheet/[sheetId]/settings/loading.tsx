import {
  PageHeaderSkeleton,
  SectionTitleSkeleton,
  SettingsLinkSkeleton,
} from "@/components/page-loading";

export default function SettingsLoading() {
  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <PageHeaderSkeleton backButton subtitleWidth="w-24" titleWidth="w-24" />
      <div className="space-y-8">
        <section className="space-y-4">
          <SectionTitleSkeleton width="w-32" />
          <div className="flex flex-col space-y-3">
            {Array.from({ length: 5 }, (_, idx) => (
              <SettingsLinkSkeleton key={idx} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
