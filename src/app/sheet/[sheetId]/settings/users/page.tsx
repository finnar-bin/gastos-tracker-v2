import { requireSheetAccess } from "@/lib/auth/sheets";
import { ArrowLeft, UserPlus, Mail, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { sheetUsers, profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createHash } from "crypto";

export default async function ManageUsersPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { sheet } = await requireSheetAccess(sheetId);

  const members = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      role: sheetUsers.role,
    })
    .from(sheetUsers)
    .innerJoin(profiles, eq(sheetUsers.userId, profiles.id))
    .where(eq(sheetUsers.sheetId, sheetId));

  const getGravatarUrl = (email: string) => {
    const hash = createHash("md5")
      .update(email.trim().toLowerCase())
      .digest("hex");
    return `https://www.gravatar.com/avatar/${hash}?d=mp`;
  };

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/sheet/${sheetId}/settings`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Manage Users</h1>
            <p className="text-sm text-muted-foreground">{sheet.name}</p>
          </div>
        </div>
        <Button size="sm" className="gap-2" disabled>
          <UserPlus className="h-4 w-4" /> Invite
        </Button>
      </div>

      <div className="space-y-4">
        {members.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
            <p className="text-muted-foreground">No users found.</p>
          </div>
        ) : (
          members.map((member) => (
            <Card
              key={member.id}
              className="overflow-hidden border-none shadow-sm bg-card"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={member.avatarUrl || getGravatarUrl(member.email)}
                        alt={member.displayName || member.email}
                      />
                      <AvatarFallback>
                        {member.displayName?.charAt(0).toUpperCase() ||
                          member.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">
                        {member.displayName || "User"}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {member.email}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary capitalize">
                      <Shield className="h-3 w-3" />
                      {member.role}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
