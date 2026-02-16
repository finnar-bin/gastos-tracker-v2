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
import { db } from "@/lib/db";
import { sheets, categories, sheetUsers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export default async function AddTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { type: queryType } = await searchParams;
  const type = queryType || "expense";
  const isExpense = type === "expense";

  // 1. Get user sheets
  const userSheets = await db
    .select({ id: sheets.id, name: sheets.name })
    .from(sheets)
    .innerJoin(sheetUsers, eq(sheets.id, sheetUsers.sheetId))
    .where(eq(sheetUsers.userId, user.id));

  // 2. If no sheets, show a message
  if (userSheets.length === 0) {
    return (
      <div className="container max-w-md mx-auto p-4 flex items-center justify-center min-h-[80vh]">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>No Sheets Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You haven't been granted access to any sheets yet. Please create
              one or ask for access.
            </p>
            <Button className="w-full" asChild>
              <a href="/">Back to Dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedSheetId = userSheets[0].id;

  // 3. Get categories for the sheet
  const availableCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.sheetId, selectedSheetId));

  const filteredCategories = availableCategories.filter(
    (cat) => cat.type === type,
  );

  return (
    <div className="container max-w-md mx-auto p-4 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Add {isExpense ? "Expense" : "Income"}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCategories.length === 0 ? (
            <div className="space-y-4 py-4 text-center">
              <p className="text-muted-foreground">
                No categories found for this sheet. Please add some categories
                first.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="/">Back to Dashboard</a>
              </Button>
            </div>
          ) : (
            <form action={addTransaction} className="space-y-4">
              <input type="hidden" name="type" value={type} />
              <input type="hidden" name="sheetId" value={selectedSheetId} />

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
                <Label htmlFor="categoryId">Category</Label>
                <Select name="categoryId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="mr-2">{cat.icon}</span>
                        {cat.name}
                      </SelectItem>
                    ))}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
