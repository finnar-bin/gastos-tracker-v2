import { requireSheetAccess } from "@/lib/auth/sheets";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Wallet, History, CreditCard } from "lucide-react";
import Link from "next/link";

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
        <div className="flex gap-2">
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

      {/* Balance Card */}
      <Card className="bg-linear-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Total Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold tracking-tight">$0.00</div>
          <p className="text-xs opacity-70 mt-1">Updated just now</p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href={`/sheet/${sheetId}/add?type=income`} className="w-full">
          <Button
            variant="outline"
            className="w-full h-24 flex flex-col gap-2 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950 dark:hover:text-green-400 border-dashed"
          >
            <Plus className="h-6 w-6 text-green-500" />
            <span className="font-medium">Income</span>
          </Button>
        </Link>
        <Link href={`/sheet/${sheetId}/add?type=expense`} className="w-full">
          <Button
            variant="outline"
            className="w-full h-24 flex flex-col gap-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 border-dashed"
          >
            <Plus className="h-6 w-6 text-red-500" />
            <span className="font-medium">Expense</span>
          </Button>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5" /> Recent
          </h2>
          <Link
            href={`/sheet/${sheetId}/history`}
            className="text-sm text-primary hover:underline"
          >
            View All
          </Link>
        </div>
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {/* Empty State */}
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
              <CreditCard className="h-10 w-10 opacity-20" />
              <p>No transactions yet.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
