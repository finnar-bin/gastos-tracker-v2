import { Header } from "@/components/Header";
import { requireSheetAccess } from "@/lib/auth/sheets";
import { db } from "@/lib/db";
import { sheetSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { GeneralSettingsForm } from "./form";
import { getSheetRoleForUser } from "@/lib/invite-service";

export default async function GeneralSettingsPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { user } = await requireSheetAccess(sheetId);

  const settingsRows = await db
    .select({ currency: sheetSettings.currency })
    .from(sheetSettings)
    .where(eq(sheetSettings.sheetId, sheetId))
    .limit(1);

  const currentCurrency = settingsRows[0]?.currency ?? "USD";
  const role = await getSheetRoleForUser(sheetId, user.id);
  const canDeleteSheet = role === "admin";

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
        canDeleteSheet={canDeleteSheet}
      />
    </div>
  );
}
