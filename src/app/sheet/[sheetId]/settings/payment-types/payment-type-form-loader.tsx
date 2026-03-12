"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import PaymentTypeForm, { type PaymentTypeFormData } from "./add/form";

type PaymentTypeRow = {
  id: string;
  name: string;
  icon: string;
};

const supabase = createClient();

export function PaymentTypeFormLoader({
  sheetId,
  paymentTypeId,
}: {
  sheetId: string;
  paymentTypeId: string;
}) {
  const paymentTypeQuery = useQuery({
    queryKey: ["sheet", sheetId, "payment-type-form", paymentTypeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_types")
        .select("id, name, icon")
        .eq("sheet_id", sheetId)
        .eq("id", paymentTypeId)
        .maybeSingle();

      if (error) throw error;
      return data as PaymentTypeRow | null;
    },
  });

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

  return <PaymentTypeForm sheetId={sheetId} mode="edit" initialData={initialData} />;
}
