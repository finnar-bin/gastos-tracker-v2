import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sheets, sheetUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { CreateSheetDialog } from "./create-sheet-dialog";

export default async function SheetSelectorPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userSheets = await db
    .select({
      id: sheets.id,
      name: sheets.name,
      description: sheets.description,
      createdAt: sheets.createdAt,
    })
    .from(sheets)
    .innerJoin(sheetUsers, eq(sheets.id, sheetUsers.sheetId))
    .where(eq(sheetUsers.userId, user.id));

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Your Sheets</h1>
          <p className="text-muted-foreground text-sm">
            Select a sheet to manage
          </p>
        </div>
      </header>

      <div className="space-y-4">
        {userSheets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <LayoutGrid className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">No sheets found</CardTitle>
                <CardDescription>
                  You don&apos;t have any sheets yet. Create one to get started.
                </CardDescription>
              </div>
            </CardContent>
          </Card>
        ) : (
          userSheets.map((sheet) => (
            <Link key={sheet.id} href={`/?sheetId=${sheet.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                      {sheet.name}
                    </CardTitle>
                    {sheet.description && (
                      <CardDescription className="text-xs line-clamp-1">
                        {sheet.description}
                      </CardDescription>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
              </Card>
            </Link>
          ))
        )}
      </div>

      <CreateSheetDialog />
    </div>
  );
}
