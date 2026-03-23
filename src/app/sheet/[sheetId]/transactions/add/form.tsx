"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { addTransaction } from "./actions";
import {
  updateTransaction,
  deleteTransaction,
} from "../[transactionId]/edit/actions";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { LoadingButton } from "@/components/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { CategoryPicker } from "@/components/category-picker";
import { PaymentTypePicker } from "@/components/payment-type-picker";
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

export interface TransactionData {
  id: string;
  amount: string;
  type: "income" | "expense";
  description: string | null;
  date: string;
  categoryId: string;
  paymentType: string | null;
}

export default function TransactionForm({
  sheetId,
  categories,
  paymentTypes,
  transactionType,
  mode = "add",
  initialData,
  cancelHref,
  inPlace = false,
  onCompletedAction,
  onCancelAction,
  onTypeChangeAction,
}: {
  sheetId: string;
  categories: Category[];
  paymentTypes: PaymentType[];
  transactionType?: "income" | "expense";
  mode?: "add" | "edit";
  initialData?: TransactionData;
  cancelHref: string;
  inPlace?: boolean;
  onCompletedAction?: () => void;
  onCancelAction?: () => void;
  onTypeChangeAction?: (nextType: "income" | "expense") => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [type, setType] = useState<"income" | "expense">(
    initialData?.type ?? transactionType ?? "expense",
  );
  const isExpense = type === "expense";
  const formAction = mode === "edit" ? updateTransaction : addTransaction;
  const [amount, setAmount] = useState(initialData?.amount ?? "");
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialData?.categoryId ?? "",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredCategories = categories.filter((item) => item.type === type);
  const resolvedCategoryId = filteredCategories.some(
    (category) => category.id === selectedCategoryId,
  )
    ? selectedCategoryId
    : "";
  const handleTypeChange = (nextType: "income" | "expense") => {
    if (mode !== "add") {
      return;
    }

    setType(nextType);
    setSelectedCategoryId("");
    onTypeChangeAction?.(nextType);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    if (mode !== "add") return;
    const category = filteredCategories.find((item) => item.id === categoryId);
    if (category?.defaultAmount) {
      setAmount(category.defaultAmount);
    }
  };

  const getFieldError = (field: string) => fieldErrors[field];
  const invalidateTransactionQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["sheet", sheetId, "history"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(sheetId) }),
      queryClient.invalidateQueries({
        queryKey: ["sheet", sheetId, "transactions-overview"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["sheet", sheetId, "category-transactions"],
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

      if (result.success && inPlace) {
        await invalidateTransactionQueries();
        onCompletedAction?.();
        return;
      }

      if (result.redirectTo) {
        await invalidateTransactionQueries();
        router.push(result.redirectTo);
        return;
      }

      setFormError(result.error ?? "Please review the form and try again.");
      setFieldErrors(result.fieldErrors ?? {});
    } catch (error) {
      console.error("Transaction form submission failed:", error);
      setFormError("Something went wrong while saving the transaction.");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const result = await deleteTransaction(new FormData(event.currentTarget));

      if (result.success && inPlace) {
        await invalidateTransactionQueries();
        onCompletedAction?.();
        return;
      }

      if (result.redirectTo) {
        await invalidateTransactionQueries();
        router.push(result.redirectTo);
        return;
      }

      setDeleteError(result.error ?? "Failed to delete transaction.");
    } catch (error) {
      console.error("Transaction delete failed:", error);
      setDeleteError("Something went wrong while deleting the transaction.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      {filteredCategories.length === 0 ? (
          <div className="space-y-4 py-6 text-center">
            <p className="text-muted-foreground">
              No categories found for this sheet (type: {type}). Please add some
              categories first.
            </p>
            <Button asChild className="w-full">
              <Link href={`/sheet/${sheetId}/settings/category`}>
                Create Category
              </Link>
            </Button>
            <div className="pt-2 space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href={cancelHref}>Cancel</Link>
              </Button>
            </div>
          </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="sheetId" value={sheetId} />
            <input type="hidden" name="returnTo" value={cancelHref} />
            <input type="hidden" name="inPlace" value={inPlace ? "1" : "0"} />
            {mode === "edit" && initialData && (
              <input
                type="hidden"
                name="transactionId"
                value={initialData.id}
              />
            )}

            {formError ? (
              <p className="text-sm font-medium text-destructive">
                {formError}
              </p>
            ) : null}
            {mode === "add" ? (
              <div className="inline-flex w-full rounded-lg border border-border bg-muted/30 p-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleTypeChange("expense")}
                  className={`h-9 flex-1 rounded-md ${
                    type === "expense"
                      ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/95"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Expense
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleTypeChange("income")}
                  className={`h-9 flex-1 rounded-md ${
                    type === "income"
                      ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/95"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Income
                </Button>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <CategoryPicker
                categories={filteredCategories}
                name="categoryId"
                value={resolvedCategoryId}
                onValueChangeAction={handleCategoryChange}
                placeholder="Select category"
                required
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
                autoFocus={!inPlace}
                aria-invalid={Boolean(getFieldError("amount"))}
              />
              {getFieldError("amount") ? (
                <p className="text-xs font-medium text-destructive">
                  {getFieldError("amount")}
                </p>
              ) : null}
            </div>

            {isExpense && (
              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type</Label>
                <PaymentTypePicker
                  paymentTypes={paymentTypes}
                  name="paymentType"
                  defaultValue={initialData?.paymentType ?? undefined}
                  required
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
              <Label htmlFor="date">Transaction Date</Label>
              <DateInput
                id="date"
                name="date"
                defaultValue={
                  initialData?.date ?? new Date().toISOString().split("T")[0]
                }
                required
                aria-invalid={Boolean(getFieldError("date"))}
              />
              {getFieldError("date") ? (
                <p className="text-xs font-medium text-destructive">
                  {getFieldError("date")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Optional note"
                defaultValue={initialData?.description ?? ""}
              />
            </div>

            <div className="pt-4 space-y-4">
              <LoadingButton
                type="submit"
                className="w-full"
                text={mode === "edit" ? "Save Changes" : "Save"}
                loadingText={mode === "edit" ? "Saving..." : "Saving..."}
                loading={loading}
                trackFormStatus={false}
              />
              {inPlace ? (
                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  onClick={onCancelAction}
                >
                  Cancel
                </Button>
              ) : (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={cancelHref}>Cancel</Link>
                </Button>
              )}
            </div>
        </form>
      )}

      {mode === "edit" && initialData && (
        <div className="mt-8 pt-8 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                Delete Transaction
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this transaction.
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
                  <input type="hidden" name="returnTo" value={cancelHref} />
                  <input type="hidden" name="inPlace" value={inPlace ? "1" : "0"} />
                  <input
                    type="hidden"
                    name="transactionId"
                    value={initialData.id}
                  />
                  <AlertDialogAction asChild variant="destructive">
                    <LoadingButton
                      type="submit"
                      variant="destructive"
                      text="Confirm Delete"
                      loadingText="Deleting..."
                      loading={deleteLoading}
                      trackFormStatus={false}
                    />
                  </AlertDialogAction>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
