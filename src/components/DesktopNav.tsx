"use client";

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

interface DesktopNavProps {
  sheetId: string;
}

export function DesktopNav({ sheetId }: DesktopNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard",
      href: `/sheet/${sheetId}`,
      icon: Home,
    },
    {
      name: "Transactions",
      href: `/sheet/${sheetId}/transactions`,
      icon: LayoutList,
    },
    {
      name: "History",
      href: `/sheet/${sheetId}/history`,
      icon: History,
    },
    {
      name: "Settings",
      href: `/sheet/${sheetId}/settings`,
      icon: Settings,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-muted/20 min-h-screen fixed left-0 top-0 bottom-0 z-40">
      <div className="p-6">
        <h2 className="text-xl font-bold tracking-tight">Gastos Tracker</h2>
      </div>

      <div className="px-4 pb-6">
        <Link href={`/sheet/${sheetId}/transactions/add`}>
          <Button
            className="w-full justify-start gap-2 shadow-sm outline-solid outline-2 outline-emerald-700 bg-transparent hover:bg-emerald-50 hover:text-emerald-800 text-emerald-700"
            size="lg"
          >
            <PlusCircle className="h-5 w-5" />
            Add Transaction
          </Button>
        </Link>
      </div>

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
            href="/sheet"
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
