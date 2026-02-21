import { BottomBar } from "@/components/BottomBar";
import { DesktopNav } from "@/components/DesktopNav";

export default async function SheetLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  return (
    <div className="flex min-h-screen w-full">
      <DesktopNav sheetId={sheetId} />
      <div className="flex-1 pb-16 md:pb-0 md:ml-64 w-full">{children}</div>
      <BottomBar sheetId={sheetId} />
    </div>
  );
}
