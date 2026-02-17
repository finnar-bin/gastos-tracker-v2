import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sheets, sheetUsers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Ensures the user is logged in and has access to the specified sheet.
 * Redirects to /login if not authenticated, or /sheet if unauthorized.
 *
 * @param sheetId The ID of the sheet to verify access for.
 * @returns An object containing the current user and the sheet data.
 */
export async function requireSheetAccess(sheetId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const results = await db
    .select({
      id: sheets.id,
      name: sheets.name,
    })
    .from(sheets)
    .innerJoin(sheetUsers, eq(sheets.id, sheetUsers.sheetId))
    .where(and(eq(sheetUsers.userId, user.id), eq(sheets.id, sheetId)));

  const sheet = results[0];

  if (!sheet) {
    redirect("/sheet");
  }

  return { user, sheet };
}
