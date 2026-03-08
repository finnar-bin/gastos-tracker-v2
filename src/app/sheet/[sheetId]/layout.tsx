import { BottomBar } from "@/components/BottomBar";
import { DesktopNav } from "@/components/DesktopNav";
import { requireSheetAccess } from "@/lib/auth/sheets";

export default async function SheetLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const { role } = await requireSheetAccess(sheetId);
  return (
    <div className="flex min-h-screen w-full">
      <DesktopNav sheetId={sheetId} role={role} />
      <div className="flex-1 pb-16 md:pb-0 md:ml-64 w-full">{children}</div>
      <BottomBar sheetId={sheetId} role={role} />
    </div>
  );
}
