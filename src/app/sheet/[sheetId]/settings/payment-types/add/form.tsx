"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { addPaymentType } from "./actions";
import {
  deletePaymentType,
  updatePaymentType,
} from "../[paymentTypeId]/edit/actions";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconPicker } from "@/components/icon-picker";

export type PaymentTypeFormData = {
  id: string;
  name: string;
  icon: string;
};

const AVAILABLE_ICONS = [
  "CreditCard",
  "Coins",
  "Wallet",
  "Banknote",
  "Landmark",
  "Smartphone",
  "Receipt",
  "Building2",
  "PiggyBank",
  "BadgeDollarSign",
  "HandCoins",
  "CirclePoundSterling",
  "Euro",
  "CircleDollarSign",
  "Bitcoin",
];

export default function PaymentTypeForm({
  sheetId,
  mode = "add",
  initialData,
}: {
  sheetId: string;
  mode?: "add" | "edit";
  initialData?: PaymentTypeFormData;
}) {
  const [selectedIcon, setSelectedIcon] = useState(initialData?.icon ?? "");
  const formAction = mode === "edit" ? updatePaymentType : addPaymentType;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> Payment Type Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="sheetId" value={sheetId} />
          <input type="hidden" name="icon" value={selectedIcon} />
          {mode === "edit" && initialData ? (
            <input type="hidden" name="paymentTypeId" value={initialData.id} />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Debit Card"
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
              maxRows={4}
            />
            {!selectedIcon ? (
              <p className="text-[10px] text-destructive font-medium">
                Please select an icon for the payment type.
              </p>
            ) : null}
          </div>

          <div className="pt-4 space-y-4">
            <SubmitButton disabled={!selectedIcon} mode={mode} />
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/sheet/${sheetId}/settings/payment-types`}>
                Cancel
              </Link>
            </Button>
          </div>
        </form>

        {mode === "edit" && initialData ? (
          <div className="mt-8 pt-8 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Delete Payment Type
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. Existing transactions using
                    this payment type will keep their transaction data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <form action={deletePaymentType} className="mt-2 sm:mt-0">
                    <input type="hidden" name="sheetId" value={sheetId} />
                    <input
                      type="hidden"
                      name="paymentTypeId"
                      value={initialData.id}
                    />
                    <DeleteButton />
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : null}
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
      text={mode === "edit" ? "Update Payment Type" : "Create Payment Type"}
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
        text="Delete"
        loadingText="Deleting..."
      />
    </AlertDialogAction>
  );
}
