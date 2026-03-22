import { requireSheetAccess } from "@/lib/auth/sheets";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DashboardContent } from "./dashboard-content";

export default async function SheetDashboardPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { sheet } = await requireSheetAccess(sheetId);

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{sheet.name}</h1>
          <p className="text-muted-foreground text-sm">Dashboard</p>
        </div>
        <div className="flex gap-2 md:hidden">
          <Link href="/sheet">
            <Button variant="outline" size="sm">
              Sheets
            </Button>
          </Link>
          <form action="/auth/signout" method="post">
            <Button variant="ghost" size="sm">
              Sign Out
            </Button>
          </form>
        </div>
      </header>
      <DashboardContent sheetId={sheetId} />
    </div>
  );
}
