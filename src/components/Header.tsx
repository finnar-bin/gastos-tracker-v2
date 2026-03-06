import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { requireSheetAccess } from "@/lib/auth/sheets";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  sheetId: string;
  backHref: string;
  icon: LucideIcon;
  subtitle?: string;
  actions?: ReactNode;
}

export async function Header({
  title,
  sheetId,
  backHref,
  icon: Icon,
  subtitle,
  actions,
}: HeaderProps) {
  const { sheet } = await requireSheetAccess(sheetId);
  const resolvedSubtitle = subtitle ?? sheet.name;

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
          {resolvedSubtitle ? (
            <p className="text-sm text-muted-foreground">{resolvedSubtitle}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
}
