"use client";

import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchDashboardSummary } from "@/lib/dashboard-summary";
import { fetchHistoryFeed } from "@/lib/history-feed";
import { queryKeys } from "@/lib/query-keys";
import { fetchSheetCurrency } from "@/lib/sheet-currency";
import { createClient } from "@/lib/supabase/client";
import { fetchTransactionOverview } from "@/lib/transaction-overview";
import { fetchTransactionFormData } from "@/lib/transaction-form-data";
import { usePrefetchGuard } from "@/components/use-prefetch-guard";

type NavigationTarget = "dashboard" | "history" | "transactions" | "settings";

export function useSheetNavigationPrefetch(sheetId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);
  const { shouldPrefetch } = usePrefetchGuard();
  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const month = now.getMonth();

  const routes = {
    dashboard: `/sheet/${sheetId}`,
    history: `/sheet/${sheetId}/history`,
    transactions: `/sheet/${sheetId}/transactions`,
    settings: `/sheet/${sheetId}/settings`,
    sheetSelector: "/sheet",
  } as const;

  const prefetchRoute = (href: string) => {
    void router.prefetch(href);
  };

  const prefetchDashboardQueries = () =>
    Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.sheetCurrency(sheetId),
        queryFn: () => fetchSheetCurrency(sheetId),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboard(sheetId),
        queryFn: () =>
          fetchDashboardSummary({
            sheetId,
            year,
            month,
          }),
      }),
    ]);

  const prefetchHistoryQueries = () =>
    Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.sheetCurrency(sheetId),
        queryFn: () => fetchSheetCurrency(sheetId),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.categories(sheetId),
        queryFn: async () => {
          const { data, error } = await supabase
            .from("categories")
            .select("id, name, type, icon")
            .eq("sheet_id", sheetId)
            .order("name", { ascending: true });

          if (error) {
            throw error;
          }

          return data ?? [];
        },
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.history(sheetId, {
          year,
          month,
          type: null,
          categoryId: null,
        }),
        queryFn: () =>
          fetchHistoryFeed({
            sheetId,
            year,
            month,
            type: null,
            categoryId: null,
          }),
      }),
    ]);

  const prefetchTransactionsQueries = () =>
    Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.sheetCurrency(sheetId),
        queryFn: () => fetchSheetCurrency(sheetId),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.transactionsOverview(sheetId, {
          year,
          month,
          type: "expense",
        }),
        queryFn: () =>
          fetchTransactionOverview({
            sheetId,
            year,
            month,
            type: "expense",
          }),
      }),
    ]);

  const prefetchAddTransactionFormQueries = () =>
    queryClient.prefetchQuery({
      queryKey: queryKeys.transactionForm(sheetId, "add", "new", "expense"),
      queryFn: () =>
        fetchTransactionFormData({
          supabase,
          sheetId,
          mode: "add",
        }),
    });

  const prefetchNavigationTarget = (target: NavigationTarget) => {
    switch (target) {
      case "dashboard":
        prefetchRoute(routes.dashboard);
        void prefetchDashboardQueries();
        return;
      case "history":
        prefetchRoute(routes.history);
        void prefetchHistoryQueries();
        return;
      case "transactions":
        prefetchRoute(routes.transactions);
        void prefetchTransactionsQueries();
        return;
      case "settings":
        prefetchRoute(routes.settings);
        return;
      default:
        return;
    }
  };

  const prefetchRouteForTouch = (href: string) => {
    if (!shouldPrefetch(`route:${href}`)) {
      return;
    }

    prefetchRoute(href);
  };

  const prefetchNavigationTargetForTouch = (target: NavigationTarget) => {
    if (!shouldPrefetch(`target:${target}`)) {
      return;
    }

    prefetchNavigationTarget(target);
  };

  const prefetchAddTransactionFormForIntent = () => {
    if (!shouldPrefetch("form:add-transaction")) {
      return;
    }

    void prefetchAddTransactionFormQueries();
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void router.prefetch(routes.dashboard);
      void router.prefetch(routes.history);
      void router.prefetch(routes.transactions);
      void router.prefetch(routes.settings);
      void queryClient.prefetchQuery({
        queryKey: queryKeys.sheetCurrency(sheetId),
        queryFn: () => fetchSheetCurrency(sheetId),
      });
      void queryClient.prefetchQuery({
        queryKey: queryKeys.dashboard(sheetId),
        queryFn: () =>
          fetchDashboardSummary({
            sheetId,
            year,
            month,
          }),
      });
    }, 150);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    month,
    queryClient,
    router,
    routes.dashboard,
    routes.history,
    routes.settings,
    routes.transactions,
    sheetId,
    year,
  ]);

  return {
    routes,
    prefetchRoute,
    prefetchNavigationTarget,
    prefetchRouteForTouch,
    prefetchNavigationTargetForTouch,
    prefetchAddTransactionFormForIntent,
  };
}
