"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/loading-button";
import { CURRENCIES } from "@/lib/constants/currencies";
import { deleteSheet, upsertSheetCurrency } from "./actions";
import { Settings2 } from "lucide-react";
import { SearchableSelect } from "@/components/searchable-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function GeneralSettingsForm({
  sheetId,
  currentCurrency,
  currentName,
  currentDescription,
  canDeleteSheet,
}: {
  sheetId: string;
  currentCurrency: string;
  currentName: string;
  currentDescription: string;
  canDeleteSheet: boolean;
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
            <Label htmlFor="name">Sheet Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={currentName}
              placeholder="e.g. Personal Budget"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={currentDescription}
              placeholder="Add a short description (optional)"
              rows={3}
            />
          </div>
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

        {canDeleteSheet && (
          <div className="mt-8 pt-8 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Delete Sheet
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    this sheet and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <form action={deleteSheet} className="mt-2 sm:mt-0">
                    <input type="hidden" name="sheetId" value={sheetId} />
                    <DeleteButton />
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DeleteButton() {
  return (
    <AlertDialogAction asChild variant="destructive">
      <LoadingButton
        type="submit"
        variant="destructive"
        text="Confirm Delete"
        loadingText="Deleting..."
      />
    </AlertDialogAction>
  );
}
