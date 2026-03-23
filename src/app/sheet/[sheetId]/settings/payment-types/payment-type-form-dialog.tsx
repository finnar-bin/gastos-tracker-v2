"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { queryKeys } from "@/lib/query-keys";
import { createClient } from "@/lib/supabase/client";
import PaymentTypeForm, { type PaymentTypeFormData } from "./add/form";

type PaymentTypeRow = {
  id: string;
  name: string;
  icon: string;
};

const supabase = createClient();

export function PaymentTypeFormDialog({
  sheetId,
  mode = "edit",
  paymentTypeId,
  inPlace = false,
  asDialog = false,
  open = false,
  onOpenChangeAction,
  onCancelAction,
  onCompletedAction,
}: {
  sheetId: string;
  mode?: "add" | "edit";
  paymentTypeId?: string;
  inPlace?: boolean;
  asDialog?: boolean;
  open?: boolean;
  onOpenChangeAction?: (open: boolean) => void;
  onCancelAction?: () => void;
  onCompletedAction?: () => void;
}) {
  const enabled = mode === "edit" && Boolean(paymentTypeId);
  const paymentTypeQuery = useQuery({
    queryKey: queryKeys.paymentTypeForm(sheetId, paymentTypeId ?? "new"),
    enabled: (asDialog ? open : true) && enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_types")
        .select("id, name, icon")
        .eq("sheet_id", sheetId)
        .eq("id", paymentTypeId!)
        .maybeSingle();

      if (error) throw error;
      return data as PaymentTypeRow | null;
    },
  });

  const content = useMemo(() => {
    if (mode === "add") {
      return (
        <PaymentTypeForm
          sheetId={sheetId}
          mode="add"
          inPlace={inPlace}
          onCancelAction={onCancelAction}
          onCompletedAction={onCompletedAction}
        />
      );
    }

    if (paymentTypeQuery.isLoading) {
      return <div className="h-72 rounded-xl bg-muted/40 animate-pulse" />;
    }

    if (paymentTypeQuery.error) {
      return (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">Failed to load payment type.</p>
          <Button variant="outline" className="mt-4" onClick={() => void paymentTypeQuery.refetch()}>
            Retry
          </Button>
        </div>
      );
    }

    if (!paymentTypeQuery.data) {
      return (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">Payment type not found.</p>
        </div>
      );
    }

    const initialData: PaymentTypeFormData = {
      id: paymentTypeQuery.data.id,
      name: paymentTypeQuery.data.name,
      icon: paymentTypeQuery.data.icon,
    };

    return (
      <PaymentTypeForm
        sheetId={sheetId}
        mode="edit"
        initialData={initialData}
        inPlace={inPlace}
        onCancelAction={onCancelAction}
        onCompletedAction={onCompletedAction}
      />
    );
  }, [
    inPlace,
    mode,
    onCancelAction,
    onCompletedAction,
    paymentTypeQuery.data,
    paymentTypeQuery.error,
    paymentTypeQuery.isLoading,
    paymentTypeQuery.refetch,
    sheetId,
  ]);

  if (!asDialog) {
    return content;
  }

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto bg-card"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {mode === "edit" ? "Edit Payment Type" : "Add Payment Type"}
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
