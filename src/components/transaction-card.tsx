import { createElement } from "react";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { FormattedAmount } from "@/components/formatted-amount";
import { getLucideIcon } from "@/lib/lucide-icons";

type TransactionHistoryCardData = {
  id: string;
  amount: string;
  type: "income" | "expense";
  description: string | null;
  date: string;
  categoryName: string;
  categoryIcon: string;
  paymentTypeName: string | null;
  paymentTypeIcon: string | null;
  creatorDisplayName: string | null;
  creatorEmail: string | null;
  creatorAvatarUrl: string | null;
};

export function TransactionCard({
  sheetId,
  tx,
  returnTo,
  currency,
  canEditTransaction = true,
}: {
  sheetId: string;
  tx: TransactionHistoryCardData;
  returnTo?: string;
  currency?: string;
  canEditTransaction?: boolean;
}) {
  const categoryIcon = getLucideIcon(tx.categoryIcon) || LayoutGrid;
  const paymentIcon = tx.paymentTypeIcon
    ? getLucideIcon(tx.paymentTypeIcon)
    : null;
  const creatorName =
    tx.creatorDisplayName || tx.creatorEmail || "Unknown user";

  const editParams = new URLSearchParams();
  if (returnTo) {
    editParams.set("returnTo", returnTo);
  }
  const editHref = `/sheet/${sheetId}/transactions/${tx.id}/edit${
    editParams.size > 0 ? `?${editParams.toString()}` : ""
  }`;

  const content = (
    <Card className="overflow-hidden shadow-sm cursor-pointer hover:shadow-lg transition-all duration-300">
      <CardContent className="px-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center text-xl ${
              tx.type === "expense"
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            }`}
          >
            {createElement(categoryIcon, { className: "h-5 w-5" })}
          </div>
          <div>
            <p className="font-medium capitalize flex items-center gap-2">
              {tx.description || tx.categoryName}
              {paymentIcon && (
                <span
                  className="bg-secondary text-secondary-foreground p-1 rounded-md"
                  title={tx.paymentTypeName || "Payment Method"}
                >
                  {createElement(paymentIcon, { className: "w-3 h-3" })}
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground pb-1">
              {new Date(tx.date).toLocaleDateString()}
            </p>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <UserAvatar
                email={tx.creatorEmail}
                displayName={tx.creatorDisplayName}
                avatarUrl={tx.creatorAvatarUrl}
                size="xs"
              />
              <span>{creatorName}</span>
            </div>
          </div>
        </div>
        <div
          className={`font-bold ${tx.type === "expense" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
        >
          <FormattedAmount
            amount={tx.amount}
            type={tx.type}
            currency={currency}
          />
        </div>
      </CardContent>
    </Card>
  );

  if (!canEditTransaction) {
    return content;
  }

  return (
    <Link href={editHref} className="block">
      {content}
    </Link>
  );
}
