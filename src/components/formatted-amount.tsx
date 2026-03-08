"use client";

import { formatAmount } from "@/lib/util/format-amount";

type FormattedAmountProps = {
  amount: number | string | null | undefined;
  type?: "income" | "expense";
  showSign?: boolean;
  currency?: string;
};

export function FormattedAmount({
  amount,
  type,
  showSign = true,
  currency,
}: FormattedAmountProps) {
  const numericAmount =
    typeof amount === "number" ? amount : Number.parseFloat(amount ?? "");
  const absoluteAmount = Number.isFinite(numericAmount)
    ? Math.abs(numericAmount)
    : 0;

  let sign = "";
  if (showSign && type) {
    sign = type === "expense" ? "-" : "+";
  }

  return (
    <>
      {sign}
      {formatAmount(absoluteAmount, { currency })}
    </>
  );
}
