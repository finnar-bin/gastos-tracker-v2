"use client";

import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { PaymentTypeList } from "./payment-type-list";

export function PaymentTypesSettingsClient({
  sheetId,
  sheetName,
  canAddPaymentType,
  canEditPaymentType,
}: {
  sheetId: string;
  sheetName: string;
  canAddPaymentType: boolean;
  canEditPaymentType: boolean;
}) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="Payment Types"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings`}
        icon={ArrowLeft}
        subtitle={sheetName}
        actions={
          canAddPaymentType ? (
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

      <PaymentTypeList
        sheetId={sheetId}
        canAddPaymentType={canAddPaymentType}
        canEditPaymentType={canEditPaymentType}
        addDialogOpen={addDialogOpen}
        onAddDialogOpenChange={setAddDialogOpen}
      />
    </div>
  );
}
