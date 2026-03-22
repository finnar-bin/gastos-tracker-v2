"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/loading-button";
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
import { queryKeys } from "@/lib/query-keys";
import { removeSheetUser } from "./actions";

type RemoveUserButtonProps = {
  sheetId: string;
  targetUserId: string;
  targetLabel: string;
};

export function RemoveUserButton({
  sheetId,
  targetUserId,
  targetLabel,
}: RemoveUserButtonProps) {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    await removeSheetUser(formData);
    await queryClient.invalidateQueries({ queryKey: queryKeys.users(sheetId) });

    setSubmitting(false);
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive" className="h-7">
          <UserMinus className="h-3.5 w-3.5" />
          Remove
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove User?</AlertDialogTitle>
          <AlertDialogDescription>
            This action is irreversible. This will remove{" "}
            <strong>{targetLabel}</strong> from this sheet and they will
            immediately lose access.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <input type="hidden" name="sheetId" value={sheetId} />
          <input type="hidden" name="targetUserId" value={targetUserId} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <ConfirmRemoveActionButton submitting={submitting} />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConfirmRemoveActionButton({ submitting }: { submitting: boolean }) {
  return (
    <AlertDialogAction asChild variant="destructive">
      <LoadingButton
        type="submit"
        variant="destructive"
        loading={submitting}
        text="Remove User"
        loadingText="Removing..."
      />
    </AlertDialogAction>
  );
}
