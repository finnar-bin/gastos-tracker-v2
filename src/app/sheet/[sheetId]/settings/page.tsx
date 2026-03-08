import { requireSheetAccess } from "@/lib/auth/sheets";
import {
  Settings,
  PlusCircle,
  Key,
  Repeat,
  Users,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  await requireSheetAccess(sheetId);

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      <Header
        title="Settings"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}`}
        icon={Settings}
      />
      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">
            Sheet Settings
          </h2>
          <div className="flex flex-col space-y-3">
            <Link
              href={`/sheet/${sheetId}/settings/category`}
              className="group flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors"
            >
              <PlusCircle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              Add Category
            </Link>
            <Link
              href={`/sheet/${sheetId}/settings/general`}
              className="group flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors"
            >
              <SlidersHorizontal className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              General Settings
            </Link>
            <Link
              href={`/sheet/${sheetId}/settings/recurring`}
              className="group flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors"
            >
              <Repeat className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              Recurring Transactions
            </Link>
            <Link
              href={`/sheet/${sheetId}/settings/payment-types`}
              className="group flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors"
            >
              <WalletCards className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              Payment Types
            </Link>
            <Link
              href={`/sheet/${sheetId}/settings/users`}
              className="group flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors"
            >
              <Users className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              Manage Users
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">
            Profile Settings
          </h2>
          <div className="flex flex-col space-y-3">
            <Link
              href="/settings/password"
              className="group flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors"
            >
              <Key className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              Update Password
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
