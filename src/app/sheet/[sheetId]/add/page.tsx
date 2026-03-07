import { redirect } from "next/navigation";

export default async function LegacyAddPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  redirect(`/sheet/${sheetId}/transactions/add`);
}
