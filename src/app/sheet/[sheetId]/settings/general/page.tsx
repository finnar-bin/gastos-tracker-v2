import { Header } from "@/components/Header";
import { requireSheetAccess } from "@/lib/auth/sheets";
import { db } from "@/lib/db";
import { sheetSettings, sheets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { GeneralSettingsForm } from "./form";

export default async function GeneralSettingsPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { permissions } = await requireSheetAccess(sheetId);

  const settingsRows = await db
    .select({ currency: sheetSettings.currency })
    .from(sheetSettings)
    .where(eq(sheetSettings.sheetId, sheetId))
    .limit(1);

  const currentCurrency = settingsRows[0]?.currency ?? "USD";

  const sheetRows = await db
    .select({ name: sheets.name, description: sheets.description })
    .from(sheets)
    .where(eq(sheets.id, sheetId))
    .limit(1);

  const currentName = sheetRows[0]?.name ?? "";
  const currentDescription = sheetRows[0]?.description ?? "";

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="General Settings"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings`}
        icon={ArrowLeft}
      />

      <GeneralSettingsForm
        sheetId={sheetId}
        currentCurrency={currentCurrency}
        currentName={currentName}
        currentDescription={currentDescription}
        canEditSheetSettings={permissions.canEditSheetSettings}
        canDeleteSheet={permissions.canDeleteSheet}
      />
    </div>
  );
}
