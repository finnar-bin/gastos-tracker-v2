import { redirect } from "next/navigation";

export default async function LegacyOverviewPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  redirect(`/sheet/${sheetId}`);
}
