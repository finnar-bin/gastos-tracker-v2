"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { createSheetInvite } from "./actions";
import type { FormErrors } from "@/lib/form-state";

type InviteUserDialogProps = {
  sheetId: string;
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
};

export function InviteUserDialog({
  sheetId,
  open,
  onOpenChangeAction,
}: InviteUserDialogProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setFormError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const result = await createSheetInvite(formData);

    setLoading(false);

    if (result?.error) {
      setFormError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }

    if (result?.inviteUrl) {
      try {
        await navigator.clipboard.writeText(result.inviteUrl);
      } catch {
        // Clipboard can fail in some browser contexts. This is non-critical.
      }
    }

    onOpenChangeAction(false);
    await queryClient.invalidateQueries({ queryKey: queryKeys.users(sheetId) });
  }

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto bg-card"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Invite User
            </DialogTitle>
            <DialogDescription>
              Enter an email address and choose role access.
            </DialogDescription>
          </DialogHeader>

          <input type="hidden" name="sheetId" value={sheetId} />
          {formError ? (
            <p className="text-sm font-medium text-destructive">{formError}</p>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              placeholder="teammate@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              aria-invalid={Boolean(fieldErrors.email)}
            />
            {fieldErrors.email ? (
              <p className="text-xs font-medium text-destructive">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label>Role</Label>
            <input type="hidden" name="role" value={role} />
            <Select
              value={role}
              onValueChange={(value) => {
                setRole(value);
                if (fieldErrors.role) {
                  setFieldErrors((prev) => ({ ...prev, role: undefined }));
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.role ? (
              <p className="text-xs font-medium text-destructive">
                {fieldErrors.role}
              </p>
            ) : null}
          </div>

          <div className="pt-2 space-y-4">
            <LoadingButton
              type="submit"
              className="w-full"
              text="Send Invite"
              loadingText="Sending..."
              loading={loading}
              trackFormStatus={false}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => onOpenChangeAction(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
