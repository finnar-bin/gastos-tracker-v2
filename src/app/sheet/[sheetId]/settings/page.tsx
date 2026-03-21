import { execSync } from "node:child_process";
import { requireSheetAccess } from "@/lib/auth/sheets";
import {
  Settings,
  PlusCircle,
  // Key,
  Repeat,
  Users,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import packageJson from "../../../../../package.json";

function getGitHash() {
  const commitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    process.env.COMMIT_SHA;

  if (commitSha) {
    return commitSha.slice(0, 7);
  }

  try {
    return execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { sheet } = await requireSheetAccess(sheetId);
  const gitHash = getGitHash();
  const gitHref =
    gitHash === "unknown"
      ? "https://github.com/finnar-bin/gastos-tracker-v2"
      : `https://github.com/finnar-bin/gastos-tracker-v2/commit/${gitHash}`;

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      <Header
        title="Settings"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}`}
        icon={Settings}
        subtitle={sheet.name}
      />
      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">
            Sheet Settings
          </h2>
          <div className="flex flex-col space-y-3">
            <Link
              href={`/sheet/${sheetId}/settings/general`}
              className="group flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors"
            >
              <SlidersHorizontal className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              General Settings
            </Link>
            <Link
              href={`/sheet/${sheetId}/settings/category`}
              className="group flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors"
            >
              <PlusCircle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              Categories
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

        {/* TODO: Implement this in the future */}
        {/*<section className="space-y-4">
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
        </section>*/}
      </div>
      <div className="border-t pt-4 text-sm text-muted-foreground">
        <p>Version {packageJson.version}</p>
        <a
          href={gitHref}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-foreground transition-colors"
        >
          Git hash: {gitHash}
        </a>
      </div>
    </div>
  );
}
