import { requireSheetAccess } from "@/lib/auth/sheets";
import { Settings, PlusCircle, Key, Repeat, Users } from "lucide-react";
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
              className="flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors"
            >
              <PlusCircle className="h-5 w-5 text-muted-foreground" />
              Add Category
            </Link>
            <Link
              href={`/sheet/${sheetId}/settings/recurring`}
              className="flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors"
            >
              <Repeat className="h-5 w-5 text-muted-foreground" />
              Recurring Transactions
            </Link>
            <Link
              href={`/sheet/${sheetId}/settings/users`}
              className="flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors"
            >
              <Users className="h-5 w-5 text-muted-foreground" />
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
              className="flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors"
            >
              <Key className="h-5 w-5 text-muted-foreground" />
              Update Password
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
