import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addTransaction } from "./actions";
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

export default async function AddTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type: queryType } = await searchParams;
  const type = queryType || "expense";
  const isExpense = type === "expense";

  return (
    <div className="container max-w-md mx-auto p-4 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Add {isExpense ? "Expense" : "Income"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addTransaction} className="space-y-4">
            <input type="hidden" name="type" value={type} />

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select name="category" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {isExpense ? (
                    <>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="entertainment">
                        Entertainment
                      </SelectItem>
                      <SelectItem value="shopping">Shopping</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="housing">Housing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="salary">Salary</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="gift">Gift</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="Optional note"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <Button type="submit" className="w-full">
                Save
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href="/">Cancel</a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
