import { LoadingCard, LoadingHeader } from "@/components/page-loading";

export default function TransactionsLoading() {
  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 min-h-screen">
      <LoadingHeader titleWidth="w-40" subtitleWidth="w-32" />
      <LoadingCard className="min-h-20" lines={["w-1/3", "w-full", "w-1/2"]} />
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, idx) => (
          <LoadingCard
            key={idx}
            className="min-h-20"
            lines={["w-2/5", "w-10/12", "w-1/4"]}
          />
        ))}
      </div>
    </div>
  );
}
