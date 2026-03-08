"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/loading-button";
import { CURRENCIES } from "@/lib/constants/currencies";
import { upsertSheetCurrency } from "./actions";
import { Settings2 } from "lucide-react";
import { SearchableSelect } from "@/components/searchable-select";

export function GeneralSettingsForm({
  sheetId,
  currentCurrency,
}: {
  sheetId: string;
  currentCurrency: string;
}) {
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState(currentCurrency);

  const currencyOptions = CURRENCIES.map((item) => ({
    value: item.code,
    label: `${item.code} - ${item.name}`,
  }));

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await upsertSheetCurrency(formData);

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(result.success ?? "Saved");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Settings2 className="h-4 w-4" /> General Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="sheetId" value={sheetId} />

          <div className="space-y-2">
            <Label>Currency</Label>
            <SearchableSelect
              name="currency"
              value={currency}
              onValueChange={setCurrency}
              options={currencyOptions}
              placeholder="Select a currency"
              searchPlaceholder="Search currency..."
              emptyMessage="No currencies found."
            />
            <p className="text-xs text-muted-foreground">
              Search by code or name, then select a currency.
            </p>
          </div>

          <div className="pt-4 space-y-4">
            <LoadingButton
              type="submit"
              text="Save Settings"
              loadingText="Saving..."
              loading={loading}
              trackFormStatus={false}
              className="w-full"
            />
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/sheet/${sheetId}/settings`}>Back to Settings</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
