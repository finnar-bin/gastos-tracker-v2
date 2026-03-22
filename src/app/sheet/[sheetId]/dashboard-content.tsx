"use client";

import { createElement } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  History,
  CreditCard,
  LayoutGrid,
  ChartLine,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormattedAmount } from "@/components/formatted-amount";
import { UserAvatar } from "@/components/user-avatar";
import { fetchDashboardSummary } from "@/lib/dashboard-summary";
import { getLucideIcon } from "@/lib/lucide-icons";
import { queryKeys } from "@/lib/query-keys";
import { fetchSheetCurrency } from "@/lib/sheet-currency";

export function DashboardContent({ sheetId }: { sheetId: string }) {
  const now = new Date();
  const currencyQuery = useQuery({
    queryKey: queryKeys.sheetCurrency(sheetId),
    queryFn: () => fetchSheetCurrency(sheetId),
  });
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard(sheetId),
    queryFn: () =>
      fetchDashboardSummary({
        sheetId,
        year: now.getFullYear(),
        month: now.getMonth(),
      }),
  });

  if (dashboardQuery.isLoading || currencyQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-xl bg-muted/40 animate-pulse" />
        <div className="h-72 rounded-xl bg-muted/40 animate-pulse" />
        <div className="h-64 rounded-xl bg-muted/40 animate-pulse" />
      </div>
    );
  }

  if (dashboardQuery.error || currencyQuery.error || !dashboardQuery.data) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">Failed to load dashboard.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            void dashboardQuery.refetch();
            void currencyQuery.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  const { incomeTotal, expenseTotal, chartData, recentTransactions } = dashboardQuery.data;
  const currency = currencyQuery.data ?? "USD";
  const chartMax = Math.max(
    1,
    ...chartData.flatMap((point) => [point.income, point.expense]),
  );
  const width = 640;
  const height = 220;
  const leftPad = 24;
  const rightPad = 12;
  const topPad = 12;
  const bottomPad = 28;
  const xStep = (width - leftPad - rightPad) / 11;
  const yScale = (height - topPad - bottomPad) / chartMax;
  const getPoint = (idx: number, value: number) => ({
    x: leftPad + idx * xStep,
    y: height - bottomPad - value * yScale,
  });
  const incomePath = chartData
    .map((point, idx) => {
      const { x, y } = getPoint(idx, point.income);
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  const expensePath = chartData
    .map((point, idx) => {
      const { x, y } = getPoint(idx, point.expense);
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  const monthLabels = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

  return (
    <div className="space-y-6">
      <Card className="bg-linear-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-lg gap-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
            <Wallet className="h-4 w-4" /> This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-80 text-lg">Total Income</span>
              <span className="font-bold text-lg">
                <FormattedAmount amount={incomeTotal} type="income" currency={currency} />
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-80 text-lg">Total Expenses</span>
              <span className="font-bold text-lg">
                <FormattedAmount amount={expenseTotal} type="expense" currency={currency} />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ChartLine className="h-5 w-5" /> Year Trend
          </h2>
        </div>
        <Card className="shadow-sm">
          <CardContent>
            <div className="flex items-center gap-4 text-xs mb-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Income</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Expense</span>
              </div>
            </div>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-44"
              role="img"
              aria-label={`Income and expense trend for ${now.getFullYear()}`}
            >
              <line
                x1={leftPad}
                y1={height - bottomPad}
                x2={width - rightPad}
                y2={height - bottomPad}
                stroke="currentColor"
                className="text-border"
              />
              <path d={incomePath} fill="none" stroke="#22c55e" strokeWidth="3" />
              <path d={expensePath} fill="none" stroke="#ef4444" strokeWidth="3" />
              {chartData.map((point, idx) => {
                const incomePoint = getPoint(idx, point.income);
                const expensePoint = getPoint(idx, point.expense);
                return (
                  <g key={idx}>
                    <circle cx={incomePoint.x} cy={incomePoint.y} r="3.5" fill="#22c55e" />
                    <circle cx={expensePoint.x} cy={expensePoint.y} r="3.5" fill="#ef4444" />
                    <text
                      x={incomePoint.x}
                      y={height - 8}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[11px]"
                    >
                      {monthLabels[idx]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5" /> Recent
          </h2>
          <Link href={`/sheet/${sheetId}/history`} className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>
        <Card className="shadow-sm p-0">
          <CardContent className="p-0">
            {recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                <CreditCard className="h-10 w-10 opacity-20" />
                <p>No transactions yet.</p>
              </div>
            ) : (
              <div className="divide-y">
                {recentTransactions.map((tx) => {
                  const Icon = getLucideIcon(tx.categoryIcon) || LayoutGrid;
                  const creatorName =
                    tx.creatorDisplayName || tx.creatorEmail || "Unknown user";

                  return (
                    <div
                      key={tx.id}
                      className="px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center ${
                            tx.type === "expense"
                              ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                          }`}
                        >
                          {createElement(Icon, { className: "h-4 w-4" })}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {tx.description || tx.categoryName}
                          </p>
                          <p className="text-[11px] text-muted-foreground capitalize">
                            {tx.type} · {new Date(tx.date).toLocaleDateString()}
                          </p>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <UserAvatar
                              email={tx.creatorEmail}
                              displayName={tx.creatorDisplayName}
                              avatarUrl={tx.creatorAvatarUrl}
                              size="xs"
                            />
                            <span className="truncate">{creatorName}</span>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`shrink-0 text-sm font-bold ${
                          tx.type === "expense"
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        <FormattedAmount amount={tx.amount} type={tx.type} currency={currency} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
