import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sheets, sheetUsers, sheetInvites } from "@/lib/db/schema";
import { and, eq, gt } from "drizzle-orm";
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
import {
  acceptInviteFromSheet,
  declineInviteFromSheet,
} from "./invite-actions";
import { normalizeEmail } from "@/lib/invite-service";

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

  const pendingInvites = user.email
    ? await db
        .select({
          id: sheetInvites.id,
          role: sheetInvites.role,
          expiresAt: sheetInvites.expiresAt,
          sheetId: sheets.id,
          sheetName: sheets.name,
        })
        .from(sheetInvites)
        .innerJoin(sheets, eq(sheetInvites.sheetId, sheets.id))
        .where(
          and(
            eq(sheetInvites.invitedEmail, normalizeEmail(user.email)),
            eq(sheetInvites.status, "pending"),
            gt(sheetInvites.expiresAt, new Date()),
          ),
        )
    : [];

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Your Sheets</h1>
          <p className="text-muted-foreground text-sm">
            Select a sheet to manage
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <Button variant="ghost" size="sm">
            Sign Out
          </Button>
        </form>
      </header>

      <div className="flex flex-col gap-4">
        {pendingInvites.length > 0 && (
          <Card className="p-0 gap-0">
            <CardHeader className="space-y-1 p-4 gap-0">
              <CardTitle className="text-base">Pending Invites</CardTitle>
              <CardDescription>
                Accept or decline sheet invitations
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-4 space-y-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="rounded-md border p-3 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{invite.sheetName}</p>
                    <p className="text-xs text-muted-foreground">
                      Role: <span className="capitalize">{invite.role}</span> ·
                      Expires {invite.expiresAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <form action={declineInviteFromSheet}>
                      <input type="hidden" name="inviteId" value={invite.id} />
                      <Button
                        type="submit"
                        size="sm"
                        className="bg-red-400 text-black hover:bg-red-500"
                      >
                        Decline
                      </Button>
                    </form>
                    <form action={acceptInviteFromSheet}>
                      <input type="hidden" name="inviteId" value={invite.id} />
                      <Button
                        type="submit"
                        size="sm"
                        className="bg-green-400 text-black hover:bg-green-500"
                      >
                        Accept
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

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
            <Link key={sheet.id} href={`/sheet/${sheet.id}`} className="block">
              <Card className="overflow-hidden shadow-sm cursor-pointer hover:shadow-lg transition-all duration-300 group">
                <CardContent className="px-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl">
                      <LayoutGrid className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="font-medium group-hover:text-primary transition-colors">
                        {sheet.name}
                      </CardTitle>
                      {sheet.description && (
                        <CardDescription className="text-xs text-muted-foreground pb-1 line-clamp-1">
                          {sheet.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      <CreateSheetDialog />
    </div>
  );
}
