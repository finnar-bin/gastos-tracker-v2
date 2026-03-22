"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FormActionResult } from "@/lib/form-state";

function getSafeNextPath(next: string | null) {
  if (!next) return "/sheet";
  if (!next.startsWith("/")) return "/sheet";
  if (next.startsWith("//")) return "/sheet";
  return next;
}

type LoginFormResult = FormActionResult & {
  defaultValues?: {
    email: string;
  };
};

export async function login(formData: FormData): Promise<LoginFormResult> {
  const supabase = await createClient();

  const email = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";
  const next = getSafeNextPath((formData.get("next") as string) || null);
  const defaultValues = { email };
  const fieldErrors: FormActionResult["fieldErrors"] = {};

  if (!email) fieldErrors.email = "Email is required.";
  if (!password) fieldErrors.password = "Password is required.";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors,
      defaultValues,
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: "Invalid email or password.",
      defaultValues,
    };
  }

  revalidatePath("/", "layout");
  return { redirectTo: next };
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
