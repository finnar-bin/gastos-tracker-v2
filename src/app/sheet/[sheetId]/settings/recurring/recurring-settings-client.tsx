"use client";

import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { RecurringList } from "./recurring-list";

export function RecurringSettingsClient({
  sheetId,
  sheetName,
  canAddRecurringTransaction,
  canEditRecurringTransaction,
}: {
  sheetId: string;
  sheetName: string;
  canAddRecurringTransaction: boolean;
  canEditRecurringTransaction: boolean;
}) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="Recurring"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings`}
        icon={ArrowLeft}
        subtitle={sheetName}
        actions={
          canAddRecurringTransaction ? (
            <Button
              type="button"
              size="sm"
              className="gap-2"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          ) : null
        }
      />

      <RecurringList
        sheetId={sheetId}
        canAddRecurringTransaction={canAddRecurringTransaction}
        canEditRecurringTransaction={canEditRecurringTransaction}
        addDialogOpen={addDialogOpen}
        onAddDialogOpenChange={setAddDialogOpen}
      />
    </div>
  );
}
