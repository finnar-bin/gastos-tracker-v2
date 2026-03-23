"use client";

import { useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  LayoutGrid,
  Repeat,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { fetchRecurringOverview } from "@/lib/recurring-overview";
import { fetchSheetMemberDirectory } from "@/lib/sheet-member-directory";
import { fetchSheetCurrency } from "@/lib/sheet-currency";
import { createClient } from "@/lib/supabase/client";
import { usePrefetchGuard } from "@/components/use-prefetch-guard";

const supabase = createClient();

function linkClassName() {
  return "group flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors";
}

export function SettingsLinks({ sheetId }: { sheetId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { shouldPrefetch } = usePrefetchGuard();

  const routes = useMemo(
    () =>
      ({
        general: `/sheet/${sheetId}/settings/general`,
        category: `/sheet/${sheetId}/settings/category`,
        recurring: `/sheet/${sheetId}/settings/recurring`,
        paymentTypes: `/sheet/${sheetId}/settings/payment-types`,
        users: `/sheet/${sheetId}/settings/users`,
      }) as const,
    [sheetId],
  );

  const prefetchRouteAndQueries = useCallback((route: keyof typeof routes) => {
    const href = routes[route];
    void router.prefetch(href);
    void queryClient.prefetchQuery({
      queryKey: queryKeys.sheetCurrency(sheetId),
      queryFn: () => fetchSheetCurrency(sheetId),
    });

    if (route === "category") {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.categories(sheetId, "expense"),
        queryFn: async () => {
          const { data, error } = await supabase
            .from("categories")
            .select(
              "id, name, icon, type, budget, due_date, due_reminder_frequency, created_at",
            )
            .eq("sheet_id", sheetId)
            .eq("type", "expense")
            .order("name", { ascending: true });

          if (error) {
            throw error;
          }

          return data ?? [];
        },
      });
    }

    if (route === "paymentTypes") {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.paymentTypes(sheetId),
        queryFn: async () => {
          const { data, error } = await supabase
            .from("payment_types")
            .select("id, name, icon, created_at")
            .eq("sheet_id", sheetId)
            .order("created_at", { ascending: false });

          if (error) {
            throw error;
          }

          return data ?? [];
        },
      });
    }

    if (route === "recurring") {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.recurring(sheetId),
        queryFn: () => fetchRecurringOverview(sheetId),
      });
    }

    if (route === "users") {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.users(sheetId),
        queryFn: async () => {
          const [memberDirectory, pendingInvitesResult] = await Promise.all([
            fetchSheetMemberDirectory(sheetId),
            supabase
              .from("sheet_invites")
              .select("id, invited_email, role, expires_at")
              .eq("sheet_id", sheetId)
              .eq("status", "pending")
              .gt("expires_at", new Date().toISOString()),
          ]);

          if (pendingInvitesResult.error) {
            throw pendingInvitesResult.error;
          }

          return {
            members: memberDirectory,
            pendingInvites: pendingInvitesResult.data ?? [],
          };
        },
      });
    }

    // Next.js route prefetch happens via Link, this keeps query cache warm.
    return href;
  }, [queryClient, router, routes, sheetId]);

  const prefetchRouteAndQueriesForTouch = useCallback((route: keyof typeof routes) => {
    if (!shouldPrefetch(`settings:${route}`)) {
      return;
    }

    prefetchRouteAndQueries(route);
  }, [prefetchRouteAndQueries, shouldPrefetch]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      prefetchRouteAndQueries("category");
      prefetchRouteAndQueries("paymentTypes");
      prefetchRouteAndQueries("recurring");
      prefetchRouteAndQueries("users");
    }, 200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [prefetchRouteAndQueries]);

  return (
    <div className="flex flex-col space-y-3">
      <Link
        href={routes.general}
        onMouseEnter={() => prefetchRouteAndQueries("general")}
        onFocus={() => prefetchRouteAndQueries("general")}
        onTouchStart={() => prefetchRouteAndQueriesForTouch("general")}
        className={linkClassName()}
      >
        <SlidersHorizontal className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        General Settings
      </Link>
      <Link
        href={routes.category}
        onMouseEnter={() => prefetchRouteAndQueries("category")}
        onFocus={() => prefetchRouteAndQueries("category")}
        onTouchStart={() => prefetchRouteAndQueriesForTouch("category")}
        className={linkClassName()}
      >
        <LayoutGrid className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        Categories
      </Link>
      <Link
        href={routes.recurring}
        onMouseEnter={() => prefetchRouteAndQueries("recurring")}
        onFocus={() => prefetchRouteAndQueries("recurring")}
        onTouchStart={() => prefetchRouteAndQueriesForTouch("recurring")}
        className={linkClassName()}
      >
        <Repeat className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        Recurring Transactions
      </Link>
      <Link
        href={routes.paymentTypes}
        onMouseEnter={() => prefetchRouteAndQueries("paymentTypes")}
        onFocus={() => prefetchRouteAndQueries("paymentTypes")}
        onTouchStart={() => prefetchRouteAndQueriesForTouch("paymentTypes")}
        className={linkClassName()}
      >
        <CreditCard className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        Payment Types
      </Link>
      <Link
        href={routes.users}
        onMouseEnter={() => prefetchRouteAndQueries("users")}
        onFocus={() => prefetchRouteAndQueries("users")}
        onTouchStart={() => prefetchRouteAndQueriesForTouch("users")}
        className={linkClassName()}
      >
        <Users className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        Manage Users
      </Link>
    </div>
  );
}
