import { LoadingCard, LoadingHeader } from "@/components/page-loading";

export default function SettingsLoading() {
  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <LoadingHeader titleWidth="w-32" subtitleWidth="w-24" />
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, idx) => (
          <LoadingCard key={idx} className="min-h-12" lines={["w-1/3", "w-2/3"]} />
        ))}
      </div>
    </div>
  );
}
