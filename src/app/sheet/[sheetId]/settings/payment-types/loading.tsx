import { LoadingCard, LoadingHeader } from "@/components/page-loading";

export default function PaymentTypesSettingsLoading() {
  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <LoadingHeader titleWidth="w-48" subtitleWidth="w-32" />
      <div className="space-y-4">
        {Array.from({ length: 4 }, (_, idx) => (
          <LoadingCard
            key={idx}
            className="min-h-20"
            lines={["w-1/2", "w-10/12", "w-1/3"]}
          />
        ))}
      </div>
    </div>
  );
}
