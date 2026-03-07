"use client";

import { useRouter } from "next/navigation";
import { TrendingDown, TrendingUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabHeader } from "@/components/tab-header";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function TransactionsFilter({
  month,
  year,
  sheetId,
  type,
}: {
  month: number;
  year: number;
  sheetId: string;
  type: "income" | "expense";
}) {
  const router = useRouter();

  const navigateWithFilters = ({
    nextMonth = month.toString(),
    nextYear = year.toString(),
    nextType = type,
  }: {
    nextMonth?: string;
    nextYear?: string;
    nextType?: "income" | "expense";
  }) => {
    const params = new URLSearchParams({
      month: nextMonth,
      year: nextYear,
      type: nextType,
    });

    router.push(`/sheet/${sheetId}/transactions?${params.toString()}`);
  };

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Select
          value={month.toString()}
          onValueChange={(val) => navigateWithFilters({ nextMonth: val })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i} value={i.toString()}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={year.toString()}
          onValueChange={(val) => navigateWithFilters({ nextYear: val })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TabHeader
        value={type}
        onChangeAction={(value) =>
          navigateWithFilters({ nextType: value as "income" | "expense" })
        }
        items={[
          {
            value: "income",
            label: "Income",
            icon: <TrendingUp className="h-4 w-4" />,
          },
          {
            value: "expense",
            label: "Expense",
            icon: <TrendingDown className="h-4 w-4" />,
          },
        ]}
      />
    </div>
  );
}
