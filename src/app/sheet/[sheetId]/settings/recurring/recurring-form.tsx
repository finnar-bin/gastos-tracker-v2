"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { addRecurringTransaction } from "./actions";
import {
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from "./actions";
import { Button } from "@/components/ui/button";
import { CategoryPicker } from "@/components/category-picker";
import { LoadingButton } from "@/components/loading-button";
import { PaymentTypePicker } from "@/components/payment-type-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { MAX_DECIMAL_AMOUNT } from "@/lib/validation/amount";
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
import type { FormErrors } from "@/lib/form-state";
import { queryKeys } from "@/lib/query-keys";

interface Category {
  id: string;
  name: string;
  icon: string;
  type: "income" | "expense";
  defaultAmount?: string | null;
}

interface PaymentType {
  id: string;
  name: string;
  icon: string;
}

export interface RecurringTransactionData {
  id: string;
  amount: string;
  type: "income" | "expense";
  description: string | null;
  frequency: string;
  dayOfMonth: string | null;
  categoryId: string;
  paymentType: string;
}

export default function RecurringTransactionForm({
  sheetId,
  categories,
  paymentTypes,
  mode = "add",
  initialData,
  onCompletedAction,
  onCancelAction,
}: {
  sheetId: string;
  categories: Category[];
  paymentTypes: PaymentType[];
  mode?: "add" | "edit";
  initialData?: RecurringTransactionData;
  onCompletedAction?: () => void;
  onCancelAction?: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const initialType = initialData?.type ?? "";
  const [transactionType, setTransactionType] = useState<
    "income" | "expense" | ""
  >(initialType);
  const [frequency, setFrequency] = useState<string>(
    initialData?.frequency ?? "",
  );
  const [amount, setAmount] = useState<string>(initialData?.amount ?? "");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    initialData?.categoryId ?? "",
  );
  const [dayOfMonth, setDayOfMonth] = useState<string>(
    initialData?.dayOfMonth ?? "",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isInvalidDay =
    frequency === "monthly" && dayOfMonth !== "" && parseInt(dayOfMonth) > 31;

  const formAction =
    mode === "edit" ? updateRecurringTransaction : addRecurringTransaction;
  const getFieldError = (field: string) => fieldErrors[field];

  const filteredCategories = categories.filter(
    (category) => category.type === transactionType,
  );
  const resolvedCategoryId = filteredCategories.some(
    (category) => category.id === selectedCategoryId,
  )
    ? selectedCategoryId
    : "";

  const handleTypeChange = (value: string) => {
    const nextType = value as "income" | "expense" | "";
    setTransactionType(nextType);
    if (mode === "add") {
      setSelectedCategoryId("");
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const invalidateQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring(sheetId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(sheetId) }),
      queryClient.invalidateQueries({ queryKey: ["sheet", sheetId, "history"] }),
      queryClient.invalidateQueries({
        queryKey: ["sheet", sheetId, "transactions-overview"],
      }),
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
      console.error("Recurring transaction form submission failed:", error);
      setFormError(
        "Something went wrong while saving the recurring transaction.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const result = await deleteRecurringTransaction(
        new FormData(event.currentTarget),
      );

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

      setDeleteError(result.error ?? "Failed to delete recurring schedule.");
    } catch (error) {
      console.error("Recurring schedule delete failed:", error);
      setDeleteError(
        "Something went wrong while deleting the recurring schedule.",
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      {transactionType !== "" && filteredCategories.length === 0 ? (
        <div className="py-6 text-center space-y-4">
            <p className="text-muted-foreground">
              You haven&apos;t created any {transactionType} categories for this
              sheet yet. You need at least one category to set up a recurring
              transaction.
            </p>
            <Button asChild className="w-full">
              <Link href={`/sheet/${sheetId}/settings/category`}>
                Create Category
              </Link>
            </Button>
            {onCancelAction ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onCancelAction}
              >
                Back
              </Button>
            ) : null}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
            <input type="hidden" name="sheetId" value={sheetId} />
            {mode === "edit" && initialData && (
              <input type="hidden" name="recurringId" value={initialData.id} />
            )}

            {formError ? (
              <p className="text-sm font-medium text-destructive">
                {formError}
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                name="type"
                value={transactionType === "" ? undefined : transactionType}
                onValueChange={handleTypeChange}
              >
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
              <Label htmlFor="categoryId">Category</Label>
              <CategoryPicker
                categories={filteredCategories}
                name="categoryId"
                value={resolvedCategoryId}
                onValueChangeAction={handleCategoryChange}
                placeholder="Select category"
                triggerClassName={
                  getFieldError("categoryId")
                    ? "border-destructive focus-visible:ring-destructive"
                    : undefined
                }
              />
              {getFieldError("categoryId") ? (
                <p className="text-xs font-medium text-destructive">
                  {getFieldError("categoryId")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={MAX_DECIMAL_AMOUNT}
                placeholder="0.00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                aria-invalid={Boolean(getFieldError("amount"))}
              />
              {getFieldError("amount") ? (
                <p className="text-xs font-medium text-destructive">
                  {getFieldError("amount")}
                </p>
              ) : null}
            </div>

            {transactionType === "expense" && (
              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type</Label>
                <PaymentTypePicker
                  paymentTypes={paymentTypes}
                  name="paymentType"
                  defaultValue={initialData?.paymentType}
                  triggerClassName={
                    getFieldError("paymentType")
                      ? "border-destructive focus-visible:ring-destructive"
                      : undefined
                  }
                />
                {getFieldError("paymentType") ? (
                  <p className="text-xs font-medium text-destructive">
                    {getFieldError("paymentType")}
                  </p>
                ) : null}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                name="frequency"
                value={frequency === "" ? undefined : frequency}
                onValueChange={(val) => setFrequency(val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              {getFieldError("frequency") ? (
                <p className="text-xs font-medium text-destructive">
                  {getFieldError("frequency")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="dayOfMonth"
                className={frequency !== "monthly" ? "opacity-50" : ""}
              >
                Day of Month (for Monthly)
              </Label>
              <Input
                id="dayOfMonth"
                name="dayOfMonth"
                type="number"
                min="1"
                max="31"
                placeholder="e.g. 5"
                disabled={frequency !== "monthly"}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                className={
                  isInvalidDay || Boolean(getFieldError("dayOfMonth"))
                    ? "border-destructive text-destructive focus-visible:ring-destructive"
                    : ""
                }
              />
              {getFieldError("dayOfMonth") ? (
                <p className="text-[10px] text-destructive font-medium">
                  {getFieldError("dayOfMonth")}
                </p>
              ) : isInvalidDay ? (
                <p className="text-[10px] text-destructive font-medium">
                  Day of month cannot exceed 31.
                </p>
              ) : null}
              <p className="text-[10px] text-muted-foreground">
                {frequency === "monthly"
                  ? "Select which day of the month this should trigger."
                  : 'Only applicable if "Monthly" is selected.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="e.g. Monthly Rent"
                defaultValue={initialData?.description ?? ""}
              />
            </div>

            <div className="pt-2 space-y-4">
              <SubmitButton disabled={isInvalidDay} loading={loading} mode={mode} />
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
      )}

      {mode === "edit" && initialData && (
        <div className="mt-8 pt-8 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                Delete Schedule
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this recurring schedule. Past
                  transactions will not be affected.
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
                    name="recurringId"
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
  disabled,
  loading = false,
  mode,
}: {
  disabled: boolean;
  loading?: boolean;
  mode: "add" | "edit";
}) {
  return (
    <LoadingButton
      type="submit"
      className="w-full"
      disabled={disabled}
      text={mode === "edit" ? "Save Changes" : "Create Schedule"}
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
