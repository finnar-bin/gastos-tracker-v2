"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PlusCircle,
  History,
  Settings,
  LayoutList,
  Layers2,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSheetPermissions } from "@/hooks/use-sheet-permissions";
import { type SheetRole } from "@/lib/auth/sheet-permissions";
import { useSheetNavigationPrefetch } from "@/components/use-sheet-navigation-prefetch";
import { TransactionFormDialog } from "@/app/sheet/[sheetId]/transactions/transaction-form-dialog";

interface DesktopNavProps {
  sheetId: string;
  role: SheetRole;
}

export function DesktopNav({ sheetId, role }: DesktopNavProps) {
  const pathname = usePathname();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const permissions = useSheetPermissions(role);
  const { routes, prefetchNavigationTarget, prefetchRoute, prefetchAddTransactionFormForIntent } =
    useSheetNavigationPrefetch(sheetId);

  const navItems = [
    {
      name: "Dashboard",
      href: routes.dashboard,
      target: "dashboard" as const,
      icon: Home,
    },
    {
      name: "Transactions",
      href: routes.transactions,
      target: "transactions" as const,
      icon: LayoutList,
    },
    {
      name: "History",
      href: routes.history,
      target: "history" as const,
      icon: History,
    },
    {
      name: "Settings",
      href: routes.settings,
      target: "settings" as const,
      icon: Settings,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-muted/20 min-h-screen fixed left-0 top-0 bottom-0 z-40">
      <div className="p-6">
        <h2 className="text-xl font-bold tracking-tight">Gastos Tracker</h2>
      </div>

      {permissions.canAddTransaction && (
        <div className="px-4 pb-6">
          <Button
            type="button"
            onMouseEnter={prefetchAddTransactionFormForIntent}
            onFocus={prefetchAddTransactionFormForIntent}
            onClick={() => setAddDialogOpen(true)}
            variant="outline"
            className="w-full justify-start gap-2 border-emerald-700 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-800"
            size="lg"
          >
            <PlusCircle className="h-5 w-5" />
            Add Transaction
          </Button>
          {addDialogOpen ? (
            <TransactionFormDialog
              sheetId={sheetId}
              mode="add"
              transactionType="expense"
              cancelHref={pathname}
              inPlace
              asDialog
              open={addDialogOpen}
              onOpenChangeAction={setAddDialogOpen}
              onCancelAction={() => setAddDialogOpen(false)}
              onCompletedAction={() => setAddDialogOpen(false)}
            />
          ) : null}
        </div>
      )}

      <nav className="flex-1 px-4 pb-4 flex flex-col">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (pathname.startsWith(item.href + "/") &&
                item.href !== `/sheet/${sheetId}`);
            const isHomeExact =
              item.name === "Dashboard" && pathname === `/sheet/${sheetId}`;
            const finalActive =
              item.name === "Dashboard" ? isHomeExact : isActive;

            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => prefetchNavigationTarget(item.target)}
                onFocus={() => prefetchNavigationTarget(item.target)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  finalActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto pt-4 border-t border-border space-y-1">
          <Link
            href={routes.sheetSelector}
            onMouseEnter={() => prefetchRoute(routes.sheetSelector)}
            onFocus={() => prefetchRoute(routes.sheetSelector)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Layers2 className="h-4 w-4" />
            Change Sheet
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </nav>
    </aside>
  );
}
