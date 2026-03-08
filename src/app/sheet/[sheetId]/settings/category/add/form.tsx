"use client";

import { useState } from "react";
import { addCategory } from "./actions";
import { updateCategory, deleteCategory } from "../[categoryId]/edit/actions";
import { Button } from "@/components/ui/button";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { IconPicker } from "@/components/icon-picker";

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
};

type CategoryFormProps = {
  sheetId: string;
  mode?: "add" | "edit";
  initialData?: CategoryFormData;
};

export default function CategoryForm({
  sheetId,
  mode = "add",
  initialData,
}: CategoryFormProps) {
  const [selectedIcon, setSelectedIcon] = useState(initialData?.icon ?? "");

  const formAction = mode === "edit" ? updateCategory : addCategory;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" /> Category Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="sheetId" value={sheetId} />
          <input type="hidden" name="icon" value={selectedIcon} />
          {mode === "edit" && initialData && (
            <input type="hidden" name="categoryId" value={initialData.id} />
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Food & Drinks"
              defaultValue={initialData?.name ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <IconPicker
              value={selectedIcon}
              onChangeAction={setSelectedIcon}
              icons={AVAILABLE_ICONS}
              maxRows={5}
            />
            {!selectedIcon && (
              <p className="text-[10px] text-destructive font-medium">
                Please select an icon for the category.
              </p>
            )}
          </div>

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
            <Label htmlFor="budget">Budget (Optional)</Label>
            <Input
              id="budget"
              name="budget"
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={initialData?.budget ?? ""}
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
              defaultValue={initialData?.defaultAmount ?? ""}
            />
          </div>

          {/* TODO: Figure out a better way to notify the users, since this could be recurring */}
          {/* <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={initialData?.dueDate ?? ""}
            />
            <div className="flex items-start gap-2 mt-1 text-[10px] text-muted-foreground">
              <Info className="h-3 w-3 mt-0.5" />
              <p>
                Setting a date here would enable due date notification, you will
                receive a notification every day 3 days before the set due date.
              </p>
            </div>
          </div> */}

          <div className="pt-4 space-y-4">
            <SubmitButton disabled={!selectedIcon} mode={mode} />
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/sheet/${sheetId}/settings/category`}>Cancel</Link>
            </Button>
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
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <form action={deleteCategory} className="mt-2 sm:mt-0">
                    <input type="hidden" name="sheetId" value={sheetId} />
                    <input
                      type="hidden"
                      name="categoryId"
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
  return (
    <LoadingButton
      type="submit"
      className="w-full"
      disabled={disabled}
      text={mode === "edit" ? "Save Changes" : "Create Category"}
      loadingText={mode === "edit" ? "Saving..." : "Creating..."}
    />
  );
}

function DeleteButton() {
  return (
    <AlertDialogAction asChild variant="destructive">
      <LoadingButton
        type="submit"
        variant="destructive"
        text="Confirm Delete"
        loadingText="Deleting..."
      />
    </AlertDialogAction>
  );
}
