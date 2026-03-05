"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function getSafeNextPath(next: string | null) {
  if (!next) return "/sheet";
  if (!next.startsWith("/")) return "/sheet";
  if (next.startsWith("//")) return "/sheet";
  return next;
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  const next = getSafeNextPath((formData.get("next") as string) || null);

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect(`/login?error=true&next=${encodeURIComponent(next)}`);
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function loginWithGoogle(nextPath?: string) {
  const supabase = await createClient();
  const next = getSafeNextPath(nextPath || null);
  const { data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (data.url) {
    redirect(data.url);
  }
}
