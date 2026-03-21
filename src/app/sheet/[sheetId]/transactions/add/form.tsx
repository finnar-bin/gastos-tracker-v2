"use client";

import { useState } from "react";
import { addTransaction } from "./actions";
import {
  updateTransaction,
  deleteTransaction,
} from "../[transactionId]/edit/actions";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { CategoryPicker } from "@/components/category-picker";
import { PaymentTypePicker } from "@/components/payment-type-picker";
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

interface Category {
  id: string;
  name: string;
  icon: string;
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
}: {
  sheetId: string;
  categories: Category[];
  paymentTypes: PaymentType[];
  transactionType?: "income" | "expense";
  mode?: "add" | "edit";
  initialData?: TransactionData;
  cancelHref: string;
}) {
  const type = initialData?.type ?? transactionType ?? "expense";
  const isExpense = type === "expense";
  const titlePrefix = mode === "edit" ? "Edit" : "Add";
  const formAction = mode === "edit" ? updateTransaction : addTransaction;
  const [amount, setAmount] = useState(initialData?.amount ?? "");

  const handleCategoryChange = (categoryId: string) => {
    if (mode !== "add") return;
    const category = categories.find((item) => item.id === categoryId);
    if (category?.defaultAmount) {
      setAmount(category.defaultAmount);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ReceiptText className="h-4 w-4" />
          {titlePrefix} {isExpense ? "Expense" : "Income"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
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
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="sheetId" value={sheetId} />
            {mode === "edit" && initialData && (
              <input
                type="hidden"
                name="transactionId"
                value={initialData.id}
              />
            )}

            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <CategoryPicker
                categories={categories}
                name="categoryId"
                defaultValue={initialData?.categoryId}
                onValueChange={handleCategoryChange}
                placeholder="Select category"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
                autoFocus
              />
            </div>

            {isExpense && (
              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type</Label>
                <PaymentTypePicker
                  paymentTypes={paymentTypes}
                  name="paymentType"
                  defaultValue={initialData?.paymentType ?? undefined}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="date">Transaction Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={
                  initialData?.date ?? new Date().toISOString().split("T")[0]
                }
                required
              />
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
              />
              <Button variant="outline" className="w-full" asChild>
                <Link href={cancelHref}>Cancel</Link>
              </Button>
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
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <form action={deleteTransaction} className="mt-2 sm:mt-0">
                    <input type="hidden" name="sheetId" value={sheetId} />
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
                      />
                    </AlertDialogAction>
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
