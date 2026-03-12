import { LoadingCard, LoadingHeader } from "@/components/page-loading";

export default function UsersLoading() {
  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <LoadingHeader titleWidth="w-32" subtitleWidth="w-24" />
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, idx) => (
          <LoadingCard
            key={idx}
            className="min-h-20"
            lines={["w-1/2", "w-9/12", "w-1/4"]}
          />
        ))}
      </div>
    </div>
  );
}
