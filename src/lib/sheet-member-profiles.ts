import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, sheetUsers } from "@/lib/db/schema";

export type SheetMemberProfile = {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export const getSheetMemberProfiles = cache(async (sheetId: string) => {
  const rows = await db
    .select({
      id: sheetUsers.userId,
      email: profiles.email,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(sheetUsers)
    .leftJoin(profiles, eq(sheetUsers.userId, profiles.id))
    .where(eq(sheetUsers.sheetId, sheetId));

  return rows satisfies SheetMemberProfile[];
});
