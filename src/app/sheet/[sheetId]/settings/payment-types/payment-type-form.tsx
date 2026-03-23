"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { addPaymentType } from "./actions";
import {
  deletePaymentType,
  updatePaymentType,
} from "./actions";
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
import { IconPicker } from "@/components/icon-picker";
import type { FormErrors } from "@/lib/form-state";
import { queryKeys } from "@/lib/query-keys";

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
  onCompletedAction,
  onCancelAction,
}: {
  sheetId: string;
  mode?: "add" | "edit";
  initialData?: PaymentTypeFormData;
  onCompletedAction?: () => void;
  onCancelAction?: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedIcon, setSelectedIcon] = useState(initialData?.icon ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const formAction = mode === "edit" ? updatePaymentType : addPaymentType;
  const getFieldError = (field: string) => fieldErrors[field];

  const invalidateQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentTypes(sheetId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring(sheetId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(sheetId) }),
      queryClient.invalidateQueries({
        queryKey: ["sheet", sheetId, "transactions-overview"],
      }),
      queryClient.invalidateQueries({ queryKey: ["sheet", sheetId, "history"] }),
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
      console.error("Payment type form submission failed:", error);
      setFormError("Something went wrong while saving the payment type.");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const result = await deletePaymentType(new FormData(event.currentTarget));

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

      setDeleteError(result.error ?? "Failed to delete payment type.");
    } catch (error) {
      console.error("Payment type delete failed:", error);
      setDeleteError("Something went wrong while deleting the payment type.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="sheetId" value={sheetId} />
          <input type="hidden" name="icon" value={selectedIcon} />
          {mode === "edit" && initialData ? (
            <input type="hidden" name="paymentTypeId" value={initialData.id} />
          ) : null}

          {formError ? (
            <p className="text-sm font-medium text-destructive">
              {formError}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Debit Card"
              defaultValue={initialData?.name ?? ""}
              aria-invalid={Boolean(getFieldError("name"))}
            />
            {getFieldError("name") ? (
              <p className="text-xs font-medium text-destructive">
                {getFieldError("name")}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <IconPicker
              value={selectedIcon}
              onChangeAction={setSelectedIcon}
              icons={AVAILABLE_ICONS}
              maxRows={4}
            />
            {getFieldError("icon") ? (
              <p className="text-xs font-medium text-destructive">
                {getFieldError("icon")}
              </p>
            ) : null}
          </div>

          <div className="pt-2 space-y-4">
            <SubmitButton loading={loading} mode={mode} />
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
                    name="paymentTypeId"
                    value={initialData.id}
                  />
                  <DeleteButton loading={deleteLoading} />
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : null}
    </div>
  );
}

function SubmitButton({
  disabled = false,
  loading = false,
  mode,
}: {
  disabled?: boolean;
  loading?: boolean;
  mode: "add" | "edit";
}) {
  return (
    <LoadingButton
      type="submit"
      className="w-full"
      disabled={disabled}
      text={mode === "edit" ? "Update Payment Type" : "Create Payment Type"}
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
        text="Delete"
        loadingText="Deleting..."
        loading={loading}
        trackFormStatus={false}
      />
    </AlertDialogAction>
  );
}
