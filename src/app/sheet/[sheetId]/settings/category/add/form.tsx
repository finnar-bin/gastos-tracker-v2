"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { addCategory } from "./actions";
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
import { LayoutGrid, Info, Loader2 } from "lucide-react";
import * as LucideIcons from "lucide-react";

const AVAILABLE_ICONS = [
  "Utensils",
  "Car",
  "Home",
  "ShoppingBag",
  "Zap",
  "Heart",
  "Smartphone",
  "Plane",
  "Gift",
  "Coffee",
  "Music",
  "Book",
];

export default function CategoryForm({ sheetId }: { sheetId: string }) {
  const [selectedIcon, setSelectedIcon] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" /> Category Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={addCategory} className="space-y-4">
          <input type="hidden" name="sheetId" value={sheetId} />
          <input type="hidden" name="icon" value={selectedIcon} />

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Food & Drinks"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-6 gap-2 p-2 border rounded-md">
              {AVAILABLE_ICONS.map((iconName) => {
                const Icon = (LucideIcons as any)[iconName];
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setSelectedIcon(iconName)}
                    className={`p-2 flex items-center justify-center rounded-md hover:bg-accent transition-colors ${
                      selectedIcon === iconName
                        ? "bg-primary/20 ring-2 ring-primary"
                        : ""
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
            {!selectedIcon && (
              <p className="text-[10px] text-destructive font-medium">
                Please select an icon for the category.
              </p>
            )}
          </div>

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
            <Label htmlFor="budget">Budget (Optional)</Label>
            <Input
              id="budget"
              name="budget"
              type="number"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultAmount">Default Amount (Optional)</Label>
            <Input
              id="defaultAmount"
              name="defaultAmount"
              type="number"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <Input id="dueDate" name="dueDate" type="date" />
            <div className="flex items-start gap-2 mt-1 text-[10px] text-muted-foreground">
              <Info className="h-3 w-3 mt-0.5" />
              <p>
                Setting a date here would enable due date notification, you will
                receive a notification every day 3 days before the set due date.
              </p>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <SubmitButton disabled={!selectedIcon} />
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/sheet/${sheetId}/settings/category`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={disabled || pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        "Create Category"
      )}
    </Button>
  );
}
