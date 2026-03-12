import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sheetSettings } from "@/lib/db/schema";

export const getSheetCurrency = cache(async (sheetId: string) => {
  const rows = await db
    .select({ currency: sheetSettings.currency })
    .from(sheetSettings)
    .where(eq(sheetSettings.sheetId, sheetId))
    .limit(1);

  return rows[0]?.currency ?? "USD";
});
