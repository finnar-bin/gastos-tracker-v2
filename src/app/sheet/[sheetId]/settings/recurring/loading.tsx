import { LoadingCard, LoadingHeader } from "@/components/page-loading";

export default function RecurringLoading() {
  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <LoadingHeader titleWidth="w-40" subtitleWidth="w-28" />
      <div className="space-y-4">
        {Array.from({ length: 4 }, (_, idx) => (
          <LoadingCard
            key={idx}
            className="min-h-24"
            lines={["w-2/5", "w-full", "w-1/2"]}
          />
        ))}
      </div>
    </div>
  );
}
