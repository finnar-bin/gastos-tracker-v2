import Link from "next/link";
import { ArrowLeft, CreditCard, Plus } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { requireSheetAccess } from "@/lib/auth/sheets";
import { db } from "@/lib/db";
import { paymentTypes } from "@/lib/db/schema";
import { getLucideIcon } from "@/lib/lucide-icons";

export default async function PaymentTypesSettingsPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  await requireSheetAccess(sheetId);

  const paymentTypeList = await db
    .select()
    .from(paymentTypes)
    .where(eq(paymentTypes.sheetId, sheetId))
    .orderBy(desc(paymentTypes.createdAt));

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="Payment Types"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings`}
        icon={ArrowLeft}
        actions={
          <Link href={`/sheet/${sheetId}/settings/payment-types/add`}>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </Link>
        }
      />

      <div className="space-y-4">
        {paymentTypeList.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">No payment types yet.</p>
            <Link
              href={`/sheet/${sheetId}/settings/payment-types/add`}
              className="mt-4 inline-block"
            >
              <Button variant="outline" size="sm">
                Create your first one
              </Button>
            </Link>
          </div>
        ) : (
          paymentTypeList.map((paymentType) => {
            const Icon = getLucideIcon(paymentType.icon) || CreditCard;

            return (
              <Link
                key={paymentType.id}
                href={`/sheet/${sheetId}/settings/payment-types/${paymentType.id}/edit`}
                className="block"
              >
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
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
