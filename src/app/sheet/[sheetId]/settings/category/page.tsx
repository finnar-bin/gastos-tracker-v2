import { requireSheetAccess } from "@/lib/auth/sheets";
import {
  ArrowLeft,
  Plus,
  LayoutGrid,
  Calendar,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import * as LucideIcons from "lucide-react";

export default async function CategorySettingsPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { sheet } = await requireSheetAccess(sheetId);

  const categoryList = await db
    .select()
    .from(categories)
    .where(eq(categories.sheetId, sheetId))
    .orderBy(desc(categories.createdAt));

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/sheet/${sheetId}/settings`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Categories</h1>
            <p className="text-sm text-muted-foreground">{sheet.name}</p>
          </div>
        </div>
        <Link href={`/sheet/${sheetId}/settings/category/add`}>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {categoryList.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
            <LayoutGrid className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">No categories yet.</p>
            <Link
              href={`/sheet/${sheetId}/settings/category/add`}
              className="mt-4 inline-block"
            >
              <Button variant="outline" size="sm">
                Create your first one
              </Button>
            </Link>
          </div>
        ) : (
          categoryList.map((cat) => {
            const Icon = (LucideIcons as any)[cat.icon] || LayoutGrid;
            return (
              <Card
                key={cat.id}
                className="overflow-hidden border-none shadow-sm bg-card hover:bg-accent/5 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{cat.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {cat.type}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {cat.budget && (
                        <div className="text-sm font-medium text-primary">
                          ${cat.budget} budget
                        </div>
                      )}
                      {cat.dueDate && (
                        <div className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(cat.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
