import { LoadingCard, LoadingHeader } from "@/components/page-loading";

export default function HistoryLoading() {
  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 min-h-screen">
      <LoadingHeader titleWidth="w-36" subtitleWidth="w-28" />
      <LoadingCard className="min-h-24" lines={["w-1/3", "w-full", "w-3/4"]} />
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, idx) => (
          <LoadingCard
            key={idx}
            className="min-h-24"
            lines={["w-1/2", "w-11/12", "w-2/5"]}
          />
        ))}
      </div>
    </div>
  );
}
