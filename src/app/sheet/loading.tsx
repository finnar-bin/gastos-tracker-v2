import { LoadingCard, LoadingHeader } from "@/components/page-loading";

export default function SheetSelectorLoading() {
  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      <LoadingHeader actionWidth="w-24" subtitleWidth="w-52" />

      <div className="space-y-4">
        {Array.from({ length: 4 }, (_, idx) => (
          <LoadingCard
            key={idx}
            className="min-h-20"
            lines={["w-1/2", "w-11/12", "w-1/3"]}
          />
        ))}
      </div>
    </div>
  );
}
