"use client";

import { CategoryPicker } from "@/components/category-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

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

export function HistoryFilter({
  month,
  year,
  sheetId,
  type,
  categoryId,
  categories,
}: {
  month: number;
  year: number;
  sheetId: string;
  type: "income" | "expense" | null;
  categoryId: string | null;
  categories: { id: string; name: string; type: "income" | "expense" }[];
}) {
  const router = useRouter();

  const navigateWithFilters = ({
    nextMonth = month.toString(),
    nextYear = year.toString(),
    nextType = type ?? "all",
    nextCategoryId = categoryId ?? "all",
  }: {
    nextMonth?: string;
    nextYear?: string;
    nextType?: string;
    nextCategoryId?: string;
  }) => {
    const params = new URLSearchParams({
      month: nextMonth,
      year: nextYear,
    });

    if (nextType !== "all") {
      params.set("type", nextType);
    }

    if (nextCategoryId !== "all") {
      params.set("categoryId", nextCategoryId);
    }

    router.push(`/sheet/${sheetId}/history?${params.toString()}`);
  };

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );

  return (
    <>
      <p className="text-sm font-medium text-foreground mb-2">Filters</p>
      <div className="grid grid-cols-2 gap-2 w-full">
        <div>
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
        </div>
        <div>
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
        <div>
          <Select
            value={type ?? "all"}
            onValueChange={(val) =>
              navigateWithFilters({ nextType: val, nextCategoryId: "all" })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <CategoryPicker
            categories={categories}
            includeAllOption
            allOptionLabel="All Categories"
            allOptionValue="all"
            placeholder="Category"
            value={categoryId ?? "all"}
            onValueChangeAction={(val) =>
              navigateWithFilters({ nextCategoryId: val })
            }
          />
        </div>
      </div>
    </>
  );
}
