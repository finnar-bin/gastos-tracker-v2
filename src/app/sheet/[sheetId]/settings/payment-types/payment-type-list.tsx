"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
}: {
  sheetId: string;
  canEditPaymentType: boolean;
  canAddPaymentType: boolean;
}) {
  const paymentTypesQuery = useQuery({
    queryKey: queryKeys.paymentTypes(sheetId),
    queryFn: () => fetchPaymentTypes(sheetId),
  });

  if (paymentTypesQuery.isLoading) {
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

  if (paymentTypeList.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
        <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground">No payment types yet.</p>
        {canAddPaymentType ? (
          <Link
            href={`/sheet/${sheetId}/settings/payment-types/add`}
            className="mt-4 inline-block"
          >
            <Button variant="outline" size="sm">
              Create your first one
            </Button>
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
          <Link
            key={paymentType.id}
            href={`/sheet/${sheetId}/settings/payment-types/${paymentType.id}/edit`}
            className="block"
          >
            {content}
          </Link>
        ) : (
          <div key={paymentType.id}>{content}</div>
        );
      })}
    </div>
  );
}
