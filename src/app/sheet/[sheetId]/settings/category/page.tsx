import { requireSheetAccess } from "@/lib/auth/sheets";
import { ArrowLeft, Plus, LayoutGrid, Calendar } from "lucide-react";
import Link from "next/link";
import { createElement } from "react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { getLucideIcon } from "@/lib/lucide-icons";
import { Header } from "@/components/Header";
import { FormattedAmount } from "@/components/formatted-amount";
import { getSheetCurrency } from "@/lib/sheet-settings";

export default async function CategorySettingsPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { permissions } = await requireSheetAccess(sheetId);
  const sheetCurrency = await getSheetCurrency(sheetId);

  const categoryList = await db
    .select()
    .from(categories)
    .where(eq(categories.sheetId, sheetId))
    .orderBy(desc(categories.createdAt));

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="Categories"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings`}
        icon={ArrowLeft}
        actions={
          permissions.canAddCategory ? (
            <Link href={`/sheet/${sheetId}/settings/category/add`}>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="space-y-4">
        {categoryList.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
            <LayoutGrid className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">No categories yet.</p>
            {permissions.canAddCategory ? (
              <Link
                href={`/sheet/${sheetId}/settings/category/add`}
                className="mt-4 inline-block"
              >
                <Button variant="outline" size="sm">
                  Create your first one
                </Button>
              </Link>
            ) : null}
          </div>
        ) : (
          categoryList.map((cat) => {
            const Icon = getLucideIcon(cat.icon) || LayoutGrid;
            const isExpense = cat.type === "expense";
            const content = (
              <Card className="overflow-hidden shadow-sm cursor-pointer hover:shadow-lg transition-all duration-300">
                <CardContent className="px-4 flex justify-between items-center">
                  <div className="flex w-full items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-xl ${
                          isExpense
                            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        {createElement(Icon, { className: "h-5 w-5" })}
                      </div>
                      <div>
                        <div className="font-medium">{cat.name}</div>
                        <div className="text-xs text-muted-foreground pb-1 capitalize">
                          {cat.type}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {cat.budget && (
                        <div
                          className={`text-sm font-bold ${
                            isExpense
                              ? "text-red-600 dark:text-red-400"
                              : "text-green-600 dark:text-green-400"
                          }`}
                        >
                          <FormattedAmount
                            amount={cat.budget}
                            showSign={false}
                            currency={sheetCurrency}
                          />{" "}
                          budget
                        </div>
                      )}
                      {cat.dueDate && (
                        <div className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(cat.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      {cat.dueReminderFrequency && (
                        <div className="text-[10px] text-muted-foreground capitalize">
                          Reminder: {cat.dueReminderFrequency.replace("_", " ")}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            return permissions.canEditCategory ? (
              <Link
                key={cat.id}
                href={`/sheet/${sheetId}/settings/category/${cat.id}/edit`}
                className="block"
              >
                {content}
              </Link>
            ) : (
              <div key={cat.id}>{content}</div>
            );
          })
        )}
      </div>
    </div>
  );
}
