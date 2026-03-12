"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight, LayoutGrid } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import { acceptInviteFromSheet, declineInviteFromSheet } from "./invite-actions";

type UserSheet = {
  id: string;
  name: string;
  description: string | null;
};

type PendingInvite = {
  id: string;
  role: string;
  expiresAt: string;
  sheetName: string;
};

const supabase = createClient();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function fetchSheetSelectorData() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return { userSheets: [] as UserSheet[], pendingInvites: [] as PendingInvite[] };

  const [sheetUsersResult, invitesResult] = await Promise.all([
    supabase
      .from("sheet_users")
      .select("sheets!inner(id, name, description)")
      .eq("user_id", user.id),
    user.email
      ? supabase
          .from("sheet_invites")
          .select("id, role, expires_at, sheets!inner(name)")
          .eq("invited_email", normalizeEmail(user.email))
          .eq("status", "pending")
          .gt("expires_at", new Date().toISOString())
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (sheetUsersResult.error) throw sheetUsersResult.error;
  if (invitesResult.error) throw invitesResult.error;

  const userSheets = (sheetUsersResult.data ?? [])
    .map((row) => {
      const sheet = Array.isArray(row.sheets) ? row.sheets[0] : row.sheets;
      if (!sheet) return null;
      return {
        id: sheet.id,
        name: sheet.name,
        description: sheet.description,
      } satisfies UserSheet;
    })
    .filter((row): row is UserSheet => row !== null);

  const pendingInvites = (invitesResult.data ?? []).map((row) => {
    const sheet = Array.isArray(row.sheets) ? row.sheets[0] : row.sheets;
    return {
      id: row.id,
      role: row.role,
      expiresAt: row.expires_at,
      sheetName: sheet?.name ?? "Sheet",
    } satisfies PendingInvite;
  });

  return { userSheets, pendingInvites };
}

export function SheetSelectorContent() {
  const sheetSelectorQuery = useQuery({
    queryKey: queryKeys.sheetSelector(),
    queryFn: fetchSheetSelectorData,
  });

  if (sheetSelectorQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }, (_, idx) => (
          <Card key={idx} className="overflow-hidden">
            <CardContent className="h-20 animate-pulse bg-muted/40" />
          </Card>
        ))}
      </div>
    );
  }

  if (sheetSelectorQuery.error) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">Failed to load your sheets.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => void sheetSelectorQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const userSheets = sheetSelectorQuery.data?.userSheets ?? [];
  const pendingInvites = sheetSelectorQuery.data?.pendingInvites ?? [];

  return (
    <div className="flex flex-col gap-4">
      {pendingInvites.length > 0 ? (
        <Card className="p-0 gap-0">
          <CardHeader className="space-y-1 p-4 gap-0">
            <CardTitle className="text-base">Pending Invites</CardTitle>
            <CardDescription>Accept or decline sheet invitations</CardDescription>
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
                    Role: <span className="capitalize">{invite.role}</span> · Expires{" "}
                    {new Date(invite.expiresAt).toLocaleDateString()}
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
      ) : null}

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
                    {sheet.description ? (
                      <CardDescription className="text-xs text-muted-foreground pb-1 line-clamp-1">
                        {sheet.description}
                      </CardDescription>
                    ) : null}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
}
