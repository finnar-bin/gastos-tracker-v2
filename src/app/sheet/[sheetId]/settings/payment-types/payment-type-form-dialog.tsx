"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
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

type PaymentTypeFormDialogBodyProps = {
  sheetId: string;
  mode: "add" | "edit";
  query: UseQueryResult<PaymentTypeRow | null>;
  onCancelAction?: () => void;
  onCompletedAction?: () => void;
};

function PaymentTypeFormDialogBody({
  sheetId,
  mode,
  query,
  onCancelAction,
  onCompletedAction,
}: PaymentTypeFormDialogBodyProps) {
  if (mode === "add") {
    return (
        <PaymentTypeForm
          sheetId={sheetId}
          mode="add"
          onCancelAction={onCancelAction}
          onCompletedAction={onCompletedAction}
        />
    );
  }

  if (query.isLoading) {
    return <div className="h-72 rounded-xl bg-muted/40 animate-pulse" />;
  }

  if (query.error) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">Failed to load payment type.</p>
        <Button variant="outline" className="mt-4" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!query.data) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">Payment type not found.</p>
      </div>
    );
  }

  const initialData: PaymentTypeFormData = {
    id: query.data.id,
    name: query.data.name,
    icon: query.data.icon,
  };

  return (
    <PaymentTypeForm
      sheetId={sheetId}
      mode="edit"
      initialData={initialData}
      onCancelAction={onCancelAction}
      onCompletedAction={onCompletedAction}
    />
  );
}

export function PaymentTypeFormDialog({
  sheetId,
  mode = "edit",
  paymentTypeId,
  open = false,
  onOpenChangeAction,
  onCancelAction,
  onCompletedAction,
}: {
  sheetId: string;
  mode?: "add" | "edit";
  paymentTypeId?: string;
  open?: boolean;
  onOpenChangeAction?: (open: boolean) => void;
  onCancelAction?: () => void;
  onCompletedAction?: () => void;
}) {
  const enabled = mode === "edit" && Boolean(paymentTypeId);
  const paymentTypeQuery = useQuery({
    queryKey: queryKeys.paymentTypeForm(sheetId, paymentTypeId ?? "new"),
    enabled: open && enabled,
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
        <PaymentTypeFormDialogBody
          sheetId={sheetId}
          mode={mode}
          query={paymentTypeQuery}
          onCancelAction={onCancelAction}
          onCompletedAction={onCompletedAction}
        />
      </DialogContent>
    </Dialog>
  );
}
