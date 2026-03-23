"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { addCategory } from "./actions";
import { updateCategory, deleteCategory } from "../[categoryId]/edit/actions";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { LoadingButton } from "@/components/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Info } from "lucide-react";
import { IconPicker } from "@/components/icon-picker";
import type { FormErrors } from "@/lib/form-state";
import { queryKeys } from "@/lib/query-keys";

export const AVAILABLE_ICONS = [
  // Food & Drinks
  "Utensils",
  "Coffee",
  "Wine",
  "ShoppingCart",
  // Transport
  "Car",
  "Fuel",
  "Bus",
  "Plane",
  "TrainFront",
  // Housing & Utilities
  "Home",
  "Zap",
  "Droplets",
  "Wifi",
  "Flame",
  // Shopping & Lifestyle
  "ShoppingBag",
  "Shirt",
  "Scissors",
  "Gift",
  "Gem",
  // Health & Wellness
  "Heart",
  "Stethoscope",
  "Dumbbell",
  "Pill",
  // Entertainment & Leisure
  "Music",
  "Gamepad2",
  "Tv",
  "Film",
  "PartyPopper",
  // Education & Work
  "Book",
  "GraduationCap",
  "Briefcase",
  "Laptop",
  // Finance & Savings
  "Wallet",
  "PiggyBank",
  "TrendingUp",
  "Landmark",
  // Tech & Communication
  "Smartphone",
  "CreditCard",
  // Income Streams
  "Banknote",
  "HandCoins",
  "CircleDollarSign",
  "Pen",
  "ChartLine",
  "Building2",
  "Store",
  "Handshake",
  // Other
  "Baby",
  "PawPrint",
  "Wrench",
];

export type CategoryFormData = {
  id: string;
  name: string;
  icon: string;
  type: "income" | "expense";
  budget: string | null;
  defaultAmount: string | null;
  dueDate: string | null;
  dueReminderFrequency: "specific_date" | "daily" | "weekly" | "monthly" | null;
};

type CategoryFormProps = {
  sheetId: string;
  mode?: "add" | "edit";
  initialData?: CategoryFormData;
  initialType?: "income" | "expense";
  onCompletedAction?: () => void;
  onCancelAction?: () => void;
};

export default function CategoryForm({
  sheetId,
  mode = "add",
  initialData,
  initialType = "expense",
  onCompletedAction,
  onCancelAction,
}: CategoryFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedIcon, setSelectedIcon] = useState(initialData?.icon ?? "");
  const [dueReminderFrequency, setDueReminderFrequency] = useState<
    "none" | "specific_date" | "daily" | "weekly" | "monthly"
  >(initialData?.dueReminderFrequency ?? "none");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const formAction = mode === "edit" ? updateCategory : addCategory;
  const getFieldError = (field: string) => fieldErrors[field];

  const invalidateQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["sheet", sheetId, "categories"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring(sheetId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(sheetId) }),
      queryClient.invalidateQueries({
        queryKey: ["sheet", sheetId, "transactions-overview"],
      }),
      queryClient.invalidateQueries({ queryKey: ["sheet", sheetId, "history"] }),
    ]);
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const result = await formAction(new FormData(event.currentTarget));

      if (result.success) {
        await invalidateQueries();
        onCompletedAction?.();
        return;
      }

      if (result.redirectTo) {
        await invalidateQueries();
        router.push(result.redirectTo);
        return;
      }

      setFormError(result.error ?? "Please review the form and try again.");
      setFieldErrors(result.fieldErrors ?? {});
    } catch (error) {
      console.error("Category form submission failed:", error);
      setFormError("Something went wrong while saving the category.");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const result = await deleteCategory(new FormData(event.currentTarget));

      if (result.success) {
        await invalidateQueries();
        onCompletedAction?.();
        return;
      }

      if (result.redirectTo) {
        await invalidateQueries();
        router.push(result.redirectTo);
        return;
      }

      setDeleteError(result.error ?? "Failed to delete category.");
    } catch (error) {
      console.error("Category delete failed:", error);
      setDeleteError("Something went wrong while deleting the category.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="sheetId" value={sheetId} />
          <input type="hidden" name="icon" value={selectedIcon} />
          {mode === "edit" && initialData && (
            <input type="hidden" name="categoryId" value={initialData.id} />
          )}

          {formError ? (
            <p className="text-sm font-medium text-destructive">
              {formError}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Food & Drinks"
              defaultValue={initialData?.name ?? ""}
                onFocus={(event) => {
                  const input = event.currentTarget;
                  if (
                  input.selectionStart === 0 &&
                  input.selectionEnd === input.value.length
                ) {
                  window.requestAnimationFrame(() => {
                    const length = input.value.length;
                    input.setSelectionRange(length, length);
                  });
                }
              }}
              aria-invalid={Boolean(getFieldError("name"))}
            />
            {getFieldError("name") ? (
              <p className="text-xs font-medium text-destructive">
                {getFieldError("name")}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <IconPicker
              value={selectedIcon}
              onChangeAction={setSelectedIcon}
              icons={AVAILABLE_ICONS}
              maxRows={5}
            />
            {getFieldError("icon") ? (
              <p className="text-xs font-medium text-destructive">
                {getFieldError("icon")}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select name="type" defaultValue={initialData?.type ?? initialType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            {getFieldError("type") ? (
              <p className="text-xs font-medium text-destructive">
                {getFieldError("type")}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget (Optional)</Label>
            <Input
              id="budget"
              name="budget"
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={initialData?.budget ?? ""}
              aria-invalid={Boolean(getFieldError("budget"))}
            />
            {getFieldError("budget") ? (
              <p className="text-xs font-medium text-destructive">
                {getFieldError("budget")}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultAmount">Default Amount (Optional)</Label>
            <Input
              id="defaultAmount"
              name="defaultAmount"
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={initialData?.defaultAmount ?? ""}
              aria-invalid={Boolean(getFieldError("defaultAmount"))}
            />
            {getFieldError("defaultAmount") ? (
              <p className="text-xs font-medium text-destructive">
                {getFieldError("defaultAmount")}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <DateInput
              id="dueDate"
              name="dueDate"
              defaultValue={initialData?.dueDate ?? ""}
            />
            <div className="flex items-start gap-2 mt-1 text-[10px] text-muted-foreground">
              <Info className="h-3 w-3 mt-0.5" />
              <p>
                Due date reminders trigger at 8:00 AM in your local timezone.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueReminderFrequency">Reminder Frequency</Label>
            <Select
              name="dueReminderFrequency"
              value={dueReminderFrequency}
              onValueChange={(value) =>
                setDueReminderFrequency(
                  value as
                    | "none"
                    | "specific_date"
                    | "daily"
                    | "weekly"
                    | "monthly",
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No reminder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No reminder</SelectItem>
                <SelectItem value="specific_date">
                  Specific date only
                </SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Choose how often you want to be reminded once a due date is set.
            </p>
          </div>

          <div className="pt-2 space-y-4">
            <SubmitButton
              loading={loading}
              mode={mode}
            />
            {onCancelAction ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onCancelAction}
              >
                Cancel
              </Button>
            ) : null}
          </div>
      </form>

      {mode === "edit" && initialData && (
        <div className="mt-8 pt-8 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                Delete Category
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  the category and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {deleteError ? (
                <p className="text-sm font-medium text-destructive">
                  {deleteError}
                </p>
              ) : null}
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <form onSubmit={onDelete} className="mt-2 sm:mt-0">
                  <input type="hidden" name="sheetId" value={sheetId} />
                  <input
                    type="hidden"
                    name="categoryId"
                    value={initialData.id}
                  />
                  <DeleteButton loading={deleteLoading} />
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}

function SubmitButton({
  disabled = false,
  loading = false,
  mode,
}: {
  disabled?: boolean;
  loading?: boolean;
  mode: "add" | "edit";
}) {
  return (
    <LoadingButton
      type="submit"
      className="w-full"
      disabled={disabled}
      text={mode === "edit" ? "Save Changes" : "Create Category"}
      loadingText={mode === "edit" ? "Saving..." : "Creating..."}
      loading={loading}
      trackFormStatus={false}
    />
  );
}

function DeleteButton({
  loading = false,
}: {
  loading?: boolean;
}) {
  return (
    <AlertDialogAction asChild variant="destructive">
      <LoadingButton
        type="submit"
        variant="destructive"
        text="Confirm Delete"
        loadingText="Deleting..."
        loading={loading}
        trackFormStatus={false}
      />
    </AlertDialogAction>
  );
}
