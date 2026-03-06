"use client";

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
        <form action={removeSheetUser}>
          <input type="hidden" name="sheetId" value={sheetId} />
          <input type="hidden" name="targetUserId" value={targetUserId} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <ConfirmRemoveActionButton />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConfirmRemoveActionButton() {
  return (
    <AlertDialogAction asChild variant="destructive">
      <LoadingButton
        type="submit"
        variant="destructive"
        text="Remove User"
        loadingText="Removing..."
      />
    </AlertDialogAction>
  );
}
