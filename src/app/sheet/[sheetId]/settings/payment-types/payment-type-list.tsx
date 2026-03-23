"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackgroundSyncIndicator } from "@/components/background-sync-indicator";
import { PaymentTypeFormDialog } from "@/app/sheet/[sheetId]/settings/payment-types/payment-type-form-dialog";
import { usePrefetchGuard } from "@/components/use-prefetch-guard";
import { getLucideIcon } from "@/lib/lucide-icons";
import { queryKeys } from "@/lib/query-keys";
import { createClient } from "@/lib/supabase/client";

type PaymentTypeRow = {
  id: string;
  name: string;
  icon: string;
  created_at: string;
};

const supabase = createClient();

async function fetchPaymentTypes(sheetId: string) {
  const { data, error } = await supabase
    .from("payment_types")
    .select("id, name, icon, created_at")
    .eq("sheet_id", sheetId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as PaymentTypeRow[];
}

export function PaymentTypeList({
  sheetId,
  canEditPaymentType,
  canAddPaymentType,
  addDialogOpen: controlledAddDialogOpen,
  onAddDialogOpenChangeAction,
}: {
  sheetId: string;
  canEditPaymentType: boolean;
  canAddPaymentType: boolean;
  addDialogOpen?: boolean;
  onAddDialogOpenChangeAction?: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { shouldPrefetch } = usePrefetchGuard();
  const [internalAddDialogOpen, setInternalAddDialogOpen] = useState(false);
  const [editingPaymentTypeId, setEditingPaymentTypeId] = useState<string | null>(null);
  const addDialogOpen = controlledAddDialogOpen ?? internalAddDialogOpen;
  const setAddDialogOpen = onAddDialogOpenChangeAction ?? setInternalAddDialogOpen;
  const paymentTypesQuery = useQuery({
    queryKey: queryKeys.paymentTypes(sheetId),
    queryFn: () => fetchPaymentTypes(sheetId),
  });
  const prefetchPaymentTypeForm = (paymentTypeId: string) => {
    if (!shouldPrefetch(`payment-type-form:${paymentTypeId}`)) {
      return;
    }

    void queryClient.prefetchQuery({
      queryKey: queryKeys.paymentTypeForm(sheetId, paymentTypeId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from("payment_types")
          .select("id, name, icon")
          .eq("sheet_id", sheetId)
          .eq("id", paymentTypeId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        return data;
      },
    });
  };

  if (paymentTypesQuery.isLoading && !paymentTypesQuery.data) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, idx) => (
          <Card key={idx} className="overflow-hidden">
            <CardContent className="h-20 animate-pulse bg-muted/40" />
          </Card>
        ))}
      </div>
    );
  }

  if (paymentTypesQuery.error) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Failed to load payment types.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => void paymentTypesQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const paymentTypeList = paymentTypesQuery.data ?? [];
  const isRefreshing = paymentTypesQuery.isFetching;

  if (paymentTypeList.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
        {addDialogOpen ? (
          <PaymentTypeFormDialog
            sheetId={sheetId}
            mode="add"
            open={true}
            onOpenChangeAction={setAddDialogOpen}
            onCancelAction={() => setAddDialogOpen(false)}
            onCompletedAction={() => setAddDialogOpen(false)}
          />
        ) : null}
        <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground">No payment types yet.</p>
        {canAddPaymentType ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setAddDialogOpen(true)}
          >
            Create your first one
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      <BackgroundSyncIndicator active={isRefreshing} />
      {addDialogOpen ? (
        <PaymentTypeFormDialog
          sheetId={sheetId}
          mode="add"
          open={true}
          onOpenChangeAction={setAddDialogOpen}
          onCancelAction={() => setAddDialogOpen(false)}
          onCompletedAction={() => setAddDialogOpen(false)}
        />
      ) : null}
      {editingPaymentTypeId ? (
        <PaymentTypeFormDialog
          sheetId={sheetId}
          mode="edit"
          paymentTypeId={editingPaymentTypeId}
          open={true}
          onOpenChangeAction={(open) => {
            if (!open) {
              setEditingPaymentTypeId(null);
            }
          }}
          onCancelAction={() => setEditingPaymentTypeId(null)}
          onCompletedAction={() => setEditingPaymentTypeId(null)}
        />
      ) : null}
      {paymentTypeList.map((paymentType) => {
        const Icon = getLucideIcon(paymentType.icon) || CreditCard;

        const content = (
          <Card className="overflow-hidden shadow-sm cursor-pointer hover:shadow-lg transition-all duration-300">
            <CardContent className="px-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{paymentType.name}</div>
                  <div className="text-xs text-muted-foreground pb-1">
                    {paymentType.icon}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

        return canEditPaymentType ? (
          <button
            key={paymentType.id}
            type="button"
            className="block w-full text-left"
            onMouseEnter={() => prefetchPaymentTypeForm(paymentType.id)}
            onFocus={() => prefetchPaymentTypeForm(paymentType.id)}
            onTouchStart={() => prefetchPaymentTypeForm(paymentType.id)}
            onClick={() => setEditingPaymentTypeId(paymentType.id)}
          >
            {content}
          </button>
        ) : (
          <div key={paymentType.id}>{content}</div>
        );
      })}
    </div>
  );
}
