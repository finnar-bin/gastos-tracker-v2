"use client";

import { useState } from "react";
import { addRecurringTransaction } from "../add/actions";
import {
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from "../[recurringId]/edit/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Repeat, Loader2 } from "lucide-react";
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
import { useFormStatus } from "react-dom";
import { getLucideIcon } from "@/lib/lucide-icons";

interface Category {
  id: string;
  name: string;
  icon: string;
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
}: {
  sheetId: string;
  categories: Category[];
  paymentTypes: PaymentType[];
  mode?: "add" | "edit";
  initialData?: RecurringTransactionData;
}) {
  const [frequency, setFrequency] = useState<string>(
    initialData?.frequency ?? "monthly",
  );
  const [dayOfMonth, setDayOfMonth] = useState<string>(
    initialData?.dayOfMonth ?? "",
  );

  const isInvalidDay =
    frequency === "monthly" && dayOfMonth !== "" && parseInt(dayOfMonth) > 31;

  const formAction =
    mode === "edit" ? updateRecurringTransaction : addRecurringTransaction;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Repeat className="h-4 w-4" /> {mode === "edit" ? "Edit" : "New"}{" "}
          Template
        </CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="py-6 text-center space-y-4">
            <p className="text-muted-foreground">
              You haven&apos;t created any categories for this sheet yet. You
              need at least one category to set up a recurring transaction.
            </p>
            <Button asChild className="w-full">
              <Link href={`/sheet/${sheetId}/settings/category`}>
                Create Category
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href={`/sheet/${sheetId}/settings/recurring`}>Back</Link>
            </Button>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="sheetId" value={sheetId} />
            {mode === "edit" && initialData && (
              <input type="hidden" name="recurringId" value={initialData.id} />
            )}

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue={initialData?.type ?? "expense"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                defaultValue={initialData?.amount}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select
                name="categoryId"
                defaultValue={initialData?.categoryId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => {
                    const Icon = getLucideIcon(cat.icon);
                    return (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="w-4 h-4" />}
                          <span>{cat.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentType">Payment Type</Label>
              <Select
                name="paymentType"
                defaultValue={initialData?.paymentType}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTypes.map((pt) => {
                    const Icon = getLucideIcon(pt.icon);
                    return (
                      <SelectItem key={pt.id} value={pt.id}>
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="w-4 h-4" />}
                          <span>{pt.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                name="frequency"
                defaultValue={initialData?.frequency ?? "monthly"}
                onValueChange={(val) => setFrequency(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
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
                  isInvalidDay
                    ? "border-destructive text-destructive focus-visible:ring-destructive"
                    : ""
                }
              />
              {isInvalidDay && (
                <p className="text-[10px] text-destructive font-medium">
                  Day of month cannot exceed 31.
                </p>
              )}
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

            <div className="pt-4 space-y-2">
              <SubmitButton disabled={isInvalidDay} mode={mode} />
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/sheet/${sheetId}/settings/recurring`}>
                  Cancel
                </Link>
              </Button>
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
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <form
                    action={deleteRecurringTransaction}
                    className="mt-2 sm:mt-0"
                  >
                    <input type="hidden" name="sheetId" value={sheetId} />
                    <input
                      type="hidden"
                      name="recurringId"
                      value={initialData.id}
                    />
                    <DeleteButton />
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

function SubmitButton({
  disabled,
  mode,
}: {
  disabled: boolean;
  mode: "add" | "edit";
}) {
  const { pending } = useFormStatus();

  let content;
  if (pending) {
    content = (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {mode === "edit" ? "Saving..." : "Creating..."}
      </>
    );
  } else {
    content = mode === "edit" ? "Save Changes" : "Create Schedule";
  }

  return (
    <Button type="submit" className="w-full" disabled={disabled || pending}>
      {content}
    </Button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <AlertDialogAction asChild variant="destructive" disabled={pending}>
      <button type="submit">
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Deleting...
          </>
        ) : (
          "Confirm Delete"
        )}
      </button>
    </AlertDialogAction>
  );
}
