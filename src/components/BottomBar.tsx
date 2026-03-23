"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutList, PlusCircle, History, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSheetPermissions } from "@/hooks/use-sheet-permissions";
import { type SheetRole } from "@/lib/auth/sheet-permissions";
import { useSheetNavigationPrefetch } from "@/components/use-sheet-navigation-prefetch";

interface BottomBarProps {
  sheetId: string;
  role: SheetRole;
}

export function BottomBar({ sheetId, role }: BottomBarProps) {
  const pathname = usePathname();
  const permissions = useSheetPermissions(role);
  const {
    routes,
    prefetchNavigationTargetForTouch,
    prefetchRouteForTouch,
  } = useSheetNavigationPrefetch(sheetId);

  const navItems = [
    {
      name: "Home",
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
    ...(permissions.canAddTransaction
      ? [
          {
            name: "Add",
            href: routes.addTransaction,
            icon: PlusCircle,
            isAction: true,
          },
        ]
      : []),
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-[0_-4px_10px_rgba(0,0,0,0.02)] dark:shadow-[0_-4px_10px_rgba(0,0,0,0.2)] md:hidden">
      <div className="flex h-16 items-center justify-around px-2 max-w-md mx-auto relative">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (pathname.startsWith(item.href + "/") &&
              item.href !== `/sheet/${sheetId}`);
          // Exception for exact matching root sheet ID to not highlight home on child routes unnecessarily
          const isHomeExact =
            item.name === "Home" && pathname === `/sheet/${sheetId}`;
          const finalActive = item.name === "Home" ? isHomeExact : isActive;

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                onTouchStart={() => prefetchRouteForTouch(item.href)}
                className="relative -top-8 flex flex-col items-center justify-center gap-1 group w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
              >
                <item.icon className="h-7 w-7" />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onTouchStart={() =>
                "target" in item && item.target
                  ? prefetchNavigationTargetForTouch(item.target)
                  : prefetchRouteForTouch(item.href)
              }
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-14 h-full",
                finalActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground transition-colors",
              )}
            >
              <div
                className={cn(
                  "flex flex-col items-center justify-center p-1 rounded-2xl transition-all",
                  finalActive
                    ? "bg-primary/10"
                    : "bg-transparent group-hover:bg-accent",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    finalActive ? "scale-110" : "",
                  )}
                />
              </div>
              <span className="text-[10px] font-medium leading-none text-center">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
