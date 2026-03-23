"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LayoutGrid } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export function CategoryFormDialog({
  sheetId,
  mode = "edit",
  categoryId,
  initialType = "expense",
  returnType,
  inPlace = false,
  asDialog = false,
  open = false,
  onOpenChangeAction,
  onCancelAction,
  onCompletedAction,
}: {
  sheetId: string;
  mode?: "add" | "edit";
  categoryId?: string;
  initialType?: "income" | "expense";
  returnType: "income" | "expense";
  inPlace?: boolean;
  asDialog?: boolean;
  open?: boolean;
  onOpenChangeAction?: (open: boolean) => void;
  onCancelAction?: () => void;
  onCompletedAction?: () => void;
}) {
  const enabled = mode === "edit" && Boolean(categoryId);
  const categoryQuery = useQuery({
    queryKey: queryKeys.categoryForm(sheetId, categoryId ?? "new"),
    enabled: (asDialog ? open : true) && enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, icon, type, budget, default_amount, due_date, due_reminder_frequency")
        .eq("sheet_id", sheetId)
        .eq("id", categoryId!)
        .maybeSingle();

      if (error) throw error;
      return data as CategoryRow | null;
    },
  });

  const content = useMemo(() => {
    if (mode === "add") {
      return (
        <CategoryForm
          sheetId={sheetId}
          mode="add"
          initialType={initialType}
          returnType={returnType}
          inPlace={inPlace}
          onCancelAction={onCancelAction}
          onCompletedAction={onCompletedAction}
        />
      );
    }

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
        inPlace={inPlace}
        onCancelAction={onCancelAction}
        onCompletedAction={onCompletedAction}
      />
    );
  }, [
    categoryQuery.data,
    categoryQuery.error,
    categoryQuery.isLoading,
    categoryQuery.refetch,
    inPlace,
    initialType,
    mode,
    onCancelAction,
    onCompletedAction,
    returnType,
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
            <LayoutGrid className="h-5 w-5 text-primary" />
            {mode === "edit" ? "Edit Category" : "Add Category"}
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
