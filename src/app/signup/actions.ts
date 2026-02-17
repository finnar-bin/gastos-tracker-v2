"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function signup(previousState: unknown, formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;

  const defaultValues = {
    email,
    displayName,
    password,
  };

  // Server-side validation
  if (!email || !password || !displayName) {
    return { error: "All fields are required", defaultValues };
  }

  if (password.length < 6) {
    return {
      error: "Password must be at least 6 characters",
      defaultValues,
    };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Invalid email format", defaultValues };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        full_name: displayName, // Saving as both for compatibility
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message, defaultValues };
  }

  revalidatePath("/", "layout");
  redirect("/sheet");
}
