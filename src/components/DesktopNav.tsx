"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, PlusCircle, History, Settings } from "lucide-react";
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
      name: "Year Review",
      href: `/sheet/${sheetId}/year-overview`,
      icon: Calendar,
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
        <Link href={`/sheet/${sheetId}/add`}>
          <Button
            className="w-full justify-start gap-2 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
            size="lg"
          >
            <PlusCircle className="h-5 w-5" />
            Add Transaction
          </Button>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
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
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <Link href="/sheet">
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground"
          >
            Change Sheet
          </Button>
        </Link>
      </div>
    </aside>
  );
}
