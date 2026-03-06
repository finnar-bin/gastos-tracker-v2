"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type LoadingButtonProps = React.ComponentProps<typeof Button> & {
  text: React.ReactNode;
  loadingText?: React.ReactNode;
  loading?: boolean;
  trackFormStatus?: boolean;
  showSpinner?: boolean;
};

export function LoadingButton({
  text,
  loadingText,
  loading,
  trackFormStatus = true,
  showSpinner = true,
  disabled,
  ...buttonProps
}: LoadingButtonProps) {
  const { pending } = useFormStatus();
  const isLoading = loading ?? (trackFormStatus ? pending : false);
  const label = isLoading ? (loadingText ?? text) : text;

  return (
    <Button {...buttonProps} disabled={disabled || isLoading}>
      {isLoading && showSpinner ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {label}
        </>
      ) : (
        label
      )}
    </Button>
  );
}
