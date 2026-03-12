type LoadingCardProps = {
  lines?: string[];
  className?: string;
};

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function LoadingHeader({
  titleWidth = "w-40",
  subtitleWidth = "w-56",
  actionWidth,
}: {
  titleWidth?: string;
  subtitleWidth?: string;
  actionWidth?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border-2 bg-card p-4 shadow-hard-sm animate-pulse">
      <div className="space-y-2">
        <div className={joinClassNames("h-8 rounded-md bg-foreground/12", titleWidth)} />
        <div
          className={joinClassNames("h-4 rounded-md bg-foreground/8", subtitleWidth)}
        />
      </div>
      {actionWidth ? (
        <div className={joinClassNames("h-10 rounded-md bg-primary/20", actionWidth)} />
      ) : null}
    </div>
  );
}

export function LoadingCard({ lines = ["w-2/3", "w-full", "w-1/3"], className }: LoadingCardProps) {
  return (
    <div
      className={joinClassNames(
        "rounded-2xl border-2 bg-card p-4 shadow-hard-sm animate-pulse",
        className,
      )}
    >
      <div className="space-y-3">
        {lines.map((line, index) => (
          <div
            key={`${line}-${index}`}
            className={joinClassNames(
              "h-4 rounded-md bg-foreground/10",
              index === 0 ? "h-5 bg-foreground/14" : undefined,
              line,
            )}
          />
        ))}
      </div>
    </div>
  );
}
