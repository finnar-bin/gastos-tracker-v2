"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/query-keys";
import { createClient } from "@/lib/supabase/client";
import CategoryForm, { type CategoryFormData } from "./add/form";

type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  type: "income" | "expense";
  budget: string | null;
  default_amount: string | null;
  due_date: string | null;
  due_reminder_frequency: "specific_date" | "daily" | "weekly" | "monthly" | null;
};

const supabase = createClient();

export function CategoryFormLoader({
  sheetId,
  categoryId,
  returnType,
}: {
  sheetId: string;
  categoryId: string;
  returnType: "income" | "expense";
}) {
  const categoryQuery = useQuery({
    queryKey: queryKeys.categoryForm(sheetId, categoryId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, icon, type, budget, default_amount, due_date, due_reminder_frequency")
        .eq("sheet_id", sheetId)
        .eq("id", categoryId)
        .maybeSingle();

      if (error) throw error;
      return data as CategoryRow | null;
    },
  });

  if (categoryQuery.isLoading) {
    return <div className="h-80 rounded-xl bg-muted/40 animate-pulse" />;
  }

  if (categoryQuery.error) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">Failed to load category.</p>
        <Button variant="outline" className="mt-4" onClick={() => void categoryQuery.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!categoryQuery.data) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">Category not found.</p>
      </div>
    );
  }

  const initialData: CategoryFormData = {
    id: categoryQuery.data.id,
    name: categoryQuery.data.name,
    icon: categoryQuery.data.icon,
    type: categoryQuery.data.type,
    budget: categoryQuery.data.budget,
    defaultAmount: categoryQuery.data.default_amount,
    dueDate: categoryQuery.data.due_date,
    dueReminderFrequency: categoryQuery.data.due_reminder_frequency,
  };

  return (
    <CategoryForm
      sheetId={sheetId}
      mode="edit"
      initialData={initialData}
      returnType={returnType}
    />
  );
}
