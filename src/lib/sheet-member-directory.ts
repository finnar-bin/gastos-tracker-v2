import { createClient } from "@/lib/supabase/client";

export type SheetMemberProfile = {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: "viewer" | "editor" | "admin";
};

type SheetMemberDirectoryRow = {
  member_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: "viewer" | "editor" | "admin";
};

const supabase = createClient();

export async function fetchSheetMemberDirectory(sheetId: string) {
  const { data, error } = await supabase
    .from("sheet_member_directory")
    .select("member_id, email, display_name, avatar_url, role")
    .eq("sheet_id", sheetId)
    .order("display_name", { ascending: true, nullsFirst: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as SheetMemberDirectoryRow[]).map((row) => ({
    id: row.member_id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: row.role,
  })) satisfies SheetMemberProfile[];
}
