import { cn } from "@/lib/utils";

export function BackgroundSyncIndicator({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  if (!active) {
    return null;
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed right-3 z-[60] bottom-[calc(env(safe-area-inset-bottom)+5rem)] md:bottom-3",
        className,
      )}
    >
      <div className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/75 px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm backdrop-blur-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
        <span>Syncing</span>
      </div>
    </div>
  );
}
