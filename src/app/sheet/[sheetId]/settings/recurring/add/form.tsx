"use client";

import { useState } from "react";
import { addRecurringTransaction } from "./actions";
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
import { Repeat } from "lucide-react";
import * as LucideIcons from "lucide-react";

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

export default function RecurringTransactionForm({
  sheetId,
  categories,
  paymentTypes,
}: {
  sheetId: string;
  categories: Category[];
  paymentTypes: PaymentType[];
}) {
  const [frequency, setFrequency] = useState<string>("monthly");
  const [dayOfMonth, setDayOfMonth] = useState<string>("");

  const isInvalidDay =
    frequency === "monthly" && dayOfMonth !== "" && parseInt(dayOfMonth) > 31;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Repeat className="h-4 w-4" /> Transaction Template
        </CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="py-6 text-center space-y-4">
            <p className="text-muted-foreground">
              You haven't created any categories for this sheet yet. You need at
              least one category to set up a recurring transaction.
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
          <form action={addRecurringTransaction} className="space-y-4">
            <input type="hidden" name="sheetId" value={sheetId} />

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue="expense">
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
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select name="categoryId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="mr-2">{cat.icon}</span>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentType">Payment Type</Label>
              <Select name="paymentType" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTypes.map((pt) => {
                    const Icon = (LucideIcons as any)[pt.icon];
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
                defaultValue="monthly"
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
              />
            </div>

            <div className="pt-4 space-y-2">
              <Button type="submit" className="w-full" disabled={isInvalidDay}>
                Create Schedule
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/sheet/${sheetId}/settings/recurring`}>
                  Cancel
                </Link>
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
