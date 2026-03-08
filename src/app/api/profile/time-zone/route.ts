import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

function isValidIanaTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { timeZone?: string }
    | null;

  const timeZone = body?.timeZone?.trim();
  if (!timeZone || !isValidIanaTimeZone(timeZone)) {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!existing) {
    await db.insert(profiles).values({
      id: user.id,
      email: user.email ?? "",
      displayName:
        (user.user_metadata?.display_name as string | undefined) ?? null,
      avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      timeZone,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, created: true });
  }

  if (existing.timeZone === timeZone) {
    return NextResponse.json({ success: true, unchanged: true });
  }

  await db
    .update(profiles)
    .set({
      timeZone,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, user.id));

  return NextResponse.json({ success: true });
}
