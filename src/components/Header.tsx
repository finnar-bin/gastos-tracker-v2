import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  sheetId: string;
  backHref: string;
  icon: LucideIcon;
  subtitle?: string;
  actions?: ReactNode;
}

export function Header({
  title,
  backHref,
  icon: Icon,
  subtitle,
  actions,
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link href={backHref}>
          <Button variant="ghost" size="icon">
            <Icon className="h-6 w-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
}
