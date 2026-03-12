type HeaderSkeletonProps = {
  subtitleWidth?: string;
  titleWidth?: string;
  actionWidth?: string;
  backButton?: boolean;
};

type ListRowSkeletonProps = {
  meta?: boolean;
  leadingIcon?: boolean;
  trailingDetail?: boolean;
  card?: boolean;
  dashed?: boolean;
};

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={joinClassNames("rounded-md bg-foreground/10", className)} />;
}

export function PageHeaderSkeleton({
  subtitleWidth = "w-32",
  titleWidth = "w-40",
  actionWidth,
  backButton = false,
}: HeaderSkeletonProps) {
  return (
    <div className="flex items-center justify-between gap-4 animate-pulse">
      <div className="flex min-w-0 items-center gap-2">
        {backButton ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 bg-card shadow-hard-sm">
            <SkeletonBlock className="h-4 w-4 rounded-sm" />
          </div>
        ) : null}
        <div className="min-w-0 space-y-2">
          <SkeletonBlock className={joinClassNames("h-7", titleWidth)} />
          <SkeletonBlock className={joinClassNames("h-4 bg-foreground/7", subtitleWidth)} />
        </div>
      </div>
      {actionWidth ? (
        <div className="shrink-0 rounded-md border-2 bg-card px-3 py-2 shadow-hard-sm">
          <SkeletonBlock className={joinClassNames("h-4", actionWidth)} />
        </div>
      ) : null}
    </div>
  );
}

export function SelectGridSkeleton({ fields }: { fields: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 animate-pulse">
      {Array.from({ length: fields }, (_, index) => (
        <div
          key={index}
          className="rounded-xl border-2 bg-card px-3 py-3 shadow-hard-sm"
        >
          <SkeletonBlock className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export function TabsSkeleton({ items = 2 }: { items?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 animate-pulse">
      {Array.from({ length: items }, (_, index) => (
        <div
          key={index}
          className="rounded-xl border-2 bg-card px-3 py-2.5 shadow-hard-sm"
        >
          <div className="flex items-center justify-center gap-2">
            <SkeletonBlock className="h-4 w-4 rounded-sm" />
            <SkeletonBlock className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListRowSkeleton({
  meta = true,
  leadingIcon = true,
  trailingDetail = true,
  card = true,
  dashed = false,
}: ListRowSkeletonProps) {
  return (
    <div
      className={joinClassNames(
        "animate-pulse",
        card
          ? "rounded-xl border-2 bg-card px-4 py-4 shadow-hard-sm"
          : "border-b pb-3",
        dashed && "border-dashed",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {leadingIcon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <SkeletonBlock className="h-4 w-4 rounded-sm bg-primary/35" />
            </div>
          ) : null}
          <div className="min-w-0 space-y-2">
            <SkeletonBlock className="h-4 w-28" />
            {meta ? <SkeletonBlock className="h-3 w-40 bg-foreground/7" /> : null}
          </div>
        </div>
        {trailingDetail ? (
          <div className="space-y-2 text-right">
            <SkeletonBlock className="ml-auto h-4 w-20" />
            <SkeletonBlock className="ml-auto h-3 w-14 bg-foreground/7" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function SectionTitleSkeleton({ width = "w-36" }: { width?: string }) {
  return (
    <div className="space-y-2 animate-pulse">
      <SkeletonBlock className={joinClassNames("h-5", width)} />
      <div className="h-px w-full bg-border/20" />
    </div>
  );
}

export function SettingsLinkSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <SkeletonBlock className="h-5 w-5 rounded-sm" />
      <SkeletonBlock className="h-5 w-40" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 bg-primary p-5 shadow-hard-sm animate-pulse">
        <div className="space-y-4 text-primary-foreground">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-sm bg-white/45" />
            <div className="h-4 w-24 rounded-md bg-white/35" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-28 rounded-md bg-white/25" />
              <div className="h-5 w-24 rounded-md bg-white/45" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 rounded-md bg-white/25" />
              <div className="h-5 w-24 rounded-md bg-white/45" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 animate-pulse">
          <SkeletonBlock className="h-5 w-5 rounded-sm" />
          <SkeletonBlock className="h-5 w-28" />
        </div>
        <div className="rounded-xl border-2 bg-card p-4 shadow-hard-sm animate-pulse">
          <div className="mb-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-2.5 w-2.5 rounded-full" />
              <SkeletonBlock className="h-3 w-12" />
            </div>
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-2.5 w-2.5 rounded-full" />
              <SkeletonBlock className="h-3 w-12" />
            </div>
          </div>
          <div className="flex h-44 items-end justify-between gap-2">
            {Array.from({ length: 12 }, (_, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-foreground/12"
                  style={{ height: `${40 + ((index % 5) + 1) * 14}px` }}
                />
                <SkeletonBlock className="h-3 w-3" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-5 w-5 rounded-sm" />
            <SkeletonBlock className="h-5 w-20" />
          </div>
          <SkeletonBlock className="h-4 w-16" />
        </div>
        <div className="rounded-xl border-2 bg-card shadow-hard-sm">
          <div className="divide-y">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="px-4 py-3">
                <ListRowSkeleton card={false} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
